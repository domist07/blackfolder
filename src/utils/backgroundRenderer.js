/**
 * Background Renderer
 * 
 * Zeichnet den LJC-Hintergrund mit Logo und dekorativen Streifen
 * auf ein Canvas-2D-Context.
 * 
 * @module backgroundRenderer
 */

import { CANVAS, COLORS } from './constants.js';

/**
 * Zeichnet den roten Hintergrund
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
 */
function drawBackground(ctx) {
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
}

/**
 * Zeichnet das LJC-Logo (weiße Vektor-Pfade)
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
 */
function drawLogo(ctx) {
  ctx.save();
  ctx.transform(1.0, 0.0, 0.0, 1.0, 0.0, -14.0);

  // === "L" des Logos ===
  ctx.beginPath();
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.lineWidth = 0.398769;
  ctx.moveTo(246.074260, 155.209330);
  ctx.lineTo(246.074260, 132.872060);
  ctx.lineTo(247.616370, 132.872060);
  ctx.lineTo(247.616370, 153.807410);
  ctx.lineTo(256.573090, 153.807410);
  ctx.lineTo(256.573090, 155.209330);
  ctx.closePath();
  ctx.fill();

  // === "J" des Logos ===
  ctx.beginPath();
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.moveTo(262.283800, 155.489710);
  ctx.bezierCurveTo(261.074580, 155.489710, 260.126570, 155.167730, 259.439780, 154.523770);
  ctx.bezierCurveTo(258.756260, 153.876540, 258.414500, 152.972510, 258.414500, 151.811670);
  ctx.lineTo(259.956620, 151.811670);
  ctx.bezierCurveTo(259.956620, 152.576130, 260.160340, 153.165430, 260.567800, 153.579560);
  ctx.bezierCurveTo(260.978520, 153.990420, 261.546860, 154.195850, 262.272810, 154.195850);
  ctx.bezierCurveTo(263.016050, 154.195850, 263.590890, 153.984930, 263.997320, 153.563080);
  ctx.bezierCurveTo(264.407010, 153.137960, 264.611860, 152.539680, 264.611860, 151.768400);
  ctx.lineTo(264.611860, 132.872060);
  ctx.lineTo(266.153970, 132.872060);
  ctx.lineTo(266.153970, 151.768400);
  ctx.bezierCurveTo(266.153970, 152.935740, 265.804420, 153.847560, 265.105330, 154.504010);
  ctx.bezierCurveTo(264.409500, 155.161100, 263.461490, 155.489710, 262.283800, 155.489710);
  ctx.closePath();
  ctx.fill();

  // === "C" des Logos ===
  ctx.beginPath();
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.moveTo(276.987630, 155.489710);
  ctx.bezierCurveTo(275.441640, 155.489710, 274.188820, 154.931380, 273.229300, 153.814710);
  ctx.bezierCurveTo(272.273050, 152.694780, 271.794920, 151.259770, 271.794920, 149.509680);
  ctx.lineTo(271.794920, 138.571710);
  ctx.bezierCurveTo(271.794920, 136.821620, 272.273050, 135.388240, 273.229300, 134.271570);
  ctx.bezierCurveTo(274.188820, 133.151640, 275.441640, 132.591680, 276.987630, 132.591680);
  ctx.bezierCurveTo(278.526130, 132.591680, 279.773450, 133.147390, 280.729700, 134.258800);
  ctx.bezierCurveTo(281.689220, 135.366940, 282.168980, 136.797070, 282.168980, 138.549280);
  ctx.lineTo(280.626870, 138.549280);
  ctx.bezierCurveTo(280.626870, 137.174530, 280.281070, 136.065020, 279.589490, 135.220660);
  ctx.bezierCurveTo(278.901180, 134.373040, 278.029120, 133.949310, 276.973520, 133.949310);
  ctx.bezierCurveTo(275.924740, 133.949310, 275.055920, 134.376300, 274.367200, 135.230290);
  ctx.bezierCurveTo(273.681750, 136.081010, 273.339020, 137.191150, 273.339020, 138.560410);
  ctx.lineTo(273.339020, 149.520970);
  ctx.bezierCurveTo(273.339020, 150.890230, 273.681750, 152.000380, 274.367200, 152.851090);
  ctx.bezierCurveTo(275.055920, 153.698710, 275.924740, 154.122440, 276.973520, 154.122440);
  ctx.bezierCurveTo(278.029120, 154.122440, 278.901180, 153.700340, 279.589490, 152.856130);
  ctx.bezierCurveTo(280.281070, 152.008510, 280.626870, 150.899000, 280.626870, 149.527600);
  ctx.lineTo(282.168980, 149.527600);
  ctx.bezierCurveTo(282.168980, 151.283080, 281.689220, 152.716460, 280.729700, 153.827870);
  ctx.bezierCurveTo(279.773450, 154.935640, 278.526130, 155.489710, 276.987630, 155.489710);
  ctx.closePath();
  ctx.fill();

  // === Dekorative vertikale Streifen ===
  ctx.fillStyle = 'rgb(255, 255, 255)';

  // Streifen 1
  ctx.fillRect(294.153, 14.0, 0.589, 226.771);

  // Streifen 2
  ctx.fillRect(299.346, 14.0, 0.589, 226.771);

  // Streifen 3
  ctx.fillRect(304.540, 14.0, 0.589, 226.771);

  // Streifen 4
  ctx.fillRect(309.733, 14.0, 0.589, 226.771);

  // Streifen 5
  ctx.fillRect(314.926, 14.0, 0.589, 226.771);

  ctx.restore();
}

/**
 * Rendert den kompletten Hintergrund (Farbe + Logo + Streifen)
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
 */
export function renderBackground(ctx) {
  drawBackground(ctx);
  drawLogo(ctx);
}

/**
 * Gibt die Streifen-Positionen in mm zurück (für PDF-Export)
 * Konvertiert Canvas-Pixel → physische mm
 * @returns {Array<{x: number, width: number}>} Streifen-Positionen in mm
 */
export function getStripesInMM() {
  const pxToMm = 95 / 359; // Canvas-Breite zu physischer Breite
  
  const stripePixels = [294.153, 299.346, 304.540, 309.733, 314.926];
  const stripeWidth = 0.589 * pxToMm;
  
  return stripePixels.map(px => ({
    x: px * pxToMm,
    width: stripeWidth
  }));
}