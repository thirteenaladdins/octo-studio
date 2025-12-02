/**
 * Transform Modules
 * Apply transformations/jitter/offset to positions
 */

/**
 * No transformation (as-is)
 */
export function noTransform(p5, x, y) {
  return { x, y };
}

/**
 * Random jitter
 */
export function jitterTransform(p5, x, y, jitterAmount = 0.25, cellSize = 100) {
  const jx = (p5.random() - 0.5) * jitterAmount * cellSize * 0.2;
  const jy = (p5.random() - 0.5) * jitterAmount * cellSize * 0.2;
  return { x: x + jx, y: y + jy };
}

/**
 * Noise-based offset
 */
export function noiseOffsetTransform(p5, x, y, i, j, t, noiseScale = 0.1, offsetAmount = 20) {
  const offsetX = (p5.noise(i * noiseScale, j * noiseScale, t) - 0.5) * offsetAmount;
  const offsetY = (p5.noise(i * noiseScale + 100, j * noiseScale + 100, t) - 0.5) * offsetAmount;
  return { x: x + offsetX, y: y + offsetY };
}

/**
 * Circular orbit transform
 */
export function orbitTransform(p5, x, y, centerX, centerY, t, orbitSpeed = 0.01, radius = 10) {
  const angle = t * orbitSpeed;
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;
  return { x: x + offsetX, y: y + offsetY };
}

