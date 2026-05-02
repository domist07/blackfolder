/**
 * Font-Loader für jsPDF (mit Vorladen)
 * 
 * Lädt Roboto-TTF-Dateien beim App-Start und
 * registriert sie bei Bedarf in jsPDF-Instanzen.
 * 
 * @module fontLoader
 */

let fontsLoaded = false;
let fontsLoading = null; // Promise für laufenden Ladevorgang
let fontCache = { regular: null, medium: null };

/**
 * Konvertiert ArrayBuffer zu Base64-String
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  // In Chunks verarbeiten (Performance bei großen Dateien)
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.slice(i, i + 8192)));
  }
  return btoa(chunks.join(''));
}

/**
 * Lädt eine Font-Datei als Base64
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchFontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font nicht gefunden: ${url}`);
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
      fetchFontAsBase64('/fonts/Roboto-Regular.ttf'),
      fetchFontAsBase64('/fonts/Roboto-Medium.ttf')
    ]);

    fontCache.regular = regular;
    fontCache.medium = medium;
    fontsLoaded = true;

    console.log('✓ Roboto Fonts geladen');
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
  // Sicherstellen dass Fonts geladen sind
  const success = await preloadFonts();
  if (!success) return false;

  // Im jsPDF Virtual File System registrieren
  doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
  doc.addFileToVFS('Roboto-Medium.ttf', fontCache.medium);

  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold'); // Medium als "bold"

  return true;
}