import { useState, useEffect, useCallback } from 'react';
import TextInputPanel from './TextInputPanel';
import NamesschildPreview from './NamesschildPreview';
import { exportSinglePdf, exportA4Pdf } from '../utils/pdfExport';

/** LocalStorage Key */
const STORAGE_KEY = 'ljc_namensschild_data';

/** Initiale Formulardaten */
const INITIAL_DATA = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: ''
};

/**
 * NamesschildGenerator - Hauptkomponente
 * 
 * Orchestriert:
 * - State-Management (mit LocalStorage-Persistenz)
 * - Eingabe-Panel
 * - Live-Vorschau
 * - PDF-Export
 */
function NamesschildGenerator() {
  const [data, setData] = useState(() => {
    // Initialisierung aus LocalStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  /**
   * Speichert Daten bei jeder Änderung in LocalStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('LocalStorage nicht verfügbar:', error);
    }
  }, [data]);

  /**
   * Handler für Datenänderungen aus dem Input-Panel
   * @param {Object} newData - Aktualisierte Daten
   */
  const handleDataChange = useCallback((newData) => {
    setData(newData);
  }, []);

  /**
   * PDF-Export: Einzelnes Namensschild
   */
  const handleExportSingle = useCallback(() => {
    exportSinglePdf(data);
  }, [data]);

  /**
   * PDF-Export: A4-Druckvorlage
   */
  const handleExportA4 = useCallback(() => {
    exportA4Pdf(data);
  }, [data]);

  /** Prüft ob Export möglich ist (mindestens ein Name) */
  const canExport = data.firstName.trim() || data.lastName.trim();

  return (
    <div className="generator-container">
      {/* Header */}
      <header className="generator-header">
        <h1>🎵 LJC Namensschild Generator</h1>
        <p>Erstelle dein persönliches Namensschild für die Notenmappe</p>
      </header>

      {/* Linke Spalte: Eingabe */}
      <TextInputPanel data={data} onChange={handleDataChange} />

      {/* Rechte Spalte: Vorschau + Export */}
      <div>
        <NamesschildPreview data={data} />

        {/* Export-Buttons */}
        <div className="export-buttons" style={{ marginTop: '1.5rem' }}>
          <button
            className="btn-export"
            onClick={handleExportSingle}
            disabled={!canExport}
            title={!canExport ? 'Bitte mindestens einen Namen eingeben' : 'PDF herunterladen'}
          >
            📥 Als PDF speichern
          </button>
          <button
            className="btn-export"
            onClick={handleExportA4}
            disabled={!canExport}
            title={!canExport ? 'Bitte mindestens einen Namen eingeben' : 'A4 Druckversion'}
          >
            📄 A4 zum Drucken
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p className="footer-credit">
          Erstellt von Dominik für den tollsten Chor der Welt
        </p>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub Repository
        </a>
      </footer>
    </div>
  );
}

export default NamesschildGenerator;