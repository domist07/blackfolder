import { useState, useEffect, useCallback } from 'react';
import TextInputPanel from './TextInputPanel';
import NamesschildPreview from './NamesschildPreview';
import { exportSinglePdf, exportA4Pdf } from '../utils/pdfExport';
import { preloadFonts } from '../utils/fontLoader';

const STORAGE_KEY = 'ljc_namensschild_data';
const INITIAL_DATA = { firstName: '', lastName: '', phoneNumber: '', email: '' };

/**
 * NamesschildGenerator - Hauptkomponente
 */
function NamesschildGenerator() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  const [isExporting, setIsExporting] = useState(false);

  // 🚀 Fonts beim App-Start vorladen (im Hintergrund)
  useEffect(() => {
    preloadFonts();
  }, []);

  // State in LocalStorage speichern
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage nicht verfügbar');
    }
  }, [data]);

  const handleDataChange = useCallback((newData) => {
    setData(newData);
  }, []);

  const handleExport = useCallback(async (exportFn) => {
    setIsExporting(true);
    try {
      await exportFn(data);
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  const canExport = (data.firstName.trim() || data.lastName.trim()) && !isExporting;

  return (
    <div className="generator-container">
      <header className="generator-header">
        <h1>LJC Namensschild Generator</h1>
        <p>Erstelle dein persönliches Namensschild für die Notenmappe</p>
      </header>

      <TextInputPanel data={data} onChange={handleDataChange} />

      <div>
        <NamesschildPreview data={data} />

        <div className="export-buttons" style={{ marginTop: '1.5rem' }}>
          <button
            className="btn-export"
            onClick={() => handleExport(exportSinglePdf)}
            disabled={!canExport}
          >
            {isExporting ? '⏳ Erstelle PDF...' : '📥 Als PDF speichern'}
          </button>
          <button
            className="btn-export"
            onClick={() => handleExport(exportA4Pdf)}
            disabled={!canExport}
          >
            {isExporting ? '⏳ Erstelle PDF...' : '📄 A4 zum Drucken'}
          </button>
        </div>
      </div>

      <footer className="site-footer">
        <p className="footer-credit">
          Erstellt von Dominik für den tollsten Chor der Welt 🐥.
          Dominik hat im LJC von 2012 bis 2026 mitgesungen
          und war von 2017 bis 2025 Betreuer für Öffentlichkeitsarbeit.
        </p>
        <a href="https://github.com/domist07/blackfolder" target="_blank" rel="noopener noreferrer" className="footer-link">
          GitHub Repository
        </a>
      </footer>
    </div>
  );
}

export default NamesschildGenerator;