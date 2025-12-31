/**
 * Canvas Renderer
 * 
 * Verwaltet das Zeichnen des Namensschilds:
 * - Hintergrund-Rendering
 * - Text-Anpassung und -Positionierung
 * - Layout-Berechnungen

 */

// ===== Canvas-Konstanten =====
const CANVAS_CONFIG = {
    WIDTH: 359,          // 95 mm
    HEIGHT: 226,         // 60 mm
    LEFT_PADDING: 19,    // 5 mm
    TOP_PADDING: 15,     // ~4 mm
    LINE_SPACING: 8,     // Abstand zwischen Zeilen
    MAX_NAME_WIDTH: 246, // 65 mm für Namen
    MAX_INFO_WIDTH: 189, // 50 mm für Kontaktdaten
    INITIAL_NAME_SIZE: 40,  // Anfangsgröße Namen (pt)
    INITIAL_INFO_SIZE: 24   // Anfangsgröße Kontakt (pt)
};

/**
 * Canvas Renderer Klasse

 */
class CanvasRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas-Element

     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Berechnet die Breite eines Textes
     * @param {string} text - Zu messender Text
     * @param {string} font - CSS-Font-String
     * @returns {number} Breite in Pixeln

     */
    getTextWidth(text, font) {
        this.ctx.font = font;
        return this.ctx.measureText(text).width;
    }

    /**
     * Passt Text-Größe an maximale Breite an
     * @param {string} text - Text
     * @param {number} maxWidth - Maximale Breite
     * @param {number} fontSize - Initiale Schriftgröße
     * @param {string} fontFamily - Schriftart
     * @returns {Object} { size, font }

     */
    fitTextToWidth(text, maxWidth, fontSize, fontFamily = 'Arial') {
        let size = fontSize;
        let font = `bold ${size}px ${fontFamily}`;
        
        // Reduziere Größe bis Text passt (min. 8px)
        while (this.getTextWidth(text, font) > maxWidth && size > 8) {
            size -= 1;
            font = `bold ${size}px ${fontFamily}`;
        }
        
        return { size, font };
    }

    /**
     * Rendert den Text-Layer mit Benutzerdaten
     * @param {Object} data - Benutzerdaten { firstName, lastName, phoneNumber, email }

     */
    renderTextLayer(data) {
        let currentY = CANVAS_CONFIG.TOP_PADDING;
        
        // ===== Namen-Größe berechnen (gleiche Größe für Vor- und Nachname) =====
        let nameSize = CANVAS_CONFIG.INITIAL_NAME_SIZE;
        
        if (data.firstName && data.lastName) {
            const firstData = this.fitTextToWidth(
                data.firstName, 
                CANVAS_CONFIG.MAX_NAME_WIDTH, 
                CANVAS_CONFIG.INITIAL_NAME_SIZE
            );
            const lastData = this.fitTextToWidth(
                data.lastName, 
                CANVAS_CONFIG.MAX_NAME_WIDTH, 
                CANVAS_CONFIG.INITIAL_NAME_SIZE
            );
            // Beide Namen bekommen die kleinere Größe
            nameSize = Math.min(firstData.size, lastData.size);
        } else if (data.firstName) {
            const firstData = this.fitTextToWidth(
                data.firstName, 
                CANVAS_CONFIG.MAX_NAME_WIDTH, 
                CANVAS_CONFIG.INITIAL_NAME_SIZE
            );
            nameSize = firstData.size;
        } else if (data.lastName) {
            const lastData = this.fitTextToWidth(
                data.lastName, 
                CANVAS_CONFIG.MAX_NAME_WIDTH, 
                CANVAS_CONFIG.INITIAL_NAME_SIZE
            );
            nameSize = lastData.size;
        }
        
        // ===== Vorname zeichnen =====
        if (data.firstName) {
            this.ctx.font = `bold ${nameSize}px Arial`;
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            this.ctx.fillText(data.firstName, CANVAS_CONFIG.LEFT_PADDING, currentY);
            currentY += nameSize + CANVAS_CONFIG.LINE_SPACING;
        }
        
        // ===== Nachname zeichnen =====
        if (data.lastName) {
            this.ctx.font = `bold ${nameSize}px Arial`;
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            this.ctx.fillText(data.lastName, CANVAS_CONFIG.LEFT_PADDING, currentY);
            currentY += nameSize + CANVAS_CONFIG.LINE_SPACING;
        }
        
        // ===== Kontaktdaten-Größe berechnen =====
        let infoSize = CANVAS_CONFIG.INITIAL_INFO_SIZE;
        
        // Prüfe Rufnummer
        if (data.phoneNumber) {
            const phoneData = this.fitTextToWidth(
                data.phoneNumber, 
                CANVAS_CONFIG.MAX_INFO_WIDTH, 
                CANVAS_CONFIG.INITIAL_INFO_SIZE
            );
            infoSize = Math.min(infoSize, phoneData.size);
        }
        
        // Prüfe E-Mail-Zeilen (durch "/" getrennt)
        if (data.email) {
            const emailLines = data.email.split('/');
            for (let line of emailLines) {
                const emailData = this.fitTextToWidth(
                    line.trim(), 
                    CANVAS_CONFIG.MAX_INFO_WIDTH, 
                    CANVAS_CONFIG.INITIAL_INFO_SIZE
                );
                infoSize = Math.min(infoSize, emailData.size);
            }
        }
        
        // ===== Rufnummer zeichnen =====
        if (data.phoneNumber) {
            this.ctx.font = `${infoSize}px Arial`;
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            this.ctx.fillText(data.phoneNumber, CANVAS_CONFIG.LEFT_PADDING, currentY);
            currentY += infoSize + CANVAS_CONFIG.LINE_SPACING;
        }
        
        // ===== E-Mail zeichnen (mit manuellem Umbruch durch "/") =====
        if (data.email) {
            const emailLines = data.email.split('/');
            
            this.ctx.font = `${infoSize}px Arial`;
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            for (let line of emailLines) {
                const trimmedLine = line.trim();
                // Zeichne nur wenn Platz vorhanden
                if (trimmedLine && currentY < CANVAS_CONFIG.HEIGHT - CANVAS_CONFIG.TOP_PADDING) {
                    this.ctx.fillText(trimmedLine, CANVAS_CONFIG.LEFT_PADDING, currentY);
                    currentY += infoSize + 4;
                }
            }
        }
    }

    /**
     * Rendert die komplette Vorschau
     * @param {Object} data - Benutzerdaten

     */
    render(data) {
        // Canvas löschen
        this.ctx.clearRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
        
        // Hintergrund zeichnen
        renderBackground(this.ctx);
        
        // Text überlagern
        this.renderTextLayer(data);
        
        console.log('✓ Canvas gerendert');
    }
}