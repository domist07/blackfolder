/**
 * PDF Export Manager - Text-Position korrigiert

 */

const PDF_CONFIG = {
    SCALE_X: 95 / 359,
    SCALE_Y: 60 / 226.771,
    NAMEPLATE_WIDTH: 95,
    NAMEPLATE_HEIGHT: 60,
    A4_MARGIN: 10,
    A4_LABEL_OFFSET: 8,
    FONT_NAME: 'helvetica',
    FONT_LABEL: 'helvetica'
};

class PDFExporter {
    constructor(canvasRenderer) {
        this.canvasRenderer = canvasRenderer;
    }

    validateData(data) {
        if (!data.firstName || !data.lastName) {
            alert('Bitte geben Sie mindestens Vor- und Nachname ein!');
            return false;
        }
        return true;
    }

    generateFileName(data, suffix = '') {
        const baseName = `${data.firstName}_${data.lastName}`;
        return suffix ? `${baseName}_${suffix}.pdf` : `${baseName}.pdf`;
    }

    fitTextSize(pdf, text, maxWidthMM, initialSize) {
        let size = initialSize;
        pdf.setFontSize(size);
        
        let textWidth = pdf.getTextWidth(text);
        
        while (textWidth > maxWidthMM && size > 8) {
            size -= 1;
            pdf.setFontSize(size);
            textWidth = pdf.getTextWidth(text);
        }
        
        return size;
    }

    /**
     * Zeichnet Text-Layer - MIT KORREKTEM Y-OFFSET

     */
    drawTextLayer(pdf, data, offsetX = 0, offsetY = 0) {
        // Canvas-Werte in mm umrechnen UND Y-Offset berücksichtigen
        const LEFT_PADDING_MM = 19 * PDF_CONFIG.SCALE_X;
        
        // WICHTIG: TOP_PADDING muss vom Canvas-Y (das bei 14 startet) umgerechnet werden
        // Canvas: 15px ab Y=14 → tatsächlich 1px vom Canvas-Ursprung
        // PDF: Wir wollen ~4mm vom PDF-Rand
        const TOP_PADDING_MM = 4; // Direkt 4mm statt umrechnen
        
        const LINE_SPACING_MM = 2; // ~2mm Zeilenabstand
        const MAX_NAME_WIDTH_MM = 65; // ~65mm
        const MAX_INFO_WIDTH_MM = 50; // ~50mm
        
        let currentY = offsetY + TOP_PADDING_MM;
        
        // Text-Farbe: Weiß
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(PDF_CONFIG.FONT_NAME, 'bold');
        
        // ===== Namen-Größe berechnen =====
        let nameSize = 40;
        
        if (data.firstName && data.lastName) {
            const firstSize = this.fitTextSize(pdf, data.firstName, MAX_NAME_WIDTH_MM, 40);
            const lastSize = this.fitTextSize(pdf, data.lastName, MAX_NAME_WIDTH_MM, 40);
            nameSize = Math.min(firstSize, lastSize);
        } else if (data.firstName) {
            nameSize = this.fitTextSize(pdf, data.firstName, MAX_NAME_WIDTH_MM, 40);
        } else if (data.lastName) {
            nameSize = this.fitTextSize(pdf, data.lastName, MAX_NAME_WIDTH_MM, 40);
        }
        
        // ===== Vorname =====
        if (data.firstName) {
            pdf.setFontSize(nameSize);
            pdf.text(data.firstName, offsetX + LEFT_PADDING_MM, currentY);
            currentY += (nameSize * 0.3527) + LINE_SPACING_MM;
        }
        
        // ===== Nachname =====
        if (data.lastName) {
            pdf.setFontSize(nameSize);
            pdf.text(data.lastName, offsetX + LEFT_PADDING_MM, currentY);
            currentY += (nameSize * 0.3527) + LINE_SPACING_MM;
        }
        
        // ===== Kontaktdaten-Größe =====
        pdf.setFont(PDF_CONFIG.FONT_NAME, 'normal');
        let infoSize = 24;
        
        if (data.phoneNumber) {
            const phoneSize = this.fitTextSize(pdf, data.phoneNumber, MAX_INFO_WIDTH_MM, 24);
            infoSize = Math.min(infoSize, phoneSize);
        }
        
        if (data.email) {
            const emailLines = data.email.split('/');
            for (let line of emailLines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    const emailSize = this.fitTextSize(pdf, trimmedLine, MAX_INFO_WIDTH_MM, 24);
                    infoSize = Math.min(infoSize, emailSize);
                }
            }
        }
        
