/**
 * Namensschild Generator - Main Script (v2 mit background.html)
 * 
 * Lädt Logo und Hintergrund aus background.html

 */

// ============================================
// KONFIGURATION
// ============================================

const CONFIG = {
    NAMETAG_WIDTH: 794,
    NAMETAG_HEIGHT: 378,
    TEXT_MAX_WIDTH: 650,
    TEXT_MAX_HEIGHT: 280,
    FONT_SIZE_MIN: 12,
    FONT_SIZE_MAX: 48,
    FONT_SIZE_STEP: 2,
    LOGO_WIDTH: 80,
    LOGO_HEIGHT: 80,
    MEASUREMENT_CANVAS: null,
    BACKGROUND_FILE: 'background.html' // ← NEUE DATEI
};

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    additionalText: '',
    currentFontSize: 28,
    design: 'light', // 'light' oder 'dark'
    backgroundSVG: null,
    logoSVG: null
};

// ============================================
// INITIALISIERUNG
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialisiert die Anwendung und lädt background.html

 */
async function initializeApp() {
    try {
        // 1. background.html laden
        await loadBackgroundComponents();

        // 2. Canvas für Textmessungen vorbereiten
        CONFIG.MEASUREMENT_CANVAS = document.createElement('canvas');
        CONFIG.MEASUREMENT_CANVAS.getContext('2d');

        // 3. Input-Elemente registrieren
        registerInputListeners();

        // 4. Button-Listener
        document.getElementById('resetBtn').addEventListener('click', resetForm);
        document.getElementById('exportPdf').addEventListener('click', exportToPDF);

        // 5. Design-Selector
        document.getElementById('designSelector').addEventListener('change', (e) => {
            state.design = e.target.value;
            updateBackgroundDesign();
            updatePreview();
        });

        // 6. Initiale Vorschau
        updatePreview();

    } catch (error) {
        console.error('Initialisierungsfehler:', error);
        alert('❌ Fehler beim Laden der Komponenten');
    }
}

/**
 * Lädt Logo und Hintergrund aus background.html

 */
async function loadBackgroundComponents() {
    try {
        const response = await fetch(CONFIG.BACKGROUND_FILE);
        const html = await response.text();

        // HTML in einen Container parsen
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Logo SVG extrahieren
        const logoSvg = doc.getElementById('logo-svg');
        if (logoSvg) {
            state.logoSVG = logoSvg.cloneNode(true);
            const logoArea = document.getElementById('logoArea');
            logoArea.innerHTML = '';
            logoArea.appendChild(state.logoSVG.cloneNode(true));
            console.log('✓ Logo geladen');
        }

        // Hintergrund SVGs extrahieren
        state.backgroundSVG = {
            light: doc.getElementById('background-svg'),
            dark: doc.getElementById('background-black-svg')
        };

        if (state.backgroundSVG.light && state.backgroundSVG.dark) {
            console.log('✓ Hintergründe geladen');
            updateBackgroundDesign();
        }

    } catch (error) {
        console.error('Fehler beim Laden von background.html:', error);
        throw error;
    }
}

/**
 * Aktualisiert das Hintergrund-Design

 */
function updateBackgroundDesign() {
    const backgroundContainer = document.getElementById('nametagBackground');
    backgroundContainer.innerHTML = '';

    const svgKey = state.design;
    const svg = state.backgroundSVG[svgKey];

    if (svg) {
        const clonedSvg = svg.cloneNode(true);
        clonedSvg.style.display = 'block';
        backgroundContainer.appendChild(clonedSvg);
    }

    // Text-Farbe anpassen
    const nametag = document.getElementById('nametagPreview');
    nametag.classList.toggle('dark-design', state.design === 'dark');
}

/**
 * Registriert Input-Listener

 */
function registerInputListeners() {
    const inputs = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        phone: document.getElementById('phone'),
        email: document.getElementById('email'),
        textContent: document.getElementById('textContent')
    };

    Object.values(inputs).forEach(input => {
        input.addEventListener('input', handleInput);
    });

    // Shift+Enter für Zeilenumbruch in Textarea
    inputs.textContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            handleInput();
        }
    });
}

// ============================================
// INPUT HANDLING
// ============================================

/**
 * Behandelt Input-Änderungen

 */
function handleInput(e) {
    const input = e?.target;

    if (input) {
        if (input.id === 'firstName') state.firstName = input.value;
        if (input.id === 'lastName') state.lastName = input.value;
        if (input.id === 'phone') state.phone = input.value;
        if (input.id === 'email') state.email = input.value;
        if (input.id === 'textContent') state.additionalText = input.value;
    }

    updatePreview();
}

// ============================================
// VORSCHAU-GENERATION
// ============================================

/**
 * Generiert den anzuzeigenden Text

 */
