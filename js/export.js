class PDFExporter {
    /**
     * @param {HTMLCanvasElement} previewCanvas
     * @param {CanvasRenderer} renderer
     */
    constructor(previewCanvas, renderer) {
        this.previewCanvas = previewCanvas;
        this.renderer = renderer;

        // 600 DPI Konstanten
        // 95mm bei 600 DPI = 95 / 25.4 * 600 ≈ 2244 px
        // 60mm bei 600 DPI = 60 / 25.4 * 600 ≈ 1417 px
        this.DPI = 600;
        this.EXPORT_WIDTH = Math.round(95 / 25.4 * this.DPI);
        this.EXPORT_HEIGHT = Math.round(60 / 25.4 * this.DPI);
        this.JPEG_QUALITY = 0.92; // 92% Qualität, guter Kompromiss
    }

    /**
     * Erstellt ein hochaufgelöstes Canvas (600 DPI)
     * @param {Object} data - Benutzerdaten
     * @returns {HTMLCanvasElement}
     */
    createHiResCanvas(data) {
        const hiResCanvas = document.createElement('canvas');
        hiResCanvas.width = this.EXPORT_WIDTH;
        hiResCanvas.height = this.EXPORT_HEIGHT;
        
        const hiResCtx = hiResCanvas.getContext('2d');

        // Skalierungsfaktor
        const scaleX = this.EXPORT_WIDTH / CANVAS_CONFIG.WIDTH;
        const scaleY = this.EXPORT_HEIGHT / CANVAS_CONFIG.HEIGHT;

        hiResCtx.scale(scaleX, scaleY);

        // Hintergrund zeichnen
        renderBackground(hiResCtx);

        // Text zeichnen
        const tempRenderer = new CanvasRenderer(hiResCanvas);
        tempRenderer.ctx = hiResCtx;
        tempRenderer.renderTextLayer(data);

        return hiResCanvas;
    }

    /**
     * Konvertiert Canvas zu komprimiertem JPEG Data-URL
     * @param {HTMLCanvasElement} canvas
     * @returns {string} JPEG Data-URL
     */
    getCompressedImage(canvas) {
        return canvas.toDataURL('image/jpeg', this.JPEG_QUALITY);
    }

    /**
     * Validiert Daten
     * @param {Object} data
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
     * @param {Object} data
     * @param {string} suffix
     * @returns {string}
     */
    generateFileName(data, suffix = '') {
        const baseName = `${data.firstName}_${data.lastName}`;
        return suffix ? `${baseName}_${suffix}.pdf` : `${baseName}.pdf`;
    }

    /**
     * Exportiert einzelnes Namensschild als PDF (600 DPI, komprimiert)
     * @param {Object} data
     */
    exportSingle(data) {
        if (!this.validateData(data)) return;

        try {
            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [95, 60],
                compress: true
            });

            const hiResCanvas = this.createHiResCanvas(data);
            const imgData = this.getCompressedImage(hiResCanvas);

            pdf.addImage(imgData, 'JPEG', 0, 0, 95, 60);

            const fileName = this.generateFileName(data, 'Namensschild');
            pdf.save(fileName);

            console.log(`✓ PDF exportiert (${this.DPI} DPI, JPEG ${this.JPEG_QUALITY * 100}%):`, fileName);
        } catch (error) {
            console.error('Fehler beim PDF-Export:', error);
            alert('Fehler beim Exportieren. Bitte versuchen Sie es erneut.');
        }
    }

    /**
     * Exportiert auf DIN A4 zum Drucken (600 DPI, komprimiert)
     * @param {Object} data
     */
    exportA4(data) {
        if (!this.validateData(data)) return;

        try {
            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const hiResCanvas = this.createHiResCanvas(data);
            const imgData = this.getCompressedImage(hiResCanvas);

            // 10mm Abstand oben und links
            pdf.addImage(imgData, 'JPEG', 10, 10, 95, 60);

            // Schnittmarkierungen
            pdf.setDrawColor(180, 180, 180);
            pdf.setLineWidth(0.2);

            const x = 10, y = 10, w = 95, h = 60, m = 3;
            pdf.line(x - m, y, x, y);
            pdf.line(x, y - m, x, y);
            pdf.line(x + w, y, x + w + m, y);
            pdf.line(x + w, y - m, x + w, y);
            pdf.line(x - m, y + h, x, y + h);
            pdf.line(x, y + h, x, y + h + m);
            pdf.line(x + w, y + h, x + w + m, y + h);
            pdf.line(x + w, y + h, x + w, y + h + m);

            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Entlang der Markierungen ausschneiden', x, y + h + 10);

            const fileName = this.generateFileName(data, 'A4_Druck');
            pdf.save(fileName);

            console.log(`✓ A4 PDF exportiert (${this.DPI} DPI, JPEG ${this.JPEG_QUALITY * 100}%):`, fileName);
        } catch (error) {
            console.error('Fehler beim A4-Export:', error);
            alert('Fehler beim Exportieren. Bitte versuchen Sie es erneut.');
        }
    }
}