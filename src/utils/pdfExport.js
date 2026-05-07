/**
 * PDF-Export Modul
 *
 * Strategie (Hybrid):
 *  - Hintergrund → renderBackground() aus backgroundRenderer.js
 *                  → Canvas → PNG (beim ersten Export gecacht)
 *                  → PDF als Bild-Layer
 *  - Text        → jsPDF .text() als Vektor-Layer
 *
 * Vorteile:
 *  - Hintergrund-Logik nur an einer Stelle (backgroundRenderer.js)
 *  - Text bleibt scharf/durchsuchbar/kopierbar
 *  - Background-Cache: zweiter Export dauert <5ms
 *
 * @module pdfExport
 */

import { jsPDF } from 'jspdf';
import { PHYSICAL, PDF, COLORS, CANVAS } from './constants.js';
import { renderBackground } from './backgroundRenderer.js';
import { registerFonts } from './fontLoader.js';

// ===== Hintergrund-Cache =====
// Wird beim ersten Export einmalig erzeugt und danach wiederverwendet
let backgroundImageCache = null;

/**
 * Rendert den gesamten Namensschild (Hintergrund + Text) auf ein Canvas
 * und gibt das Ergebnis als PNG Data-URL zurück.
 * 
 * Diese Methode vermeidet Font-Probleme mit jsPDF, da der gesamte
 * Namensschild als Bild eingebunden wird.
 * 
 * @param {Object} data - { firstName, lastName, phoneNumber, email }
 * @param {string} font - Font-Name
 * @param {number} scale - Skalierungsfaktor für Qualität
 * @returns {string} PNG Data-URL
 */
function renderNamensschildToImage(data, font, scale = 4) {
  const canvas = document.createElement('canvas');
  canvas.width  = CANVAS.WIDTH * scale;
  canvas.height = CANVAS.HEIGHT * scale;

  const ctx = canvas.getContext('2d');
  
  // Auf Zielgröße skalieren
  ctx.scale(scale, scale);
  
  // Hintergrund rendern
  renderBackground(ctx);
  
  // Text rendern (identisch mit Preview)
  ctx.textBaseline = 'top';
  
  // Namens-Größe berechnen
  let nameSize = CANVAS.INITIAL_NAME_SIZE;
  if (data.firstName) {
    nameSize = Math.min(nameSize, CANVAS.INITIAL_NAME_SIZE);
  }
  if (data.lastName) {
    nameSize = Math.min(nameSize, CANVAS.INITIAL_NAME_SIZE);
  }
  
  const nameLineH = nameSize + CANVAS.LINE_SPACING;
  
  // Vorname
  if (data.firstName) {
    ctx.font = `bold ${nameSize}px ${font}`;
    ctx.fillStyle = `rgb(${COLORS.TEXT_WHITE_RGB.join(',')})`;
    ctx.fillText(data.firstName, CANVAS.LEFT_PADDING, CANVAS.TOP_PADDING);
  }
  
  // Nachname
  if (data.lastName) {
    ctx.font = `bold ${nameSize}px ${font}`;
    ctx.fillStyle = `rgb(${COLORS.TEXT_WHITE_RGB.join(',')})`;
    ctx.fillText(data.lastName, CANVAS.LEFT_PADDING, CANVAS.TOP_PADDING + nameLineH);
  }
  
  // Info-Größe berechnen
  let infoSize = CANVAS.INITIAL_INFO_SIZE;
  
  // Telefonnummer
  if (data.phoneNumber) {
    ctx.font = `normal ${infoSize}px ${font}`;
    ctx.fillStyle = `rgb(${COLORS.TEXT_WHITE_RGB.join(',')})`;
    ctx.fillText(data.phoneNumber, CANVAS.LEFT_PADDING, CANVAS.TOP_PADDING + (nameLineH * 2));
  }
  
  // E-Mail
  if (data.email) {
    const lines = data.email.split('/').map(l => l.trim()).filter(Boolean);
    ctx.font = `normal ${infoSize}px ${font}`;
    ctx.fillStyle = `rgb(${COLORS.TEXT_WHITE_RGB.join(',')})`;
    
    let currentY = CANVAS.TOP_PADDING + (nameLineH * 2) + infoSize + CANVAS.LINE_SPACING;
    lines.forEach(line => {
      if (currentY < CANVAS.HEIGHT - CANVAS.TOP_PADDING) {
        ctx.fillText(line, CANVAS.LEFT_PADDING, currentY);
        currentY += infoSize + 4;
      }
    });
  }
  
  return canvas.toDataURL('image/png');
}

