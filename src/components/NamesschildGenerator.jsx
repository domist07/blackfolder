import { useState, useEffect, useCallback } from 'react';
import TextInputPanel from './TextInputPanel';
import NamesschildPreview from './NamesschildPreview';
import { exportSinglePdf, exportA4Pdf } from '../utils/pdfExport';

const STORAGE_KEY = 'ljc_namensschild_data';
const INITIAL_DATA = { firstName: '', lastName: '', phoneNumber: '', email: '' };

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage nicht verfügbar:', e);
    }
  }, [data]);

  const handleDataChange = useCallback((newData) => {
    setData(newData);
  }, []);

  /**
   * Wrapper für async Export mit Loading-State
   * @param {Function} exportFn - Async Export-Funktion
   */
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
        <h1>🎵 LJC Namensschild Generator</h1>
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
            {isExporting ? '⏳ Wird erstellt...' : '📥 Als PDF speichern'}
          </button>
          <button
            className="btn-export"
            onClick={() => handleExport(exportA4Pdf)}
            disabled={!canExport}
          >
            {isExporting ? '⏳ Wird erstellt...' : '📄 A4 zum Drucken'}
          </button>
        </div>
      </div>

      <footer className="site-footer">
        <p className="footer-credit">
          Erstellt von Dominik für den tollsten Chor der Welt
        </p>
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="footer-link">
          GitHub Repository
        </a>
      </footer>
    </div>
  );
}

export default NamesschildGenerator;