function generateDisplayText() {
    let text = '';

    if (state.firstName || state.lastName) {
        text += `${state.firstName} ${state.lastName}`.trim() + '\n\n';
    }

    if (state.phone) {
        text += state.phone + '\n';
    }

    if (state.email) {
        text += state.email + '\n';
    }

    if (state.additionalText) {
        text += '\n' + state.additionalText;
    }

    return text.trim();
}

/**
 * Berechnet die optimale Schriftgröße

 */
function calculateOptimalFontSize(text) {
    if (!text) return CONFIG.FONT_SIZE_MAX;

    const canvas = CONFIG.MEASUREMENT_CANVAS;
    const ctx = canvas.getContext('2d');
    let fontSize = CONFIG.FONT_SIZE_MAX;
    const lines = text.split('\n');

    while (fontSize >= CONFIG.FONT_SIZE_MIN) {
        ctx.font = `600 ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;

        let totalHeight = 0;
        let maxWidth = 0;
        const lineHeight = fontSize * 1.4;

        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            totalHeight += lineHeight;
            maxWidth = Math.max(maxWidth, metrics.width);
        });

        if (maxWidth <= CONFIG.TEXT_MAX_WIDTH && totalHeight <= CONFIG.TEXT_MAX_HEIGHT) {
            return fontSize;
        }

        fontSize -= CONFIG.FONT_SIZE_STEP;
    }

    return CONFIG.FONT_SIZE_MIN;
}

/**
 * Aktualisiert die Live-Vorschau

 */
function updatePreview() {
    const displayText = generateDisplayText();
    const optimalFontSize = calculateOptimalFontSize(displayText);

    state.currentFontSize = optimalFontSize;

    const previewContent = document.getElementById('previewContent');

    if (!displayText) {
        previewContent.innerHTML = '<p style="color: #999;">Deine Eingaben werden hier angezeigt...</p>';
        return;
    }

    const escapedText = displayText
        .split('\n')
        .map(line => `<p>${escapeHtml(line)}</p>`)
        .join('');

    previewContent.innerHTML = escapedText;
    previewContent.style.fontSize = `${optimalFontSize}px`;
}

/**
 * Escaped HTML-Zeichen

 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// FORM HANDLING
// ============================================

/**
 * Setzt das Formular zurück

 */
function resetForm() {
    state.firstName = '';
    state.lastName = '';
    state.phone = '';
    state.email = '';
    state.additionalText = '';
    state.currentFontSize = 28;

    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('textContent').value = '';

    updatePreview();

    const btn = document.getElementById('resetBtn');
    btn.textContent = '✓ Zurückgesetzt';
    setTimeout(() => {
        btn.textContent = 'Zurücksetzen';
    }, 1500);
}

// ============================================
// PDF EXPORT
// ============================================

/**
 * Exportiert das Namensschild als PDF

 */
async function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [210, 100]
        });

        // SVG Hintergrund als Base64 zeichnen
        await drawBackgroundOnPDF(pdf);

        // Text zeichnen
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(state.currentFontSize * 0.264583);
        pdf.setTextColor(state.design === 'dark' ? 255 : 26, state.design === 'dark' ? 255 : 26, state.design === 'dark' ? 255 : 26);

        const displayText = generateDisplayText();
        const lines = displayText.split('\n');

        let yPos = 20;
        const lineHeightMm = (state.currentFontSize * 1.4) * 0.264583;

        lines.forEach(line => {
            if (line.trim()) {
                pdf.text(line, 10, yPos, { maxWidth: 150 });
                yPos += lineHeightMm;
            }
        });

        // Logo als SVG zeichnen (rechts oben)
        if (state.logoSVG) {
            // Logo als Canvas rendern und ins PDF einfügen
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');

            // SVG in Canvas rendern
            const svg = new XMLSerializer().serializeToString(state.logoSVG);
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 175, 7, 20, 20); // Position: rechts oben
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        }

        // PDF speichern
        const timestamp = new Date().toLocaleString('de-DE').replace(/[:.]/g, '-');
        const fileName = `Namensschild_${state.firstName}_${state.lastName}_${timestamp}.pdf`;
        pdf.save(fileName);

        // Visuelles Feedback
        const btn = document.getElementById('exportPdf');
        const originalText = btn.textContent;
        btn.textContent = '✓ PDF erstellt!';
        btn.style.background = '#28a745';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);

    } catch (error) {
        console.error('PDF Export Fehler:', error);
        alert('❌ Fehler beim PDF-Export');
    }
}

/**
 * Zeichnet den Hintergrund ins PDF

 */
async function drawBackgroundOnPDF(pdf) {
    const svg = state.backgroundSVG[state.design];
    if (!svg) return;

    // SVG zu Canvas rendern
    const canvas = document.createElement('canvas');
    canvas.width = 794;
    canvas.height = 378;
    const ctx = canvas.getContext('2d');

    // SVG zeichnen
    const svg2img = new Image();
    const svgString = new XMLSerializer().serializeToString(svg);
    svg2img.onload = () => {
        ctx.drawImage(svg2img, 0, 0);
    };
    svg2img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
}