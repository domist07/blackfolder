/**
 * PDF-Export Modul
 * 
 * Strategie:
 * - Hintergrund (rot + Logo + Streifen) → High-Res Canvas → Bild im PDF
 * - Text → jsPDF Vektor-API (scharf bei jeder Zoomstufe)
 * 
 * So sieht das PDF exakt aus wie die Vorschau, der Text bleibt aber Vektor.
 * 
 * @module pdfExport
 */

import { jsPDF } from 'jspdf';
import { PHYSICAL, PDF, COLORS, FONTS, CANVAS } from './constants.js';
import { renderBackground } from './backgroundRenderer.js';
import { registerFonts } from './fontLoader.js';

// ===== Hochauflösungs-Konstanten =====
const HIRES_SCALE = 6; // 6× Canvas-Auflösung ≈ 570 DPI

/**
 * Erstellt ein hochaufgelöstes Bild nur vom Hintergrund (ohne Text)
 * Enthält: Rote Fläche + LJC-Logo + Dekorative Streifen
 * 
 * @returns {string} PNG Data-URL des Hintergrunds
 */
function createHiResBackgroundImage() {
  const hiResCanvas = document.createElement('canvas');
  hiResCanvas.width = CANVAS.WIDTH * HIRES_SCALE;
  hiResCanvas.height = CANVAS.HEIGHT * HIRES_SCALE;
  
  const ctx = hiResCanvas.getContext('2d');
  ctx.scale(HIRES_SCALE, HIRES_SCALE);
  
  // Nur den Hintergrund zeichnen (Logo + Streifen, KEIN Text)
  renderBackground(ctx);
  
  return hiResCanvas.toDataURL('image/png');
}

/**
 * Ermittelt den aktiven Font-Namen
 * @param {jsPDF} doc
 * @returns {string}
 */
function getActiveFont(doc) {
  try {
    doc.setFont(FONTS.PDF, 'normal');
    return FONTS.PDF;
  } catch {
    return FONTS.PDF_FALLBACK;
  }
}

/**
 * Berechnet angepasste Schriftgröße
 * @param {jsPDF} doc
 * @param {string} text
 * @param {number} maxWidthMM
 * @param {number} initialSizePt
 * @param {string} fontStyle - 'bold' oder 'normal'
 * @param {string} fontName
 * @returns {number} Angepasste Größe in pt
 */
function calculateFittedFontSize(doc, text, maxWidthMM, initialSizePt, fontStyle, fontName) {
  let size = initialSizePt;
  doc.setFont(fontName, fontStyle);

  while (size > PDF.MIN_FONT_SIZE_PT) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidthMM) break;
    size -= 0.5;
  }

  return size;
}

/**
 * Zeichnet Text als Vektor auf das PDF
 * @param {jsPDF} doc
 * @param {Object} data - Benutzerdaten
 * @param {string} fontName
 * @param {number} offsetX - X-Verschiebung (für A4)
 * @param {number} offsetY - Y-Verschiebung (für A4)
 */
