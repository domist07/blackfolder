/**
 * Font-Loader für jsPDF
 * 
 * Lädt Roboto-TTF-Dateien, konvertiert zu Base64
 * und registriert sie im jsPDF Virtual File System.
 */

let fontsLoaded = false;
let fontCache = {
  regular: null,
  medium: null
};

/**
 * Konvertiert ArrayBuffer zu Base64-String
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Lädt eine Font-Datei als Base64
 * @param {string} url - Pfad zur TTF-Datei
 * @returns {Promise<string>}
 */
async function fetchFontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Font nicht gefunden: ${url} (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

/**
 * Registriert Roboto-Fonts in einer jsPDF-Instanz
 * 
 * Verwendet Roboto-Medium als "bold" Variante,
 * da echtes Bold im PDF zu fett wirkt verglichen mit der Canvas-Vorschau.
 * 
 * @param {import('jspdf').jsPDF} doc - jsPDF-Instanz
 * @returns {Promise<boolean>} true wenn erfolgreich
 */
export async function registerFonts(doc) {
  if (!fontsLoaded) {
    try {
      const [regular, medium] = await Promise.all([
        fetchFontAsBase64('/fonts/Roboto-Regular.ttf'),
        fetchFontAsBase64('/fonts/Roboto-Medium.ttf')
      ]);
      
      fontCache.regular = regular;
      fontCache.medium = medium;
      fontsLoaded = true;
      
      console.log('✓ Roboto Fonts geladen (Regular + Medium)');
    } catch (error) {
      console.error('⚠️ Font-Laden fehlgeschlagen:', error);
      return false;
    }
  }

  // Regular für Kontaktdaten
  doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  // Medium als "bold" — sieht näher am Canvas-Rendering aus als echtes Bold (700)
  doc.addFileToVFS('Roboto-Medium.ttf', fontCache.medium);
  doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

  return true;
}

/**
 * Prüft ob Fonts gecacht sind
 * @returns {boolean}
 */
export function areFontsLoaded() {
  return fontsLoaded;
}