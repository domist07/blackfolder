/**
 * PDF-Export Modul (Vektor-basiert)
 * 
 * Verwendet jsPDF's native Vektor-API für:
 * - Text als echte Schriftzeichen (nicht gerastert)
 * - Rechtecke und Linien als Vektoren
 * - Hintergrundfarbe als Vektor-Füllung
 * 
 * ⚠️ KEINE Canvas-Rasterung, KEINE html2canvas!
 * 
 * @module pdfExport
 */

import { jsPDF } from 'jspdf';
import { PHYSICAL, PDF, COLORS, FONTS } from './constants.js';
import { getStripesInMM } from './backgroundRenderer.js';

/**
 * Berechnet die angepasste Schriftgröße für einen Text
 * @param {jsPDF} doc - jsPDF-Instanz
 * @param {string} text - Zu messender Text
 * @param {number} maxWidthMM - Maximale Breite in mm
 * @param {number} initialSizePt - Anfangs-Schriftgröße in pt
 * @param {string} fontStyle - 'bold' oder 'normal'
 * @returns {number} Angepasste Schriftgröße in pt
 */
function calculateFittedFontSize(doc, text, maxWidthMM, initialSizePt, fontStyle = 'normal') {
  let size = initialSizePt;

  doc.setFont(FONTS.PDF, fontStyle);
  doc.setFontSize(size);

  // Reduziere Größe in 0.5pt-Schritten bis der Text passt
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
 */
function drawPdfLogoPlaceholder(doc) {
  const [r, g, b] = COLORS.LOGO_PLACEHOLDER_RGB;
  doc.setFillColor(r, g, b);
  doc.rect(
    PHYSICAL.LOGO_X_MM,
    PHYSICAL.LOGO_Y_MM,
    PHYSICAL.LOGO_SIZE_MM,
    PHYSICAL.LOGO_SIZE_MM,
    'F'
  );

  // "LOGO" Text im Platzhalter
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.setFont(FONTS.PDF, 'normal');
  const logoText = 'LOGO';
  const logoTextWidth = doc.getTextWidth(logoText);
  doc.text(
    logoText,
    PHYSICAL.LOGO_X_MM + (PHYSICAL.LOGO_SIZE_MM - logoTextWidth) / 2,
    PHYSICAL.LOGO_Y_MM + PHYSICAL.LOGO_SIZE_MM / 2 + 1
  );
}

/**
 * Zeichnet den Text-Inhalt als Vektor-Text auf das PDF
 * @param {jsPDF} doc - jsPDF-Instanz
 * @param {Object} data - Benutzerdaten
 * @param {string} data.firstName - Vorname
 * @param {string} data.lastName - Nachname
 * @param {string} data.phoneNumber - Telefonnummer
 * @param {string} data.email - E-Mail (mit "/" als Zeilenumbruch)
 */
function drawPdfText(doc, data) {
  const [r, g, b] = COLORS.TEXT_WHITE_RGB;
  doc.setTextColor(r, g, b);

  let currentY = PHYSICAL.TOP_PADDING_MM;
  const x = PHYSICAL.LEFT_PADDING_MM;

  // ===== Namen-Größe berechnen (einheitlich) =====
  let nameSize = PDF.NAME_FONT_SIZE_PT;

  if (data.firstName) {
    const firstSize = calculateFittedFontSize(
      doc, data.firstName, PHYSICAL.MAX_NAME_WIDTH_MM, PDF.NAME_FONT_SIZE_PT, 'bold'
    );
    nameSize = Math.min(nameSize, firstSize);
  }
  if (data.lastName) {
    const lastSize = calculateFittedFontSize(
      doc, data.lastName, PHYSICAL.MAX_NAME_WIDTH_MM, PDF.NAME_FONT_SIZE_PT, 'bold'
    );
    nameSize = Math.min(nameSize, lastSize);
  }

  // pt → mm für Zeilenhöhe: 1pt ≈ 0.3528mm
  const nameLineHeight = nameSize * 0.3528;

  // ===== Vorname ===== 
  if (data.firstName) {
    doc.setFont(FONTS.PDF, 'bold');
    doc.setFontSize(nameSize);
    currentY += nameLineHeight;
    doc.text(data.firstName, x, currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // ===== Nachname =====
  if (data.lastName) {
    doc.setFont(FONTS.PDF, 'bold');
    doc.setFontSize(nameSize);
    currentY += nameLineHeight;
    doc.text(data.lastName, x, currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // ===== Kontaktdaten-Größe berechnen (einheitlich) =====
  let infoSize = PDF.INFO_FONT_SIZE_PT;

  if (data.phoneNumber) {
    const phoneSize = calculateFittedFontSize(
      doc, data.phoneNumber, PHYSICAL.MAX_INFO_WIDTH_MM, PDF.INFO_FONT_SIZE_PT, 'normal'
    );
    infoSize = Math.min(infoSize, phoneSize);
  }

  if (data.email) {
    const emailLines = data.email.split('/').map(l => l.trim()).filter(Boolean);
    emailLines.forEach(line => {
      const lineSize = calculateFittedFontSize(
        doc, line, PHYSICAL.MAX_INFO_WIDTH_MM, PDF.INFO_FONT_SIZE_PT, 'normal'
      );
      infoSize = Math.min(infoSize, lineSize);
    });
  }

  const infoLineHeight = infoSize * 0.3528;

  // ===== Telefonnummer =====
  if (data.phoneNumber) {
    doc.setFont(FONTS.PDF, 'normal');
    doc.setFontSize(infoSize);
    currentY += infoLineHeight + 1;
    doc.text(data.phoneNumber, x, currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // ===== E-Mail (mit "/" als Umbruch) =====
  if (data.email) {
    const emailLines = data.email.split('/').map(l => l.trim()).filter(Boolean);
    doc.setFont(FONTS.PDF, 'normal');
    doc.setFontSize(infoSize);

    emailLines.forEach(line => {
      currentY += infoLineHeight;
      // Prüfe ob noch Platz auf dem Schild
      if (currentY < PHYSICAL.HEIGHT_MM - PHYSICAL.TOP_PADDING_MM) {
        doc.text(line, x, currentY);
        currentY += 1;
      }
    });
  }
}

/**
 * Erstellt ein einzelnes Namensschild als Vektor-PDF
 * @param {Object} data - Benutzerdaten
 * @returns {jsPDF|null} PDF-Dokument oder null bei Fehler
 */
function createSinglePdf(data) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PHYSICAL.HEIGHT_MM, PHYSICAL.WIDTH_MM], // [kürzere, längere Seite]
    compress: true
  });

  drawPdfBackground(doc);
  drawPdfStripes(doc);
  drawPdfLogoPlaceholder(doc);
  drawPdfText(doc, data);

  return doc;
}

/**
 * Exportiert ein einzelnes Namensschild als PDF-Datei
 * @param {Object} data - Benutzerdaten
 */
export function exportSinglePdf(data) {
  if (!data.firstName && !data.lastName) {
    alert('Bitte mindestens Vor- oder Nachname eingeben.');
    return;
  }

  try {
    const doc = createSinglePdf(data);
    const fileName = `Namensschild_${data.firstName || 'Unbekannt'}_${data.lastName || 'Unbekannt'}.pdf`;
    doc.save(fileName);
    console.log('✓ Einzelnes PDF exportiert:', fileName);
  } catch (error) {
    console.error('PDF-Export Fehler:', error);
    alert('Fehler beim PDF-Export. Bitte erneut versuchen.');
  }
}

/**
 * Exportiert das Namensschild auf DIN A4 zum Drucken (mit Schnittmarkierungen)
 * @param {Object} data - Benutzerdaten
 */
export function exportA4Pdf(data) {
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

    // Position auf der A4-Seite (mit 10mm Rand)
    const offsetX = 10;
    const offsetY = 10;
    const w = PHYSICAL.WIDTH_MM;
    const h = PHYSICAL.HEIGHT_MM;

    // === Hintergrund-Rechteck ===
    const [bgR, bgG, bgB] = COLORS.BACKGROUND_RGB;
    doc.setFillColor(bgR, bgG, bgB);
    doc.rect(offsetX, offsetY, w, h, 'F');

    // === Dekorative Streifen (verschoben um Offset) ===
    const [strR, strG, strB] = COLORS.TEXT_WHITE_RGB;
    doc.setFillColor(strR, strG, strB);
    const stripes = getStripesInMM();
    stripes.forEach(stripe => {
      doc.rect(offsetX + stripe.x, offsetY, stripe.width, h, 'F');
    });

    // === Logo-Platzhalter ===
    const [lgR, lgG, lgB] = COLORS.LOGO_PLACEHOLDER_RGB;
    doc.setFillColor(lgR, lgG, lgB);
    doc.rect(
      offsetX + PHYSICAL.LOGO_X_MM,
      offsetY + PHYSICAL.LOGO_Y_MM,
      PHYSICAL.LOGO_SIZE_MM,
      PHYSICAL.LOGO_SIZE_MM,
      'F'
    );

    // === Text-Inhalte (mit Offset) ===
    drawPdfTextWithOffset(doc, data, offsetX, offsetY);

    // === Schnittmarkierungen ===
    const markLen = 4;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);

    // Oben links
    doc.line(offsetX - markLen, offsetY, offsetX - 1, offsetY);
    doc.line(offsetX, offsetY - markLen, offsetX, offsetY - 1);
    // Oben rechts
    doc.line(offsetX + w + 1, offsetY, offsetX + w + markLen, offsetY);
    doc.line(offsetX + w, offsetY - markLen, offsetX + w, offsetY - 1);
    // Unten links
    doc.line(offsetX - markLen, offsetY + h, offsetX - 1, offsetY + h);
    doc.line(offsetX, offsetY + h + 1, offsetX, offsetY + h + markLen);
    // Unten rechts
    doc.line(offsetX + w + 1, offsetY + h, offsetX + w + markLen, offsetY + h);
    doc.line(offsetX + w, offsetY + h + 1, offsetX + w, offsetY + h + markLen);

    // Schnitthinweis
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont(FONTS.PDF, 'normal');
    doc.text('✂ Entlang der Markierungen ausschneiden', offsetX, offsetY + h + 12);

    const fileName = `Namensschild_${data.firstName || 'X'}_${data.lastName || 'X'}_A4.pdf`;
    doc.save(fileName);
    console.log('✓ A4 PDF exportiert:', fileName);
  } catch (error) {
    console.error('A4-Export Fehler:', error);
    alert('Fehler beim A4-Export. Bitte erneut versuchen.');
  }
}

/**
 * Zeichnet Text mit X/Y-Offset (für A4-Layout)
 * @param {jsPDF} doc - jsPDF-Instanz
 * @param {Object} data - Benutzerdaten
 * @param {number} offsetX - X-Verschiebung in mm
 * @param {number} offsetY - Y-Verschiebung in mm
 */
function drawPdfTextWithOffset(doc, data, offsetX, offsetY) {
  const [r, g, b] = COLORS.TEXT_WHITE_RGB;
  doc.setTextColor(r, g, b);

  let currentY = PHYSICAL.TOP_PADDING_MM;
  const x = PHYSICAL.LEFT_PADDING_MM;

  // Namen-Größe berechnen
  let nameSize = PDF.NAME_FONT_SIZE_PT;
  if (data.firstName) {
    nameSize = Math.min(nameSize, calculateFittedFontSize(
      doc, data.firstName, PHYSICAL.MAX_NAME_WIDTH_MM, PDF.NAME_FONT_SIZE_PT, 'bold'
    ));
  }
  if (data.lastName) {
    nameSize = Math.min(nameSize, calculateFittedFontSize(
      doc, data.lastName, PHYSICAL.MAX_NAME_WIDTH_MM, PDF.NAME_FONT_SIZE_PT, 'bold'
    ));
  }

  const nameLineHeight = nameSize * 0.3528;

  if (data.firstName) {
    doc.setFont(FONTS.PDF, 'bold');
    doc.setFontSize(nameSize);
    currentY += nameLineHeight;
    doc.text(data.firstName, offsetX + x, offsetY + currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  if (data.lastName) {
    doc.setFont(FONTS.PDF, 'bold');
    doc.setFontSize(nameSize);
    currentY += nameLineHeight;
    doc.text(data.lastName, offsetX + x, offsetY + currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  // Kontaktdaten-Größe
  let infoSize = PDF.INFO_FONT_SIZE_PT;
  if (data.phoneNumber) {
    infoSize = Math.min(infoSize, calculateFittedFontSize(
      doc, data.phoneNumber, PHYSICAL.MAX_INFO_WIDTH_MM, PDF.INFO_FONT_SIZE_PT, 'normal'
    ));
  }
  if (data.email) {
    data.email.split('/').map(l => l.trim()).filter(Boolean).forEach(line => {
      infoSize = Math.min(infoSize, calculateFittedFontSize(
        doc, line, PHYSICAL.MAX_INFO_WIDTH_MM, PDF.INFO_FONT_SIZE_PT, 'normal'
      ));
    });
  }

  const infoLineHeight = infoSize * 0.3528;

  if (data.phoneNumber) {
    doc.setFont(FONTS.PDF, 'normal');
    doc.setFontSize(infoSize);
    currentY += infoLineHeight + 1;
    doc.text(data.phoneNumber, offsetX + x, offsetY + currentY);
    currentY += PDF.LINE_SPACING_MM;
  }

  if (data.email) {
    const emailLines = data.email.split('/').map(l => l.trim()).filter(Boolean);
    doc.setFont(FONTS.PDF, 'normal');
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