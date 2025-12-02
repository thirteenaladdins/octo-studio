/**
 * Jitter Transform Module
 * Adds random jitter to element positions
 */

const { createRNG } = require('../../state');

/**
 * Apply jitter transformation to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with transformed positions
 */
function jitter(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  const cellSize = Math.min(width, height) / gridSize;
  const jitterAmount = config.jitter !== undefined ? config.jitter : 0.25;
  const jitterRange = jitterAmount * cellSize * 0.2;
  
  const transformedElements = elements.map((element) => {
    const jx = (rng() - 0.5) * jitterRange;
    const jy = (rng() - 0.5) * jitterRange;
    
    return {
      ...element,
      x: element.x + jx,
      y: element.y + jy
    };
  });
  
  return {
    ...state,
    elements: transformedElements
  };
}

module.exports = jitter;

