import { useRef, useEffect, useCallback } from 'react';
import { CANVAS, FONTS } from '../utils/constants.js';
import { renderBackground } from '../utils/backgroundRenderer.js';

/**
 * NamesschildPreview - Canvas-basierte Live-Vorschau des Namensschilds
 * 
 * Zeichnet in Echtzeit:
 * - Roten Hintergrund mit Logo und Streifen
 * - Benutzertexte mit automatischer Größenanpassung
 * 
 * @param {Object} props
 * @param {Object} props.data - Aktuelle Formulardaten
 */
function NamesschildPreview({ data }) {
  const canvasRef = useRef(null);

  /**
   * Berechnet die optimale Schriftgröße für einen Text
   * Reduziert die Größe schrittweise, bis der Text in die maximale Breite passt
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
   * @param {string} text - Zu messender Text
   * @param {number} maxWidth - Maximale Breite in Pixeln
   * @param {number} initialSize - Anfangsgröße in Pixeln
   * @param {string} weight - Font-Weight ('bold' oder 'normal')
   * @returns {number} Angepasste Schriftgröße
   */
  const calculateFontSize = useCallback((ctx, text, maxWidth, initialSize, weight = 'bold') => {
    let size = initialSize;
    const fontFamily = FONTS.PREVIEW;

    while (size > CANVAS.MIN_FONT_SIZE) {
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      const measured = ctx.measureText(text).width;
      
      if (measured <= maxWidth) {
        return size;
      }
      size -= 1;
    }

    return CANVAS.MIN_FONT_SIZE;
  }, []);

  /**
   * Rendert alle Textinhalte auf das Canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
   */
  const renderText = useCallback((ctx) => {
    const fontFamily = FONTS.PREVIEW;
    let currentY = CANVAS.TOP_PADDING;

    // ===== Einheitliche Namens-Größe berechnen =====
    let nameSize = CANVAS.INITIAL_NAME_SIZE;

    if (data.firstName) {
      const firstSize = calculateFontSize(
        ctx, data.firstName, CANVAS.MAX_NAME_WIDTH, CANVAS.INITIAL_NAME_SIZE, 'bold'
      );
      nameSize = Math.min(nameSize, firstSize);
    }
    if (data.lastName) {
      const lastSize = calculateFontSize(
        ctx, data.lastName, CANVAS.MAX_NAME_WIDTH, CANVAS.INITIAL_NAME_SIZE, 'bold'
      );
      nameSize = Math.min(nameSize, lastSize);
    }

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // ===== Vorname =====
    if (data.firstName) {
      ctx.font = `bold ${nameSize}px ${fontFamily}`;
      ctx.fillText(data.firstName, CANVAS.LEFT_PADDING, currentY);
      currentY += nameSize + CANVAS.LINE_SPACING;
    }

    // ===== Nachname =====
    if (data.lastName) {
      ctx.font = `bold ${nameSize}px ${fontFamily}`;
      ctx.fillText(data.lastName, CANVAS.LEFT_PADDING, currentY);
      currentY += nameSize + CANVAS.LINE_SPACING;
    }

    // ===== Einheitliche Info-Größe berechnen =====
    let infoSize = CANVAS.INITIAL_INFO_SIZE;

    if (data.phoneNumber) {
      const phoneSize = calculateFontSize(
        ctx, data.phoneNumber, CANVAS.MAX_INFO_WIDTH, CANVAS.INITIAL_INFO_SIZE, 'normal'
      );
      infoSize = Math.min(infoSize, phoneSize);
    }

    if (data.email) {
      const emailLines = data.email.split('/').map(l => l.trim()).filter(Boolean);
      emailLines.forEach(line => {
        const lineSize = calculateFontSize(
          ctx, line, CANVAS.MAX_INFO_WIDTH, CANVAS.INITIAL_INFO_SIZE, 'normal'
        );
        infoSize = Math.min(infoSize, lineSize);
      });
    }

    // ===== Telefonnummer =====
    if (data.phoneNumber) {
      ctx.font = `normal ${infoSize}px ${fontFamily}`;
      ctx.fillText(data.phoneNumber, CANVAS.LEFT_PADDING, currentY);
      currentY += infoSize + CANVAS.LINE_SPACING;
    }

    // ===== E-Mail (mit "/" Umbruch) =====
    if (data.email) {
      const emailLines = data.email.split('/').map(l => l.trim()).filter(Boolean);
      ctx.font = `normal ${infoSize}px ${fontFamily}`;

      emailLines.forEach(line => {
        if (currentY < CANVAS.HEIGHT - CANVAS.TOP_PADDING) {
          ctx.fillText(line, CANVAS.LEFT_PADDING, currentY);
          currentY += infoSize + 4;
        }
      });
    }
  }, [data, calculateFontSize]);

  /**
   * Haupt-Render-Funktion: Zeichnet Hintergrund + Text
   */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Canvas löschen
    ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    
    // Hintergrund (Rot + Logo + Streifen)
    renderBackground(ctx);
    
    // Text-Overlay
    renderText(ctx);
  }, [renderText]);

  // Re-render bei Datenänderung
  useEffect(() => {
    // Warte bis Fonts geladen sind (für korrekte Messung)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        renderCanvas();
      });
    } else {
      // Fallback für Browser ohne Font Loading API
      renderCanvas();
    }
  }, [renderCanvas]);

  return (
    <div className="content-box preview-section">
      <h2 style={{ 
        fontFamily: "'Roboto', sans-serif",
        color: '#9d0000',
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        Vorschau
      </h2>
      <span className="preview-label">Dein Namensschild (95 × 60 mm):</span>
      
      <div className="preview-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS.WIDTH}
          height={CANVAS.HEIGHT}
          aria-label="Namensschild Vorschau"
          role="img"
        />
      </div>
    </div>
  );
}

export default NamesschildPreview;