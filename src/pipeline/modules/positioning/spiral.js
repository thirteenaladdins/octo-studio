/**
 * Spiral Positioning Module
 * Creates spiral pattern of points
 */

const { createRNG } = require('../../state');

/**
 * Generate spiral pattern of points
 * @param {Object} state - Current state object
 * @returns {Object} New state with elements array populated
 */
function spiral(state) {
  const { config, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  
  const elements = [];
  const total = gridSize * gridSize;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.45;
  const rotations = 3;
  
  // Generate spiral points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const index = i + j * gridSize;
      const angle = (index / total) * Math.PI * 2 * rotations;
      const r = (index / total) * maxRadius;
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      elements.push({ x, y });
    }
  }
  
  return {
    ...state,
    elements: elements,
    metadata: {
      ...state.metadata,
      elementCount: elements.length,
      gridSize: gridSize
    }
  };
}

module.exports = spiral;