function drawPdfText(doc, data, fontName, offsetX = 0, offsetY = 0) {
  const [r, g, b] = COLORS.TEXT_WHITE_RGB;
  doc.setTextColor(r, g, b);

  let currentY = PHYSICAL.TOP_PADDING_MM;
  const x = PHYSICAL.LEFT_PADDING_MM;

  // ===== Namens-Größe (einheitlich für Vor- und Nachname) =====
  let nameSize = PDF.NAME_FONT_SIZE_PT;

  if (data.firstName) {
    nameSize = Math.min(nameSize, calculateFittedFontSize(
      doc, data.firstName, PHYSICAL.MAX_NAME_WIDTH_MM, PDF.NAME_FONT_SIZE_PT, 'bold', fontName
    ));
  }
  if (data.lastName) {
    nameSize = Math.min(nameSize, calculateFittedFontSize(
      doc, data.lastName, PHYSICAL.MAX_NAME_WIDTH_MM, PDF.NAME_FONT_SIZE_PT, 'bold', fontName
    ));
  }

  const nameLineHeight = nameSize * 0.3528; // pt → mm

  // Vorname
  if (data.firstName) {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(nameSize);
    currentY += nameLineHeight;
    doc.text(data.firstName, offsetX + x, offsetY + currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // Nachname
  if (data.lastName) {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(nameSize);
    currentY += nameLineHeight;
    doc.text(data.lastName, offsetX + x, offsetY + currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // ===== Info-Größe (einheitlich für Telefon + E-Mail) =====
  let infoSize = PDF.INFO_FONT_SIZE_PT;

  if (data.phoneNumber) {
    infoSize = Math.min(infoSize, calculateFittedFontSize(
      doc, data.phoneNumber, PHYSICAL.MAX_INFO_WIDTH_MM, PDF.INFO_FONT_SIZE_PT, 'normal', fontName
    ));
  }
  if (data.email) {
    data.email.split('/').map(l => l.trim()).filter(Boolean).forEach(line => {
      infoSize = Math.min(infoSize, calculateFittedFontSize(
        doc, line, PHYSICAL.MAX_INFO_WIDTH_MM, PDF.INFO_FONT_SIZE_PT, 'normal', fontName
      ));
    });
  }

  const infoLineHeight = infoSize * 0.3528;

  // Telefonnummer
  if (data.phoneNumber) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(infoSize);
    currentY += infoLineHeight + 1;
    doc.text(data.phoneNumber, offsetX + x, offsetY + currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // E-Mail (mit "/" als Umbruch)
  if (data.email) {
    const emailLines = data.email.split('/').map(l => l.trim()).filter(Boolean);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(infoSize);

    emailLines.forEach(line => {
      currentY += infoLineHeight;
      if (currentY < PHYSICAL.HEIGHT_MM - PHYSICAL.TOP_PADDING_MM) {
        doc.text(line, offsetX + x, offsetY + currentY);
        currentY += 1;
      }
    });
  }
}

/**
 * Exportiert einzelnes Namensschild als PDF
 * Hintergrund = Bild (mit Logo), Text = Vektor
 * 
 * @param {Object} data - Benutzerdaten
 */
export async function exportSinglePdf(data) {
  if (!data.firstName && !data.lastName) {
    alert('Bitte mindestens Vor- oder Nachname eingeben.');
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [PHYSICAL.HEIGHT_MM, PHYSICAL.WIDTH_MM],
      compress: true
    });

    // Font registrieren
    await registerFonts(doc);
    const fontName = getActiveFont(doc);

    // 1️⃣ Hintergrund als hochauflösendes Bild (enthält Logo!)
    const bgImage = createHiResBackgroundImage();
    doc.addImage(bgImage, 'PNG', 0, 0, PHYSICAL.WIDTH_MM, PHYSICAL.HEIGHT_MM);

    // 2️⃣ Text als Vektor darüber
    drawPdfText(doc, data, fontName);

    const fileName = `Namensschild_${data.firstName || 'X'}_${data.lastName || 'X'}.pdf`;
    doc.save(fileName);
    console.log('✓ PDF exportiert (Hintergrund-Bild + Vektor-Text)');
  } catch (error) {
    console.error('PDF-Export Fehler:', error);
    alert('Fehler beim PDF-Export. Bitte erneut versuchen.');
  }
}

/**
 * Exportiert auf DIN A4 zum Drucken
 * @param {Object} data - Benutzerdaten
 */
export async function exportA4Pdf(data) {
  if (!data.firstName && !data.lastName) {
    alert('Bitte mindestens Vor- oder Nachname eingeben.');
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    await registerFonts(doc);
    const fontName = getActiveFont(doc);

    const offsetX = 10;
    const offsetY = 10;
    const w = PHYSICAL.WIDTH_MM;
    const h = PHYSICAL.HEIGHT_MM;

    // 1️⃣ Hintergrund als Bild (mit Logo!)
    const bgImage = createHiResBackgroundImage();
    doc.addImage(bgImage, 'PNG', offsetX, offsetY, w, h);

    // 2️⃣ Text als Vektor
    drawPdfText(doc, data, fontName, offsetX, offsetY);

    // 3️⃣ Schnittmarkierungen
    const m = 4;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);

    doc.line(offsetX - m, offsetY, offsetX - 1, offsetY);
    doc.line(offsetX, offsetY - m, offsetX, offsetY - 1);
    doc.line(offsetX + w + 1, offsetY, offsetX + w + m, offsetY);
    doc.line(offsetX + w, offsetY - m, offsetX + w, offsetY - 1);
    doc.line(offsetX - m, offsetY + h, offsetX - 1, offsetY + h);
    doc.line(offsetX, offsetY + h + 1, offsetX, offsetY + h + m);
    doc.line(offsetX + w + 1, offsetY + h, offsetX + w + m, offsetY + h);
    doc.line(offsetX + w, offsetY + h + 1, offsetX + w, offsetY + h + m);

    // Hinweistext
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont(fontName, 'normal');
    doc.text('✂ Entlang der Markierungen ausschneiden', offsetX, offsetY + h + 12);

    const fileName = `Namensschild_${data.firstName || 'X'}_${data.lastName || 'X'}_A4.pdf`;
    doc.save(fileName);
    console.log('✓ A4 PDF exportiert');
  } catch (error) {
    console.error('A4-Export Fehler:', error);
    alert('Fehler beim A4-Export. Bitte erneut versuchen.');
  }
}