/**
 * PDF-Export Modul
 *
 * Strategie (Hybrid):
 *  - Hintergrund → renderBackground() aus backgroundRenderer.js
 *                  → Canvas → PNG (beim ersten Export gecacht)
 *                  → PDF als Bild-Layer
 *  - Text        → jsPDF .text() als Vektor-Layer
 *
 * @module pdfExport
 */

import { jsPDF } from 'jspdf';
import { PHYSICAL, PDF, COLORS, CANVAS, FONTS } from './constants.js';
import { renderBackground } from './backgroundRenderer.js';
import { registerFonts } from './fontLoader.js';

// ===== Konstanten =====
const MM_PER_PT = 0.3528;
const PX_PER_MM = 96 / 25.4; // ≈ 3.78
const DEFAULT_SCALE = 4;

// ===== Hintergrund-Cache =====
let backgroundImageCache = null;

// ===== Abstraktion: Render-Adapter =====

/**
 * Erstellt einen Adapter für Canvas-basiertes Text-Rendering.
 */
function createCanvasAdapter(ctx) {
  return {
    measureText(text, size, weight) {
      ctx.font = `${weight} ${size}px ${FONTS.PREVIEW}`;
      return ctx.measureText(text).width;
    },

    drawText(text, x, y, size, weight) {
      ctx.font = `${weight} ${size}px ${FONTS.PREVIEW}`;
      ctx.fillStyle = `rgb(${COLORS.TEXT_WHITE_RGB.join(',')})`;
      ctx.fillText(text, x, y);
    },

    toMM(valueMM) {
      return valueMM * PX_PER_MM;
    },

    lineHeight(sizePt) {
      return sizePt * MM_PER_PT * PX_PER_MM;
    },

    get maxNameWidth() { return CANVAS.MAX_NAME_WIDTH; },
    get maxInfoWidth() { return CANVAS.MAX_INFO_WIDTH; },
    get initialNameSize() { return CANVAS.INITIAL_NAME_SIZE; },
    get initialInfoSize() { return CANVAS.INITIAL_INFO_SIZE; },
    get minFontSize() { return CANVAS.MIN_FONT_SIZE; },
    get sizeStep() { return 1; },
  };
}

/**
 * Erstellt einen Adapter für jsPDF-basiertes Text-Rendering.
 */
function createPdfAdapter(doc, fontName) {
  return {
    measureText(text, size, weight) {
      const style = weight === 'bold' ? 'bold' : 'normal';
      doc.setFont(fontName, style);
      doc.setFontSize(size);
      return doc.getTextWidth(text);
    },

    drawText(text, x, y, size, weight) {
      const style = weight === 'bold' ? 'bold' : 'normal';
      doc.setTextColor(...COLORS.TEXT_WHITE_RGB);
      doc.setFont(fontName, style);
      doc.setFontSize(size);
      doc.text(text, x, y, { baseline: 'top' });
    },

    toMM(valueMM) {
      return valueMM;
    },

    lineHeight(sizePt) {
      return sizePt * MM_PER_PT;
    },

    get maxNameWidth() { return PHYSICAL.MAX_NAME_WIDTH_MM; },
    get maxInfoWidth() { return PHYSICAL.MAX_INFO_WIDTH_MM; },
    get initialNameSize() { return PDF.NAME_FONT_SIZE_PT; },
    get initialInfoSize() { return PDF.INFO_FONT_SIZE_PT; },
    get minFontSize() { return PDF.MIN_FONT_SIZE_PT; },
    get sizeStep() { return 0.5; },
  };
}

// ===== Kern-Logik (adapterunabhängig) =====

/**
 * Reduziert die Schriftgröße bis der Text in die maximale Breite passt.
 */
function fitFontSize(adapter, text, maxWidth, initialSize, weight) {
  let size = initialSize;
  while (size > adapter.minFontSize) {
    if (adapter.measureText(text, size, weight) <= maxWidth) return size;
    size -= adapter.sizeStep;
  }
  return adapter.minFontSize;
}

/**
 * Berechnet eine einheitliche Schriftgröße für mehrere Texte.
 */
function computeUniformSize(adapter, texts, maxWidth, initialSize, weight) {
  let size = initialSize;
  for (const text of texts) {
    if (text) {
      size = Math.min(size, fitFontSize(adapter, text, maxWidth, size, weight));
    }
  }
  return size;
}

/**
 * Rendert den gesamten Text über einen Adapter (Canvas oder PDF).
 * Layout: strikt von oben nach unten, Start bei topPadding.
 *
 * @param {Object} adapter - Render-Adapter
 * @param {Object} data    - { firstName, lastName, phoneNumber, email }
 * @param {number} ox      - X-Offset
 * @param {number} oy      - Y-Offset
 */
