/**
 * Noise Offset Transform Module
 * Adds noise-based offset to element positions
 */

const { createRNG } = require('../../state');

/**
 * Simple noise function
 */
function simpleNoise(x, y, z, rng) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (n - Math.floor(n));
}

/**
 * Apply noise offset transformation to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with transformed positions
 */
function noiseOffset(state) {
  const { config, elements, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  const t = config.speed || 0.01;
  const noiseScale = 0.1;
  const offsetAmount = 20;
  
  const rng = createRNG(randomSeed);
  
  const transformedElements = elements.map((element, index) => {
    const i = index % gridSize;
    const j = Math.floor(index / gridSize);
    
    const offsetX = (simpleNoise(i * noiseScale, j * noiseScale, t, rng) - 0.5) * offsetAmount;
    const offsetY = (simpleNoise(i * noiseScale + 100, j * noiseScale + 100, t, rng) - 0.5) * offsetAmount;
    
    return {
      ...element,
      x: element.x + offsetX,
      y: element.y + offsetY
    };
  });
  
  return {
    ...state,
    elements: transformedElements
  };
}

module.exports = noiseOffset;