/**
 * Rendert den Hintergrund auf ein Offscreen-Canvas und gibt
 * das Ergebnis als PNG Data-URL zurück.
 *
 * Skalierungsfaktor bestimmt die Druckqualität:
 *  - 3× → ~288 DPI  (gut für normalen Druck)
 *  - 4× → ~384 DPI  (gut für hochwertigen Druck)
 *
 * @param {number} [scale=4] - Skalierungsfaktor
 * @returns {string} PNG Data-URL (gecacht nach erstem Aufruf)
 */
function getBackgroundImage(scale = 4) {
  if (backgroundImageCache) {
    return backgroundImageCache;
  }

  const offscreen = document.createElement('canvas');
  offscreen.width  = CANVAS.WIDTH  * scale;
  offscreen.height = CANVAS.HEIGHT * scale;

  const ctx = offscreen.getContext('2d');

  // Auf Zielgröße skalieren, dann exakt denselben Code wie die Vorschau nutzen
  ctx.scale(scale, scale);
  renderBackground(ctx);

  backgroundImageCache = offscreen.toDataURL('image/png');
  console.log(`✓ Hintergrund gecacht (${offscreen.width}×${offscreen.height}px)`);

  return backgroundImageCache;
}

// ===== Hilfsfunktionen =====

/**
 * Ermittelt den aktiven Font-Namen (Roboto oder Helvetica-Fallback)
 * @param {jsPDF} doc
 * @returns {string}
 */
function getActiveFont(doc) {
  try {
    doc.setFont('Roboto', 'normal');
    // Test ob der Font wirklich funktioniert
    const testText = 'Test';
    const width = doc.getTextWidth(testText);
    if (width > 0) {
      return 'Roboto';
    }
  } catch (err) {
    console.warn('⚠️ Roboto Font nicht nutzbar, nutze Helvetica-Fallback:', err.message);
  }
  return 'helvetica';
}

/**
 * Reduziert die Schriftgröße schrittweise bis der Text in maxWidthMM passt
 *
 * @param {jsPDF} doc
 * @param {string} text
 * @param {number} maxWidthMM
 * @param {number} initialSizePt
 * @param {string} fontStyle - 'bold' | 'normal'
 * @param {string} fontName
 * @returns {number} Angepasste Schriftgröße in pt
 */
function fitFontSize(doc, text, maxWidthMM, initialSizePt, fontStyle, fontName) {
  let size = initialSizePt;
  doc.setFont(fontName, fontStyle);

  while (size > PDF.MIN_FONT_SIZE_PT) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidthMM) return size;
    size -= 0.5;
  }

  return PDF.MIN_FONT_SIZE_PT;
}

/**
 * Zeichnet alle Textinhalte als Vektor ins PDF
 *
 * @param {jsPDF} doc
 * @param {Object} data     - { firstName, lastName, phoneNumber, email }
 * @param {string} font     - Aktiver Font-Name
 * @param {number} [ox=0]   - X-Offset in mm (für A4-Layout)
 * @param {number} [oy=0]   - Y-Offset in mm (für A4-Layout)
 */
