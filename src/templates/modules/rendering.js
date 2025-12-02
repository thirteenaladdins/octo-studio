/**
 * Rendering Modules
 * Draw shapes/elements
 */

/**
 * Render circle
 */
export function renderCircle(p5, x, y, size) {
  p5.ellipse(x, y, size, size);
}

/**
 * Render rectangle
 */
export function renderRect(p5, x, y, size) {
  p5.rectMode(p5.CENTER);
  p5.rect(x, y, size, size);
}

/**
 * Render triangle
 */
export function renderTriangle(p5, x, y, size) {
  p5.triangle(
    x,
    y - size / 2,
    x - size / 2,
    y + size / 2,
    x + size / 2,
    y + size / 2
  );
}

/**
 * Render line
 */
export function renderLine(p5, x, y, size, angle = 0) {
  p5.push();
  p5.translate(x, y);
  p5.rotate(angle);
  p5.line(-size / 2, 0, size / 2, 0);
  p5.pop();
}

/**
 * Render cross
 */
export function renderCross(p5, x, y, size) {
  const halfSize = size / 2;
  p5.line(x - halfSize, y, x + halfSize, y);
  p5.line(x, y - halfSize, x, y + halfSize);
}

/**
 * Render flow curve (multi-segment line)
 */
export function renderFlowCurve(p5, x, y, size, shape, context) {
  const cfg = context.config || {};
  const steps = cfg.steps || 15;
  const noiseScale = cfg.noiseScale || 0.01;
  
  // Use size as the horizontal span
  const stepSize = size / steps;
  
  p5.beginShape();
  p5.noFill(); // Ensure curves aren't filled by default
  
  for (let s = 0; s < steps; s++) {
    const sx = x + s * stepSize;
    
    // Use x/y as noise seeds if 'i' is not available, or combine them
    // To replicate flowField 'i' dependency, we can try to use x/y coordinates
    const nx = x * 0.01;
    const ny = y * 0.01;
    
    const noiseVal = p5.noise(nx, ny + s * noiseScale, context.t);
    
    // Vertical displacement based on noise
    const sy = y + noiseVal * size - size/2;
    p5.vertex(sx, sy);
  }
  p5.endShape();
}

/**
 * Shape switcher (renders based on shape name)
 */
export function renderShape(p5, x, y, size, shape = "circle", context) {
  switch (shape?.toLowerCase()) {
    case "circle":
      renderCircle(p5, x, y, size);
      break;
    case "rect":
    case "rectangle":
    case "square":
      renderRect(p5, x, y, size);
      break;
    case "triangle":
      renderTriangle(p5, x, y, size);
      break;
    case "line":
      renderLine(p5, x, y, size);
      break;
    case "cross":
      renderCross(p5, x, y, size);
      break;
    default:
      renderCircle(p5, x, y, size); // Default to circle
  }
}
