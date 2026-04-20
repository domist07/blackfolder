/**
 * PDF Export Manager
 * 
 * Exportiert das Namensschild als PDF in 300 DPI:
 * - Einzelnes Namensschild (95x60mm)
 * - A4 zum Drucken (10mm Rand oben/links)
 */

class PDFExporter {
    /**
     * @param {HTMLCanvasElement} previewCanvas - Vorschau-Canvas (niedrig aufgelöst)
     * @param {CanvasRenderer} renderer - Canvas-Renderer für Hochauflösung
     */
    constructor(previewCanvas, renderer) {
        this.previewCanvas = previewCanvas;
        this.renderer = renderer;

        // 300 DPI Konstanten
        // 95mm bei 300 DPI = 95 / 25.4 * 300 ≈ 1122 px
        // 60mm bei 300 DPI = 60 / 25.4 * 300 ≈  709 px
        this.DPI = 300;
        this.EXPORT_WIDTH = Math.round(95 / 25.4 * this.DPI);   // 1122
        this.EXPORT_HEIGHT = Math.round(60 / 25.4 * this.DPI);  // 709
    }

    /**
     * Erstellt ein hochaufgelöstes Canvas (300 DPI) für den Export
     * @param {Object} data - Benutzerdaten
     * @returns {HTMLCanvasElement} Hochaufgelöstes Canvas
     */
    createHiResCanvas(data) {
        const hiResCanvas = document.createElement('canvas');
        hiResCanvas.width = this.EXPORT_WIDTH;
        hiResCanvas.height = this.EXPORT_HEIGHT;
        
        const hiResCtx = hiResCanvas.getContext('2d');

        // Skalierungsfaktor berechnen
        const scaleX = this.EXPORT_WIDTH / CANVAS_CONFIG.WIDTH;
        const scaleY = this.EXPORT_HEIGHT / CANVAS_CONFIG.HEIGHT;

        // Skalieren
        hiResCtx.scale(scaleX, scaleY);

        // Hintergrund zeichnen
        renderBackground(hiResCtx);

        // Text zeichnen (nutzt den gleichen Renderer mit anderem Context)
        const tempRenderer = new CanvasRenderer(hiResCanvas);
        tempRenderer.ctx = hiResCtx;
        tempRenderer.renderTextLayer(data);

        return hiResCanvas;
    }

    /**
     * Validiert, ob notwendige Daten vorhanden sind
     * @param {Object} data - Benutzerdaten
     * @returns {boolean}
     */
    validateData(data) {
        if (!data.firstName || !data.lastName) {
            alert('Bitte geben Sie mindestens Vor- und Nachname ein!');
            return false;
        }
        return true;
    }

    /**
     * Generiert Dateinamen
     * @param {Object} data - Benutzerdaten
     * @param {string} suffix - Dateiname-Suffix
     * @returns {string}
     */
    generateFileName(data, suffix = '') {
        const baseName = `${data.firstName}_${data.lastName}`;
        return suffix ? `${baseName}_${suffix}.pdf` : `${baseName}.pdf`;
    }

    /**
     * Exportiert einzelnes Namensschild als PDF (300 DPI)
     * @param {Object} data - Benutzerdaten
     */
    exportSingle(data) {
        if (!this.validateData(data)) return;

        try {
            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [95, 60]
            });

            // Hochaufgelöstes Bild erstellen
            const hiResCanvas = this.createHiResCanvas(data);
            const imgData = hiResCanvas.toDataURL('image/png');

            // Bild einfügen (volle Größe)
            pdf.addImage(imgData, 'PNG', 0, 0, 95, 60);

            const fileName = this.generateFileName(data, 'Namensschild');
            pdf.save(fileName);

            console.log(`✓ PDF exportiert (${this.DPI} DPI):`, fileName);
        } catch (error) {
            console.error('Fehler beim PDF-Export:', error);
            alert('Fehler beim Exportieren. Bitte versuchen Sie es erneut.');
        }
    }

    /**
     * Exportiert Namensschild auf DIN A4 zum Drucken (300 DPI)
     * @param {Object} data - Benutzerdaten
     */
    exportA4(data) {
        if (!this.validateData(data)) return;

        try {
            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Hochaufgelöstes Bild erstellen
            const hiResCanvas = this.createHiResCanvas(data);
            const imgData = hiResCanvas.toDataURL('image/png');

            // 10mm Abstand oben und links
            pdf.addImage(imgData, 'PNG', 10, 10, 95, 60);

            // Schnittmarkierungen (dezente Linien)
            pdf.setDrawColor(180, 180, 180);
            pdf.setLineWidth(0.2);

            // Ecken markieren
            const x = 10, y = 10, w = 95, h = 60, m = 3;
            // Oben-Links
            pdf.line(x - m, y, x, y);
            pdf.line(x, y - m, x, y);
            // Oben-Rechts
            pdf.line(x + w, y, x + w + m, y);
            pdf.line(x + w, y - m, x + w, y);
            // Unten-Links
            pdf.line(x - m, y + h, x, y + h);
            pdf.line(x, y + h, x, y + h + m);
            // Unten-Rechts
            pdf.line(x + w, y + h, x + w + m, y + h);
            pdf.line(x + w, y + h, x + w, y + h + m);

            // Hinweis
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Entlang der Markierungen ausschneiden', x, y + h + 10);

            const fileName = this.generateFileName(data, 'A4_Druck');
            pdf.save(fileName);

            console.log(`✓ A4 PDF exportiert (${this.DPI} DPI):`, fileName);
        } catch (error) {
            console.error('Fehler beim A4-Export:', error);
            alert('Fehler beim Exportieren. Bitte versuchen Sie es erneut.');
        }
    }
}