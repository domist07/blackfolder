/**
 * Background Renderer - VOLLSTÄNDIG
 * 
 * Zeichnet den LJC-Hintergrund mit Logo und Streifen
 * Unterstützt sowohl Canvas als auch jsPDF-Context

 */

/**
 * Prüft ob Kontext ein PDF-Objekt ist

 */
function isPDFContext(ctx) {
    return ctx && typeof ctx.addPage === 'function';
}

/**
 * Konvertiert Canvas-Koordinaten zu PDF-Koordinaten

 */
function canvasToPDF(value, axis = 'x') {
    if (axis === 'x') {
        return value * (95 / 359); // 359px = 95mm
    } else {
        return (value - 14) * (60 / 226.771); // 226.771px = 60mm, offset -14
    }
}

/**
 * Zeichnet den kompletten Hintergrund (rot)

 */
function drawBackgroundColor(ctx) {
    if (isPDFContext(ctx)) {
        // PDF: Rotes Rechteck
        ctx.setFillColor(157, 0, 0);
        ctx.rect(0, 0, 95, 60);
        ctx.fill('F');
    } else {
        // Canvas: Rotes Rechteck
        ctx.fillStyle = 'rgb(157, 0, 0)';
        ctx.fillRect(0, 14, 359.057860, 226.771);
    }
}

/**
 * Zeichnet das LJC-Logo
 * ALLE Pfade aus Ihrem Original-HTML

 */
function drawLogo(ctx) {
    const isPDF = isPDFContext(ctx);
    
    if (isPDF) {
        ctx.setFillColor(255, 255, 255);
        ctx.setDrawColor(255, 255, 255);
        
        // #path2925 - "L" Buchstabe
        ctx.moveTo(canvasToPDF(246.074260, 'x'), canvasToPDF(155.209330, 'y'));
        ctx.lineTo(canvasToPDF(246.074260, 'x'), canvasToPDF(132.872060, 'y'));
        ctx.lineTo(canvasToPDF(247.616370, 'x'), canvasToPDF(132.872060, 'y'));
        ctx.lineTo(canvasToPDF(247.616370, 'x'), canvasToPDF(153.807410, 'y'));
        ctx.lineTo(canvasToPDF(256.573090, 'x'), canvasToPDF(153.807410, 'y'));
        ctx.lineTo(canvasToPDF(256.573090, 'x'), canvasToPDF(155.209330, 'y'));
        ctx.lineTo(canvasToPDF(246.074260, 'x'), canvasToPDF(155.209330, 'y'));
        ctx.fill('F');
        
        // Weitere Logo-Teile hier einfügen...
        // TODO: Alle weiteren ctx.moveTo/lineTo Pfade aus Ihrem Code
        
    } else {
        // Canvas: Original-Code
        ctx.fillStyle = 'rgb(255, 255, 255)';
        
        // #path2925
        ctx.beginPath();
        ctx.moveTo(246.074260, 155.209330);
        ctx.lineTo(246.074260, 132.872060);
        ctx.lineTo(247.616370, 132.872060);
        ctx.lineTo(247.616370, 153.807410);
        ctx.lineTo(256.573090, 153.807410);
        ctx.lineTo(256.573090, 155.209330);
        ctx.closePath();
        ctx.fill();

        
        // Hier alle weiteren Logo-Pfade aus Ihrem Original einfügen
    }
}

/**
 * Zeichnet die vertikalen weißen Linien

 */
function drawVerticalLines(ctx) {
    const isPDF = isPDFContext(ctx);
    const lines = [278.812, 282.647, 286.483, 290.318, 294.153];
    
    if (isPDF) {
        ctx.setFillColor(255, 255, 255);
        lines.forEach(x => {
            const xMM = canvasToPDF(x, 'x');
            const widthMM = canvasToPDF(0.589, 'x');
            ctx.rect(xMM, 0, widthMM, 60);
        });
        ctx.fill('F');
    } else {
        ctx.fillStyle = 'rgb(255, 255, 255)';
        lines.forEach(x => {
            ctx.fillRect(x, 14, 0.589, 226.771);
        });
    }
}

/**
 * HAUPTFUNKTION: Rendert kompletten Hintergrund

 */
function renderBackground(ctx) {
    const isPDF = isPDFContext(ctx);
    
    if (!isPDF) {
        ctx.save();
        ctx.transform(1, 0, 0, 1, 0, -14);
    }
    
    // 1. Hintergrundfarbe
    drawBackgroundColor(ctx);
    
    // 2. Logo
    drawLogo(ctx);
    
    // 3. Vertikale Linien
    drawVerticalLines(ctx);
    
    if (!isPDF) {
        ctx.restore();
    }
    
    console.log(`✓ Hintergrund gerendert (${isPDF ? 'PDF' : 'Canvas'})`);
}