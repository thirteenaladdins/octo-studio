/**
 * Sizing Modules
 * Calculate the size of elements
 */

/**
 * Noise-based sizing (organic, varying sizes)
 * Matches gridPatternRuntime: cellSize * 0.6 * noiseVal
 */
export function noiseSize(p5, i, j, t, cell, noiseScale = 0.1) {
  const n = p5.noise(i * noiseScale, j * noiseScale, t * 0.3);
  return cell * 0.6 * n; // Removed (0.5 + n) to match runtime
}

/**
 * Constant sizing (uniform)
 */
export function constantSize(p5, i, j, t, cell, baseScale = 0.8) {
  return cell * baseScale;
}

/**
 * Distance-based sizing (smaller at edges)
 */
export function distanceSize(p5, i, j, maxI, maxJ, cell, centerScale = 1.0) {
  const centerX = maxI / 2;
  const centerY = maxJ / 2;
  const dist = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2);
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
  const scale = 1 - (dist / maxDist) * 0.5;
  return cell * 0.6 * scale * centerScale;
}

/**
 * Time-based pulsing size
 */
export function pulseSize(p5, i, j, t, cell, pulseSpeed = 1.0) {
  const pulse = (Math.sin(t * pulseSpeed) + 1) / 2; // 0 to 1
  return cell * 0.5 + cell * 0.3 * pulse;
}

/**
 * Random sizing per element
 */
export function randomSize(
  p5,
  i,
  j,
  cell,
  minScale = 0.3,
  maxScale = 1.0,
  seed = null
) {
  if (seed) p5.randomSeed(seed + i * 1000 + j);
  const scale = p5.random(minScale, maxScale);
  return cell * 0.6 * scale;
}
