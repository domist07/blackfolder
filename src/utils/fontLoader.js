/**
 * Font-Loader für jsPDF (nur lokale Font-Dateien)
 * 
 * Lädt Roboto-TTF-Dateien aus dem lokalen 'fonts/' Verzeichnis und
 * registriert sie bei Bedarf in jsPDF-Instanzen.
 * Kein CDN oder externe URLs werden verwendet.
 * 
 * @module fontLoader
 */

// ===== Konfiguration: Lokale Font-Pfade =====
// Pfade zu lokalen TTF-Dateien relativ zum public/ Verzeichnis
const FONT_LOCAL_PATHS = {
  regular: '/fonts/Roboto-Regular.ttf',
  medium:  '/fonts/Roboto-Medium.ttf',
  bold:    '/fonts/Roboto-Bold.ttf'
};

let fontsLoaded = false;
let fontsLoading = null;
let fontCache = { regular: null, medium: null, bold: null};

/**
 * Konvertiert ArrayBuffer zu Base64-String
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.slice(i, i + 8192)));
  }
  return btoa(chunks.join(''));
}

/**
 * Lädt eine Font-Datei lokal aus dem public/ Verzeichnis
 * @param {string} path - Relativer Pfad zur TTF-Datei (beginnend mit /)
 * @returns {Promise<string>} Base64-kodierter Font
 */
async function fetchLocalFontAsBase64(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Lokale Font-Datei nicht ladbar: ${path} (${response.status})`);
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

/**
 * Interne Ladefunktion (wird nur einmal ausgeführt)
 * @returns {Promise<boolean>}
 */
async function loadFontsInternal() {
  let regular = null;
  let medium = null;
  let bold = null;

  try {
    // Lade nur von lokalen Pfaden
    [regular, medium, bold] = await Promise.all([
      fetchLocalFontAsBase64(FONT_LOCAL_PATHS.regular),
      fetchLocalFontAsBase64(FONT_LOCAL_PATHS.medium),
      fetchLocalFontAsBase64(FONT_LOCAL_PATHS.bold)
    ]);
    console.log('✓ Roboto Fonts lokal aus fonts/ Verzeichnis geladen');
  } catch (localError) {
    console.error('❌ Laden der lokalen Font-Dateien ist gescheitert');
    console.error('   Lokal:', localError.message);
    return false;
  }

  fontCache.regular = regular;
  fontCache.medium = medium;
  fontCache.bold = bold;
  fontsLoaded = true;

  return true;
}

/**
 * Vorladen der Fonts (beim App-Start aufrufen).
 * Kann mehrfach aufgerufen werden – lädt nur einmal.
 * 
 * @returns {Promise<boolean>} true wenn erfolgreich
 */
export function preloadFonts() {
  if (fontsLoaded) return Promise.resolve(true);
  if (!fontsLoading) {
    fontsLoading = loadFontsInternal();
  }
  return fontsLoading;
}

/**
 * Registriert Roboto-Fonts in einer jsPDF-Instanz.
 * Wartet auf Vorladen falls noch nicht abgeschlossen.
 * 
 * @param {import('jspdf').jsPDF} doc - jsPDF-Instanz
 * @returns {Promise<boolean>} true wenn Roboto verfügbar
 */
export async function registerFonts(doc) {
  const success = await preloadFonts();
  if (!success) return false;

  doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
  doc.addFileToVFS('Roboto-Medium.ttf', fontCache.medium);
  doc.addFileToVFS('Roboto-Bold.ttf', fontCache.bold);

  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Medium.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  return true;
}