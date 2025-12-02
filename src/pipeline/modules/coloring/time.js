/**
 * Time-based Coloring Module
 * Adds color property based on time-cycling HSB values
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
 * Apply time-based coloring to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with color property added to elements
 */
function time(state) {
  const { config, elements, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  // Match legacy: t = frameCount * speed, for static render use frame 1
  // This will be used at frame 1 in the runtime, so t = 1 * speed
  const speed = config.speed || 0.012;
  const frameCount = config._captureFrame !== undefined ? config._captureFrame : 1;
  const t = frameCount * speed;
  
  const rng = createRNG(randomSeed);
  const noiseScale = 0.1;
  
  // Use seed as offset to ensure different outputs for different seeds
  const seedOffset = (randomSeed % 1000) / 100; // Normalize seed to small offset
  
  const coloredElements = elements.map((element, index) => {
    // Calculate grid position from index
    const i = index % gridSize;
    const j = Math.floor(index / gridSize);
    
    // Get noise value - match legacy: noise(i * 0.1, j * 0.1, t * 0.3)
    // Add seed offset to ensure variation
    const n = simpleNoise((i * noiseScale) + seedOffset, (j * noiseScale) + seedOffset * 0.7, (t * 0.3) + seedOffset * 0.3, rng);
    
    // Time-based color cycling - match legacy exactly
    // const colorIndex = (i + j) % 4;
    // const hue = (colorIndex * 60 + t * 30) % 360;
    // const brightness = 60 + noiseVal * 35;
    const colorIndex = (i + j) % 4;
    const hue = (colorIndex * 60 + t * 30) % 360;
    const brightness = 60 + n * 35;
    
    return {
      ...element,
      color: {
        h: hue,
        s: 75,
        b: brightness,
        a: 70
      }
    };
  });
  
  return {
    ...state,
    elements: coloredElements
  };
}

module.exports = time;