        // ===== Rufnummer =====
        if (data.phoneNumber) {
            pdf.setFontSize(infoSize);
            pdf.text(data.phoneNumber, offsetX + LEFT_PADDING_MM, currentY);
            currentY += (infoSize * 0.3527) + LINE_SPACING_MM;
        }
        
        // ===== E-Mail =====
        if (data.email) {
            const emailLines = data.email.split('/');
            pdf.setFontSize(infoSize);
            
            for (let line of emailLines) {
                const trimmedLine = line.trim();
                if (trimmedLine && currentY < offsetY + PDF_CONFIG.NAMEPLATE_HEIGHT - 2) {
                    pdf.text(trimmedLine, offsetX + LEFT_PADDING_MM, currentY);
                    currentY += (infoSize * 0.3527) + 1.5;
                }
            }
        }
    }

    /**
     * Zeichnet Namensschild - VEREINFACHT

     */
    drawNameplate(pdf, data, offsetX = 0, offsetY = 0) {
        // Hintergrund (inkl. Logo) zeichnen
        renderBackground(pdf);
        
        // Text darüber zeichnen
        this.drawTextLayer(pdf, data, offsetX, offsetY);
    }

    /**
     * Export Einzelnes Namensschild

     */
    exportSingle(data) {
        if (!this.validateData(data)) return;

        try {
            console.log('🚀 Starte Vektor-PDF Export...');
            
            if (!window.jspdf) {
                throw new Error('jsPDF nicht geladen');
            }
            
            const { jsPDF } = window.jspdf;
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [95, 60],
                compress: true
            });
            
            console.log('✓ PDF erstellt');
            
            // Namensschild zeichnen
            this.drawNameplate(pdf, data, 0, 0);
            
            console.log('✓ Namensschild gezeichnet');
            
            // Metadaten
            pdf.setProperties({
                title: `Namensschild ${data.firstName} ${data.lastName}`,
                subject: 'LJC Namensschild',
                author: 'LJC Generator',
                creator: 'LJC Namensschild Generator'
            });
            
            const fileName = this.generateFileName(data, 'Namensschild');
            pdf.save(fileName);
            
            console.log('✓ PDF gespeichert:', fileName);
            alert('PDF erfolgreich heruntergeladen!');
            
        } catch (error) {
            console.error('❌ Fehler:', error);
            alert(`Fehler: ${error.message}`);
        }
    }

    /**
     * Export A4

     */
    exportA4(data) {
        if (!this.validateData(data)) return;

        try {
            console.log('🚀 Starte A4-PDF Export...');
            
            if (!window.jspdf) {
                throw new Error('jsPDF nicht geladen');
            }
            
            const { jsPDF } = window.jspdf;
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });
            
            const posX = 10;
            const posY = 10;
            
            // Namensschild zeichnen
            pdf.saveGraphicsState();
            
            // Hintergrund direkt an Position
            pdf.setFillColor(157, 0, 0);
            pdf.rect(posX, posY, 95, 60, 'F');
            
            // Weiße Linien
            const lines = [278.812, 282.647, 286.483, 290.318, 294.153];
            pdf.setFillColor(255, 255, 255);
            lines.forEach(x => {
                const xMM = posX + (x * (95 / 359));
                const widthMM = 0.589 * (95 / 359);
                pdf.rect(xMM, posY, widthMM, 60, 'F');
            });
            
            pdf.restoreGraphicsState();
            
            // Text
            this.drawTextLayer(pdf, data, posX, posY);
            
            // Schnittrahmen
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.2);
            pdf.rect(posX, posY, 95, 60);
            
            // Beschriftung
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`${data.firstName} ${data.lastName}`, posX, posY + 60 + 8);
            
            pdf.setFontSize(8);
            pdf.text('Bitte entlang der grauen Linie ausschneiden', posX, posY + 60 + 14);
            
            // Metadaten
            pdf.setProperties({
                title: `Namensschild ${data.firstName} ${data.lastName} - A4`,
                subject: 'LJC Namensschild Druckvorlage',
                creator: 'LJC Generator'
            });
            
            const fileName = this.generateFileName(data, 'A4_Druck');
            pdf.save(fileName);
            
            console.log('✓ A4-PDF gespeichert');
            alert('PDF erfolgreich heruntergeladen!');
            
        } catch (error) {
            console.error('❌ Fehler:', error);
            alert(`Fehler: ${error.message}`);
        }
    }
}