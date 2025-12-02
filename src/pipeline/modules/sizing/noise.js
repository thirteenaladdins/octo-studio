/**
 * Noise-based Sizing Module
 * Adds size property based on noise values
 */

const { createRNG } = require('../../state');

/**
 * Simple noise function for deterministic noise
 */
function simpleNoise(x, y, z, rng) {
  // Simple hash-based noise
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (n - Math.floor(n));
}

/**
 * Apply noise-based sizing to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with size property added to elements
 */
function noise(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  const cellSize = Math.min(width, height) / gridSize;
  const noiseScale = 0.1;
  // Match legacy: t = frameCount * speed, for static render use frame 1
  const speed = config.speed || 0.012;
  const frameCount = config._captureFrame !== undefined ? config._captureFrame : 1;
  const t = frameCount * speed;
  
  // Use seed as offset to ensure different outputs for different seeds
  const seedOffset = (randomSeed % 1000) / 100; // Normalize seed to small offset
  
  const sizedElements = elements.map((element, index) => {
    // Calculate grid position from index
    const i = index % gridSize;
    const j = Math.floor(index / gridSize);
    
    // Get noise value - match legacy: noise(i * 0.1, j * 0.1, t * 0.3)
    // Add seed offset to ensure variation
    const n = simpleNoise((i * noiseScale) + seedOffset, (j * noiseScale) + seedOffset * 0.7, (t * 0.3) + seedOffset * 0.3, rng);
    
    // Size based on noise - match legacy: cellSize * 0.6 * noiseVal
    const size = cellSize * 0.6 * n;
    
    return {
      ...element,
      size: Math.max(1, size)
    };
  });
  
  return {
    ...state,
    elements: sizedElements
  };
}

module.exports = noise;

