/**
 * PDF-Export Modul (Vektor-basiert, mit Roboto-Einbettung)
 * 
 * Verwendet jsPDF's native Vektor-API mit eingebetteter Roboto-Schrift.
 * 
 * ⚠️ KEINE Canvas-Rasterung, KEINE html2canvas!
 * 
 * @module pdfExport
 */

import { jsPDF } from 'jspdf';
import { PHYSICAL, PDF, COLORS, FONTS } from './constants.js';
import { getStripesInMM } from './backgroundRenderer.js';
import { registerFonts } from './fontLoader.js';

/**
 * Ermittelt den aktiven Font-Namen (Roboto oder Fallback)
 * @param {jsPDF} doc - jsPDF-Instanz
 * @returns {string} Font-Name
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
 * Berechnet die angepasste Schriftgröße für einen Text
 * @param {jsPDF} doc - jsPDF-Instanz
 * @param {string} text - Zu messender Text
 * @param {number} maxWidthMM - Maximale Breite in mm
 * @param {number} initialSizePt - Anfangs-Schriftgröße in pt
 * @param {string} fontStyle - 'bold' oder 'normal'
 * @param {string} fontName - Font-Name
 * @returns {number} Angepasste Schriftgröße in pt
 */
function calculateFittedFontSize(doc, text, maxWidthMM, initialSizePt, fontStyle = 'normal', fontName = FONTS.PDF) {
  let size = initialSizePt;

  doc.setFont(fontName, fontStyle);
  doc.setFontSize(size);

  while (size > PDF.MIN_FONT_SIZE_PT) {
    doc.setFontSize(size);
    const textWidth = doc.getTextWidth(text);
    
    if (textWidth <= maxWidthMM) {
      break;
    }
    size -= 0.5;
  }

  return size;
}

/**
 * Zeichnet den roten Hintergrund als Vektor-Rechteck
 * @param {jsPDF} doc - jsPDF-Instanz
 */
function drawPdfBackground(doc) {
  const [r, g, b] = COLORS.BACKGROUND_RGB;
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, PHYSICAL.WIDTH_MM, PHYSICAL.HEIGHT_MM, 'F');
}

/**
 * Zeichnet die dekorativen weißen Streifen als Vektor-Linien
 * @param {jsPDF} doc - jsPDF-Instanz
 */
function drawPdfStripes(doc) {
  const [r, g, b] = COLORS.TEXT_WHITE_RGB;
  doc.setFillColor(r, g, b);
  
  const stripes = getStripesInMM();
  stripes.forEach(stripe => {
    doc.rect(stripe.x, 0, stripe.width, PHYSICAL.HEIGHT_MM, 'F');
  });
}

/**
 * Zeichnet den Logo-Platzhalter
 * @param {jsPDF} doc - jsPDF-Instanz
 * @param {string} fontName - Aktiver Font
 */
function drawPdfLogoPlaceholder(doc, fontName) {
  const [r, g, b] = COLORS.LOGO_PLACEHOLDER_RGB;
  doc.setFillColor(r, g, b);
  doc.rect(
    PHYSICAL.LOGO_X_MM,
    PHYSICAL.LOGO_Y_MM,
    PHYSICAL.LOGO_SIZE_MM,
    PHYSICAL.LOGO_SIZE_MM,
    'F'
  );

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.setFont(fontName, 'normal');
  const logoText = 'LOGO';
  const logoTextWidth = doc.getTextWidth(logoText);
  doc.text(
    logoText,
    PHYSICAL.LOGO_X_MM + (PHYSICAL.LOGO_SIZE_MM - logoTextWidth) / 2,
    PHYSICAL.LOGO_Y_MM + PHYSICAL.LOGO_SIZE_MM / 2 + 1
  );
}

/**
 * Zeichnet den Text-Inhalt als Vektor-Text
 * @param {jsPDF} doc - jsPDF-Instanz
 * @param {Object} data - Benutzerdaten
 * @param {string} fontName - Aktiver Font-Name
 * @param {number} [offsetX=0] - X-Verschiebung (für A4-Layout)
 * @param {number} [offsetY=0] - Y-Verschiebung (für A4-Layout)
 */
function drawPdfText(doc, data, fontName, offsetX = 0, offsetY = 0) {
  const [r, g, b] = COLORS.TEXT_WHITE_RGB;
  doc.setTextColor(r, g, b);

  let currentY = PHYSICAL.TOP_PADDING_MM;
  const x = PHYSICAL.LEFT_PADDING_MM;

  // ===== Einheitliche Namens-Größe =====
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

  // ===== Einheitliche Info-Größe =====
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

  // E-Mail
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
 * Exportiert ein einzelnes Namensschild als Vektor-PDF
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

    // ⚡ Font registrieren (async, gecacht nach erstem Aufruf)
    await registerFonts(doc);
    const fontName = getActiveFont(doc);

    drawPdfBackground(doc);
    drawPdfStripes(doc);
    drawPdfLogoPlaceholder(doc, fontName);
    drawPdfText(doc, data, fontName);

    const fileName = `Namensschild_${data.firstName || 'X'}_${data.lastName || 'X'}.pdf`;
    doc.save(fileName);
    console.log('✓ PDF exportiert mit Font:', fontName);
  } catch (error) {
    console.error('PDF-Export Fehler:', error);
    alert('Fehler beim PDF-Export. Bitte erneut versuchen.');
  }
}

/**
 * Exportiert das Namensschild auf DIN A4 mit Schnittmarkierungen
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

    // ⚡ Font registrieren
    await registerFonts(doc);
    const fontName = getActiveFont(doc);

    const offsetX = 10;
    const offsetY = 10;
    const w = PHYSICAL.WIDTH_MM;
    const h = PHYSICAL.HEIGHT_MM;

    // Hintergrund
    const [bgR, bgG, bgB] = COLORS.BACKGROUND_RGB;
    doc.setFillColor(bgR, bgG, bgB);
    doc.rect(offsetX, offsetY, w, h, 'F');

    // Streifen
    const [strR, strG, strB] = COLORS.TEXT_WHITE_RGB;
    doc.setFillColor(strR, strG, strB);
    getStripesInMM().forEach(stripe => {
      doc.rect(offsetX + stripe.x, offsetY, stripe.width, h, 'F');
    });

    // Logo-Platzhalter
    const [lgR, lgG, lgB] = COLORS.LOGO_PLACEHOLDER_RGB;
    doc.setFillColor(lgR, lgG, lgB);
    doc.rect(
      offsetX + PHYSICAL.LOGO_X_MM,
      offsetY + PHYSICAL.LOGO_Y_MM,
      PHYSICAL.LOGO_SIZE_MM,
      PHYSICAL.LOGO_SIZE_MM,
      'F'
    );

    // Text
    drawPdfText(doc, data, fontName, offsetX, offsetY);

    // Schnittmarkierungen
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
    console.log('✓ A4 PDF exportiert mit Font:', fontName);
  } catch (error) {
    console.error('A4-Export Fehler:', error);
    alert('Fehler beim A4-Export. Bitte erneut versuchen.');
  }
}