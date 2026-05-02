/**
 * Gemeinsame Konstanten für Canvas-Vorschau und PDF-Export
 * 
 * Alle Maße basieren auf dem physischen Format: 95mm × 60mm (Querformat)
 */

// ===== Physische Maße (in mm) =====
export const PHYSICAL = {
  WIDTH_MM: 95,
  HEIGHT_MM: 60,
  LEFT_PADDING_MM: 5,
  TOP_PADDING_MM: 5,
  MAX_NAME_WIDTH_MM: 65,
  MAX_INFO_WIDTH_MM: 50,
  LOGO_X_MM: 70,
  LOGO_Y_MM: 35,
  LOGO_SIZE_MM: 20
};

// ===== Umrechnungsfaktor =====
/** 1mm ≈ 3.7795px bei 96 DPI */
export const MM_TO_PX = 3.7795;

// ===== Canvas-Konstanten (Pixel, basierend auf ~95mm × 60mm) =====
export const CANVAS = {
  WIDTH: 359,           // 95mm × 3.7795
  HEIGHT: 227,          // 60mm × 3.7795
  LEFT_PADDING: 19,     // 5mm
  TOP_PADDING: 19,      // 5mm
  LINE_SPACING: 6,      // Zeilenabstand in px
  MAX_NAME_WIDTH: 246,  // 65mm
  MAX_INFO_WIDTH: 189,  // 50mm
  INITIAL_NAME_SIZE: 48, // Anfangsgröße für Namen (px, entspricht ~36pt)
  INITIAL_INFO_SIZE: 19, // Anfangsgröße für Kontakt (px, entspricht ~14pt)
  MIN_FONT_SIZE: 10      // Minimale Schriftgröße (px)
};

// ===== PDF-Konstanten (in mm, für jsPDF) =====
export const PDF = {
  NAME_FONT_SIZE_PT: 36,
  INFO_FONT_SIZE_PT: 14,
  MIN_FONT_SIZE_PT: 8,
  LINE_SPACING_MM: 2
};

// ===== Farben =====
export const COLORS = {
  BACKGROUND: '#9d0000',
  BACKGROUND_RGB: [157, 0, 0],
  TEXT_WHITE: '#ffffff',
  TEXT_WHITE_RGB: [255, 255, 255],
  LOGO_PLACEHOLDER: '#666666',
  LOGO_PLACEHOLDER_RGB: [102, 102, 102]
};

// ===== Schriftarten =====
export const FONTS = {
  /** Font für die Canvas-Vorschau (Google Fonts) */
  PREVIEW: "'Roboto', sans-serif",
  /** Font für den PDF-Export (Custom eingebettet) */
  PDF: 'Roboto',
  /** Fallback falls Font-Loading fehlschlägt */
  PDF_FALLBACK: 'helvetica'
};