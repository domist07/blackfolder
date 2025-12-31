/**
 * PDF Export Manager
 * 
 * Exportiert das Namensschild als PDF in verschiedenen Formaten:
 * - Einzelnes Namensschild (95x60mm)
 * - A4 zum Drucken

 */

/**
 * PDF Export Klasse

 */
class PDFExporter {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas-Element

     */
    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * Validiert, ob notwendige Daten vorhanden sind
     * @param {Object} data - Benutzerdaten
     * @returns {boolean} True wenn valide

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
     * @returns {string} Dateiname

     */
    generateFileName(data, suffix = '') {
        const baseName = `${data.firstName}_${data.lastName}`;
        return suffix ? `${baseName}_${suffix}.pdf` : `${baseName}.pdf`;
    }

    /**
     * Exportiert einzelnes Namensschild als PDF
     * @param {Object} data - Benutzerdaten

     */
    exportSingle(data) {
        if (!this.validateData(data)) return;

        try {
            // Hole jsPDF aus globalem Namespace
            const { jsPDF } = window.jspdf;
            
            // PDF im Namensschild-Format erstellen (95 x 60 mm)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [95, 60]
            });
            
            // Canvas zu Bild konvertieren
            const imgData = this.canvas.toDataURL('image/png');
            
            // Bild auf PDF einfügen (volle Größe)
            pdf.addImage(imgData, 'PNG', 0, 0, 95, 60);
            
            // Dateiname generieren und speichern
            const fileName = this.generateFileName(data, 'Namensschild');
            pdf.save(fileName);
            
            console.log('✓ Einzelnes PDF exportiert:', fileName);
            alert('PDF erfolgreich heruntergeladen!');
        } catch (error) {
            console.error('Fehler beim PDF-Export:', error);
            alert('Fehler beim Exportieren. Bitte versuchen Sie es später erneut.');
        }
    }

    /**
     * Exportiert Namensschild auf DIN A4 zum Drucken
     * @param {Object} data - Benutzerdaten

     */
    exportA4(data) {
        if (!this.validateData(data)) return;

        try {
            // Hole jsPDF aus globalem Namespace
            const { jsPDF } = window.jspdf;
            
            // DIN A4 PDF erstellen (210 x 297 mm)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Canvas zu Bild konvertieren
            const imgData = this.canvas.toDataURL('image/png');
            
            // Position und Größe
            const posX = 10;        // 10mm Abstand links
            const posY = 10;        // 10mm Abstand oben
            const width = 95;       // Breite Namensschild
            const height = 60;      // Höhe Namensschild
            
            // Bild auf PDF einfügen
            pdf.addImage(imgData, 'PNG', posX, posY, width, height);
            
            // Optionale Beschriftung unter dem Namensschild
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(
                `${data.firstName} ${data.lastName}`,
                posX,
                posY + height + 8
            );
            
            // Hinweis zum Ausschneiden (optional)
            pdf.setFontSize(8);
            pdf.text(
                'Bitte entlang der Kanten ausschneiden',
                posX,
                posY + height + 14
            );
            
            // Dateiname generieren und speichern
            const fileName = this.generateFileName(data, 'A4_Druck');
            pdf.save(fileName);
            
            console.log('✓ A4 PDF exportiert:', fileName);
            alert('PDF erfolgreich heruntergeladen!');
        } catch (error) {
            console.error('Fehler beim A4-Export:', error);
            alert('Fehler beim Exportieren. Bitte versuchen Sie es später erneut.');
        }
    }
}