function drawText(doc, data, font, ox = 0, oy = 0) {
  doc.setTextColor(...COLORS.TEXT_WHITE_RGB);

  let y = PHYSICAL.TOP_PADDING_MM;
  const x = PHYSICAL.LEFT_PADDING_MM;

  // ===== Einheitliche Namens-Größe =====
  let nameSize = PDF.NAME_FONT_SIZE_PT;

  if (data.firstName) {
    nameSize = Math.min(nameSize, fitFontSize(
      doc, data.firstName, PHYSICAL.MAX_NAME_WIDTH_MM, nameSize, 'bold', font
    ));
  }
  if (data.lastName) {
    nameSize = Math.min(nameSize, fitFontSize(
      doc, data.lastName, PHYSICAL.MAX_NAME_WIDTH_MM, nameSize, 'bold', font
    ));
  }

  const nameLineH = nameSize * 0.3528; // pt → mm

  // Vorname
  if (data.firstName) {
    doc.setFont(font, 'bold');
    doc.setFontSize(nameSize);
    doc.text(data.firstName, ox + x, oy + y);
    y += nameLineH + PDF.LINE_SPACING_MM;
  }

  // Nachname
  if (data.lastName) {
    doc.setFont(font, 'bold');
    doc.setFontSize(nameSize);
    doc.text(data.lastName, ox + x, oy + y);
    y += nameLineH + PDF.LINE_SPACING_MM;
  }

  // ===== Einheitliche Info-Größe =====
  let infoSize = PDF.INFO_FONT_SIZE_PT;

  if (data.phoneNumber) {
    infoSize = Math.min(infoSize, fitFontSize(
      doc, data.phoneNumber, PHYSICAL.MAX_INFO_WIDTH_MM, infoSize, 'normal', font
    ));
  }
  if (data.email) {
    data.email.split('/').map(l => l.trim()).filter(Boolean).forEach(line => {
      infoSize = Math.min(infoSize, fitFontSize(
        doc, line, PHYSICAL.MAX_INFO_WIDTH_MM, infoSize, 'normal', font
      ));
    });
  }

  const infoLineH = infoSize * 0.3528;

  // Telefonnummer
  if (data.phoneNumber) {
    doc.setFont(font, 'normal');
    doc.setFontSize(infoSize);
    doc.text(data.phoneNumber, ox + x, oy + y);
    y += infoLineH + PDF.LINE_SPACING_MM;
  }

  // E-Mail (mit "/" als Zeilenumbruch)
  if (data.email) {
    const lines = data.email.split('/').map(l => l.trim()).filter(Boolean);
    doc.setFont(font, 'normal');
    doc.setFontSize(infoSize);

    for (const line of lines) {
      if (y < PHYSICAL.HEIGHT_MM - PHYSICAL.TOP_PADDING_MM) {
        doc.text(line, ox + x, oy + y);
        y += infoLineH + 1; // +1 for additional spacing between email lines
      }
    }
  }
}

// ===== Öffentliche Export-Funktionen =====

/**
 * Exportiert auf DIN 10:03 PM (mit Schnittmarkierungen)
 *
 * @param {Object} data - Benutzerdaten
 */
export async function exportA4Pdf(data) {
  if (!data.firstName && !data.lastName) {
    alert('Bitte mindestens Vor- oder Nachname eingeben.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  await registerFonts(doc);
  const font = getActiveFont(doc);

  const ox = 10;
  const oy = 10;
  const w  = PHYSICAL.WIDTH_MM;
  const h  = PHYSICAL.HEIGHT_MM;

  // 1️⃣ Hintergrund als Bild (gecacht, identisch mit Vorschau)
  const bgImage = getBackgroundImage();
  doc.addImage(bgImage, 'PNG', ox, oy, w, h);

  // 2️⃣ Text als Vektor (oder Image-Fallback bei Font-Problemen)
  const useImageFallback = font !== 'Roboto';
  if (useImageFallback) {
    console.log('ℹ️  Use Image-Fallback für Text (Font-Problem)');
    const textImage = renderNamensschildToImage(data, font === 'helvetica' ? 'sans-serif' : 'Roboto', 4);
    doc.addImage(textImage, 'PNG', ox, oy, w, h);
  } else {
    drawText(doc, data, font, ox, oy);
  }

  // 3️⃣ Schnittmarkierungen
  const m = 4;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);

  doc.line(ox - m, oy,     ox - 1, oy    );  // oben links  – horizontal
  doc.line(ox,     oy - m, ox,     oy - 1);  // oben links  – vertikal
  doc.line(ox + w + 1, oy,     ox + w + m, oy    );  // oben rechts – horizontal
  doc.line(ox + w,     oy - m, ox + w,     oy - 1);  // oben rechts – vertikal
  doc.line(ox - m, oy + h, ox - 1,     oy + h    );  // unten links  – horizontal
  doc.line(ox,     oy + h + 1, ox,     oy + h + m);  // unten links  – vertikal
  doc.line(ox + w + 1, oy + h, ox + w + m, oy + h    );  // unten rechts – horizontal
  doc.line(ox + w,     oy + h + 1, ox + w, oy + h + m);  // unten rechts – vertikal

  // Hinweistext
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont(font, 'normal');
  doc.text('✂ Entlang der Markierungen ausschneiden', ox, oy + h + 12);

  const fileName = `Namensschild_${data.firstName || 'X'}_${data.lastName || 'X'}_A4.pdf`;
  doc.save(fileName);
  console.log('✓ A4 PDF gespeichert:', fileName);
}