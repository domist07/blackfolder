/**
 * Font-Loader für jsPDF (mit Vorladen von externen URLs)
 * 
 * Lädt Roboto-TTF-Dateien von Google Fonts CDN und
 * registriert sie bei Bedarf in jsPDF-Instanzen.
 * Fallback: Lädt lokal aus dem 'fonts/' Verzeichnis wenn URLs nicht erreichbar sind.
 * 
 * @module fontLoader
 */

// ===== Konfiguration: Externe Font-URLs =====
// Google Fonts CDN liefert TTF-Dateien direkt aus
const FONT_URLS = {
  regular: 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me5Q.ttf',
  medium:  'https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmEU9vAw.ttf'
};

// ===== Konfiguration: Lokale Font-Pfade (Fallback) =====
// Pfade zu lokalen TTF-Dateien relativ zum public/ Verzeichnis
const FONT_LOCAL_PATHS = {
  regular: '/fonts/Roboto-Regular.ttf',
  medium:  '/fonts/Roboto-Medium.ttf'
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
 * Lädt eine Font-Datei lokal aus dem public/ Verzeichnis
 * @param {string} path - Relativer Pfad zur TTF-Datei (beginnend mit /)
 * @returns {Promise<string>} Base64-kodierter Font
 */
async function fetchLocalFontAsBase64(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Lokale Font-Datei nicht ladbar: ${path} (${response.status})`);
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
  } catch (error) {
    console.warn(`⚠️ Lokale Font-Datei nicht gefunden oder ladbar: ${path}`, error.message);
    throw error;
  }
}

/**
 * Interne Ladefunktion (wird nur einmal ausgeführt)
 * @returns {Promise<boolean>}
 */
async function loadFontsInternal() {
  let regular = null;
  let medium = null;
  let loadedFrom = null;

  try {
    // Versuche zuerst das Laden von externen URLs
    [regular, medium] = await Promise.all([
      fetchFontAsBase64(FONT_URLS.regular),
      fetchFontAsBase64(FONT_URLS.medium)
    ]);
    loadedFrom = 'URLs';
    console.log('✓ Roboto Fonts von CDN geladen');
  } catch (urlError) {
    console.warn('⚠️ Font-Laden von URLs fehlgeschlagen:', urlError.message);
    console.log('➡️ Versuche Fallback zu lokalen Dateien...');

    try {
      // Fallback: Lade von lokalen Pfaden
      [regular, medium] = await Promise.all([
        fetchLocalFontAsBase64(FONT_LOCAL_PATHS.regular),
        fetchLocalFontAsBase64(FONT_LOCAL_PATHS.medium)
      ]);
      loadedFrom = 'lokal';
      console.log('✓ Roboto Fonts lokal aus fonts/ Verzeichnis geladen');
    } catch (localError) {
      console.error('❌ Beide Lademethoden sind gescheitert');
      console.error('   URLs:', urlError.message);
      console.error('   Lokal:', localError.message);
      return false;
    }
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

  doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
  doc.addFileToVFS('Roboto-Medium.ttf', fontCache.medium);

  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

  return true;
}