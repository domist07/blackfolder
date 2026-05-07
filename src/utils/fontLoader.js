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
  medium:  '/fonts/Roboto-Medium.ttf'
};

let fontsLoaded = false;
let fontsLoading = null;
let fontCache = { regular: null, medium: null};

/**
 * Entfernt den data URI prefix aus einem Base64-string falls vorhanden
 * @param {string} base64String
 * @returns {string}
 */
function cleanBase64(base64String) {
  // Entferne data URI prefix wie "data:application/font-ttf;base64,"
  return base64String.replace(/^data:[^;]*;base64,/, '');
}

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
  const base64 = arrayBufferToBase64(buffer);
  // Entferne eventuellen data URI prefix
  return cleanBase64(base64);
}

/**
 * Interne Ladefunktion (wird nur einmal ausgeführt)
 * @returns {Promise<boolean>}
 */
async function loadFontsInternal() {
  let regular = null;
  let medium = null;

  try {
    // Lade nur von lokalen Pfaden
    [regular, medium] = await Promise.all([
      fetchLocalFontAsBase64(FONT_LOCAL_PATHS.regular),
      fetchLocalFontAsBase64(FONT_LOCAL_PATHS.medium)
    ]);
    console.log('✓ Roboto Fonts lokal aus fonts/ Verzeichnis geladen');
  } catch (localError) {
    console.error('❌ Laden der lokalen Font-Dateien ist gescheitert');
    console.error('   Lokal:', localError.message);
    return false;
  }

  fontCache.regular = regular;
  fontCache.medium = medium;
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

  try {
    doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
    doc.addFileToVFS('Roboto-Medium.ttf', fontCache.medium);

    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
    
    console.log('✓ Roboto Fonts erfolgreich registriert');
    return true;
  } catch (err) {
    console.warn('⚠️ Roboto Font-Registration fehlgeschlagen, nutze Helvetica-Fallback');
    console.warn('   Fehler:', err.message);
    return false;
  }
}