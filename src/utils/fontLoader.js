/**
 * Font-Loader für jsPDF (mit Vorladen von externen URLs)
 * 
 * Lädt Roboto-TTF-Dateien von Google Fonts CDN und
 * registriert sie bei Bedarf in jsPDF-Instanzen.
 * 
 * @module fontLoader
 */

// ===== Konfiguration: Externe Font-URLs =====
// Google Fonts CDN liefert TTF-Dateien direkt aus
const FONT_URLS = {
  regular: 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me5Q.ttf',
  medium:  'https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmEU9vAw.ttf'
};

let fontsLoaded = false;
let fontsLoading = null;
let fontCache = { regular: null, medium: null };

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
 * Lädt eine Font-Datei von einer URL als Base64
 * @param {string} url - Absolute URL zur TTF-Datei
 * @returns {Promise<string>} Base64-kodierter Font
 */
async function fetchFontAsBase64(url) {
  const response = await fetch(url, { 
    mode: 'cors',
    cache: 'force-cache' // Browser-Cache nutzen
  });
  if (!response.ok) throw new Error(`Font nicht ladbar: ${url} (${response.status})`);
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

/**
 * Interne Ladefunktion (wird nur einmal ausgeführt)
 * @returns {Promise<boolean>}
 */
async function loadFontsInternal() {
  try {
    const [regular, medium] = await Promise.all([
      fetchFontAsBase64(FONT_URLS.regular),
      fetchFontAsBase64(FONT_URLS.medium)
    ]);

    fontCache.regular = regular;
    fontCache.medium = medium;
    fontsLoaded = true;

    console.log('✓ Roboto Fonts von CDN geladen');
    return true;
  } catch (error) {
    console.warn('⚠️ Font-Laden fehlgeschlagen:', error.message);
    return false;
  }
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

  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

  return true;
}