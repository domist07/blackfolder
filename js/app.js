/**
 * LJC Namensschild Generator - Hauptanwendung
 * 
 * Koordiniert alle Komponenten:
 * - Formulareingabe und Validierung
 * - Canvas-Rendering
 * - PDF-Export (VEKTOR)
 * - LocalStorage-Verwaltung

 */

// ===== DOM-Elemente =====
const form = document.getElementById('nametagForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const phoneNumberInput = document.getElementById('phoneNumber');
const emailInput = document.getElementById('email');
const previewCanvas = document.getElementById('previewCanvas');
const exportSingleBtn = document.getElementById('exportSinglePdfBtn');
const exportA4Btn = document.getElementById('exportA4PdfBtn');

// ===== Komponenten initialisieren =====
const canvasRenderer = new CanvasRenderer(previewCanvas);
const pdfExporter = new PDFExporter(canvasRenderer); // ✨ Übergebe Renderer

// ===== State Management =====
const state = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: ''
};

/**
 * Input-Validierung
 * @param {HTMLInputElement} input
 */
function validateInput(input) {
    const hasContent = input.value.trim().length > 0;
    input.style.borderColor = hasContent ? '#9d0000' : '#b13333';
}

/**
 * E-Mail-Validierung (erlaubt "/" für Zeilenumbruch)
 * @param {HTMLInputElement} input
 */
function validateEmail(input) {
    // Entferne "/" für Validierung
    const cleanValue = input.value.replace(/\//g, '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parts = input.value.split('/').map(p => p.trim()).filter(p => p.length > 0);
    
    const isEmpty = input.value === '';
    const allValid = parts.every(part => emailRegex.test(part));
    const isValid = isEmpty || allValid;
    
    input.style.borderColor = isValid ? '#9d0000' : '#b13333';
}

/**
 * Speichert State in LocalStorage
 */
function saveToLocalStorage() {
    localStorage.setItem('nametagData', JSON.stringify(state));
}

/**
 * Lädt State aus LocalStorage
 */
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('nametagData');
    if (savedData) {
        const data = JSON.parse(savedData);
        Object.assign(state, data);
        
        firstNameInput.value = state.firstName;
        lastNameInput.value = state.lastName;
        phoneNumberInput.value = state.phoneNumber;
        emailInput.value = state.email;

        validateInput(firstNameInput);
        validateInput(lastNameInput);
        validateEmail(emailInput);
    }
}

/**
 * Aktualisiert die Canvas-Vorschau
 */
function updatePreview() {
    canvasRenderer.render(state);
}

// ===== Event Listeners =====

firstNameInput.addEventListener('input', (e) => {
    validateInput(e.target);
    state.firstName = e.target.value.trim();
    saveToLocalStorage();
    updatePreview();
});

lastNameInput.addEventListener('input', (e) => {
    validateInput(e.target);
    state.lastName = e.target.value.trim();
    saveToLocalStorage();
    updatePreview();
});

phoneNumberInput.addEventListener('input', (e) => {
    state.phoneNumber = e.target.value.trim();
    saveToLocalStorage();
    updatePreview();
});

emailInput.addEventListener('input', (e) => {
    validateEmail(e.target);
    state.email = e.target.value.trim();
    saveToLocalStorage();
    updatePreview();
});

/**
 * Export Einzelnes PDF Button (VEKTOR)

 */
exportSingleBtn.addEventListener('click', () => {
    pdfExporter.exportSingle(state);
});

/**
 * Export A4 PDF Button (VEKTOR)

 */
exportA4Btn.addEventListener('click', () => {
    pdfExporter.exportA4(state);
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
});

// ===== Initialisierung =====
window.addEventListener('load', () => {
    loadFromLocalStorage();
    updatePreview();
    console.log('✓ Anwendung initialisiert (Vektor-Export aktiv)');
});

/**
 * Formular-Submit verhindern

 */
form.addEventListener('submit', (e) => {
    e.preventDefault();
});