/**
 * Font-Loader für jsPDF
 * 
 * Lädt Roboto-TTF-Dateien, konvertiert sie zu Base64
 * und registriert sie im jsPDF Virtual File System.
 * 
 * @module fontLoader
 */

/** Cache für geladene Font-Daten */
let fontsLoaded = false;
let fontCache = {
  regular: null,
  bold: null
};

/**
 * Konvertiert einen ArrayBuffer zu einem Base64-String
 * @param {ArrayBuffer} buffer - Font-Datei als ArrayBuffer
 * @returns {string} Base64-encodierter String
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
 * Lädt eine Font-Datei und gibt sie als Base64 zurück
 * @param {string} url - Pfad zur TTF-Datei
 * @returns {Promise<string>} Base64-String der Font-Datei
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
 * Lädt und registriert Roboto-Fonts in einer jsPDF-Instanz
 * 
 * Muss VOR dem ersten text()-Aufruf aufgerufen werden.
 * Fonts werden nach dem ersten Laden gecacht.
 * 
 * @param {import('jspdf').jsPDF} doc - jsPDF-Instanz
 * @returns {Promise<void>}
 * 
 * @example
 * const doc = new jsPDF(...);
 * await registerFonts(doc);
 * doc.setFont('Roboto', 'bold');
 * doc.text('Hallo', 10, 10);
 */
export async function registerFonts(doc) {
  // Fonts nur einmal laden, dann aus Cache
  if (!fontsLoaded) {
    try {
      const [regular, bold] = await Promise.all([
        fetchFontAsBase64('/fonts/Roboto-Regular.ttf'),
        fetchFontAsBase64('/fonts/Roboto-Bold.ttf')
      ]);
      
      fontCache.regular = regular;
      fontCache.bold = bold;
      fontsLoaded = true;
      
      console.log('✓ Roboto Fonts geladen und gecacht');
    } catch (error) {
      console.error('⚠️ Font-Laden fehlgeschlagen, verwende Helvetica:', error);
      return; // Fallback: Helvetica bleibt aktiv
    }
  }

  // Fonts im jsPDF Virtual File System registrieren
  doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
  doc.addFileToVFS('Roboto-Bold.ttf', fontCache.bold);

  // Fonts als verwendbare Schriftarten registrieren
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
}

/**
 * Prüft ob Fonts bereits gecacht sind (für synchrone Prüfung)
 * @returns {boolean}
 */
export function areFontsLoaded() {
  return fontsLoaded;
}