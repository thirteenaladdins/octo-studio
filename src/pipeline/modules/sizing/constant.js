/**
 * Constant Sizing Module
 * Adds uniform size property to all elements
 */

const { createRNG } = require('../../state');

/**
 * Apply constant sizing to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with size property added to elements
 */
function constant(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  const cellSize = Math.min(width, height) / gridSize;
  const baseScale = 0.8;
  const size = cellSize * baseScale;
  
  const sizedElements = elements.map((element) => {
    return {
      ...element,
      size: size
    };
  });
  
  return {
    ...state,
    elements: sizedElements
  };
}

module.exports = constant;

