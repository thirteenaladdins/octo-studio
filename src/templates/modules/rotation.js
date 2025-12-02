/**
 * Rotation Modules
 * Calculate rotation angles for elements
 */

/**
 * Noise-based rotation (original ballots behavior)
 */
export function noiseRotation(p5, col, row, subIndex, maxRotation) {
  const noiseVal = p5.noise(col * 0.5, row * 0.5, subIndex * 0.3);
  return p5.map(noiseVal, 0, 1, -maxRotation, maxRotation);
}

/**
 * Constant rotation (no variation)
 */
export function constantRotation(p5, col, row, subIndex, maxRotation) {
  return maxRotation * 0.5;
}

/**
 * Alternating rotation (checkerboard pattern)
 */
export function alternatingRotation(p5, col, row, subIndex, maxRotation) {
  const isEven = (col + row) % 2 === 0;
  return isEven ? maxRotation : -maxRotation;
}

/**
 * Index-based rotation (based on subdivision index)
 */
export function indexRotation(p5, col, row, subIndex, maxRotation) {
  const ratio = subIndex / 10; // Assuming max ~10 subdivisions
  return p5.map(ratio, 0, 1, -maxRotation, maxRotation);
}

