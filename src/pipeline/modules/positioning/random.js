/**
 * Random Positioning Module
 * Creates randomly positioned points
 */

const { createRNG } = require('../../state');

/**
 * Generate random positioned points
 * @param {Object} state - Current state object
 * @returns {Object} New state with elements array populated
 */
function random(state) {
  const { config, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  const total = gridSize * gridSize;
  
  const rng = createRNG(randomSeed);
  
  const elements = [];
  
  // Generate random points
  for (let i = 0; i < total; i++) {
    const x = rng() * width;
    const y = rng() * height;
    
    elements.push({ x, y });
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

module.exports = random;