function renderText(adapter, data, ox = 0, oy = 0) {
  const topPadding = adapter.toMM(PHYSICAL.TOP_PADDING_MM);
  const leftPadding = adapter.toMM(PHYSICAL.LEFT_PADDING_MM);
  const lineSpacing = adapter.toMM(PDF.LINE_SPACING_MM);
  const x = ox + leftPadding;

  // Y startet direkt am oberen Rand – Text wird von oben nach unten aufgebaut
  let y = oy + topPadding;

  // ===== Namen =====
  const nameSize = computeUniformSize(
    adapter,
    [data.firstName, data.lastName],
    adapter.maxNameWidth,
    adapter.initialNameSize,
    'bold'
  );
  const nameLineH = adapter.lineHeight(nameSize);

  if (data.firstName) {
    adapter.drawText(data.firstName, x, y, nameSize, 'bold');
    y += nameLineH + lineSpacing;
  }

  if (data.lastName) {
    adapter.drawText(data.lastName, x, y, nameSize, 'bold');
    y += nameLineH + lineSpacing;
  }

  // ===== Info-Felder =====
  const emailLines = data.email
    ? data.email.split('/').map(l => l.trim()).filter(Boolean)
    : [];

  const infoTexts = [data.phoneNumber, ...emailLines].filter(Boolean);

  // Frühzeitig abbrechen wenn keine Info-Daten vorhanden
  if (infoTexts.length === 0) return;

  const infoSize = computeUniformSize(
    adapter,
    infoTexts,
    adapter.maxInfoWidth,
    adapter.initialInfoSize,
    'normal'
  );
  const infoLineH = adapter.lineHeight(infoSize);

  // Etwas Abstand zwischen Namen und Info-Block
  y += adapter.toMM(2); // 2mm Trennung

  const maxY = oy + adapter.toMM(PHYSICAL.HEIGHT_MM - PHYSICAL.TOP_PADDING_MM);

  if (data.phoneNumber) {
    if (y + infoLineH > maxY) return;
    adapter.drawText(data.phoneNumber, x, y, infoSize, 'normal');
    y += infoLineH + lineSpacing;
  }

  for (const line of emailLines) {
    if (y + infoLineH > maxY) return;
    adapter.drawText(line, x, y, infoSize, 'normal');
    y += infoLineH + adapter.toMM(MM_PER_PT); // +1pt zwischen E-Mail-Zeilen
  }
}

// ===== Hintergrund =====

/**
 * Gibt den Hintergrund als PNG Data-URL zurück (gecacht).
 */
function getBackgroundImage(scale = DEFAULT_SCALE) {
  if (backgroundImageCache) return backgroundImageCache;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS.WIDTH * scale;
  canvas.height = CANVAS.HEIGHT * scale;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  renderBackground(ctx);

  backgroundImageCache = canvas.toDataURL('image/png');
  console.log(`Hintergrund gecacht (${canvas.width}×${canvas.height}px)`);
  return backgroundImageCache;
}

/**
 * Rendert Text als PNG (Fallback bei Font-Problemen).
 */
function renderTextToImage(data, scale = DEFAULT_SCALE) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS.WIDTH * scale;
  canvas.height = CANVAS.HEIGHT * scale;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
  ctx.textBaseline = 'top';

  const adapter = createCanvasAdapter(ctx);
  renderText(adapter, data);

  return canvas.toDataURL('image/png');
}

// ===== PDF-Hilfsfunktionen =====

/**
 * Ermittelt den aktiven Font-Namen.
 */
function getActiveFont(doc) {
  const fontList = doc.getFontList();
  if (fontList['Roboto']) {
    return 'Roboto';
  }
  console.warn('⚠️ Roboto nicht verfügbar, Fallback auf Helvetica');
  return 'helvetica';
}

/**
 * Zeichnet Schnittmarkierungen um das Namensschild.
 */
function drawCutMarks(doc, ox, oy, w, h) {
  const m = 4;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);

  const marks = [
    [ox - m, oy, ox - 1, oy],
    [ox, oy - m, ox, oy - 1],
    [ox + w + 1, oy, ox + w + m, oy],
    [ox + w, oy - m, ox + w, oy - 1],
    [ox - m, oy + h, ox - 1, oy + h],
    [ox, oy + h + 1, ox, oy + h + m],
    [ox + w + 1, oy + h, ox + w + m, oy + h],
    [ox + w, oy + h + 1, ox + w, oy + h + m],
  ];

  for (const [x1, y1, x2, y2] of marks) {
    doc.line(x1, y1, x2, y2);
  }
}

// ===== Öffentliche Export-Funktion =====

/**
 * Exportiert das Namensschild als A4-PDF mit Schnittmarkierungen.
 * @param {Object} data - { firstName, lastName, phoneNumber, email }
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
    compress: true,
  });

  await registerFonts(doc);
  const font = getActiveFont(doc);

  const ox = 10;
  const oy = 10;
  const w = PHYSICAL.WIDTH_MM;
  const h = PHYSICAL.HEIGHT_MM;

  // 1 Hintergrund
  doc.addImage(getBackgroundImage(), 'PNG', ox, oy, w, h);

  // 2 Text
  if (font === 'Roboto') {
    const adapter = createPdfAdapter(doc, font);
    renderText(adapter, data, ox, oy);
  } else {
    console.log('Image-Fallback für Text (Font-Problem)');
    doc.addImage(renderTextToImage(data), 'PNG', ox, oy, w, h);
  }

  // 3 Schnittmarkierungen
  drawCutMarks(doc, ox, oy, w, h);

  // 4 Hinweistext
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont(font, 'normal');
  doc.text('Entlang der Markierungen ausschneiden', ox, oy + h + 12);

  const fileName = `Namensschild_${data.firstName || 'X'}_${data.lastName || 'X'}_A4.pdf`;
  doc.save(fileName);
  console.log('A4 PDF gespeichert:', fileName);
}