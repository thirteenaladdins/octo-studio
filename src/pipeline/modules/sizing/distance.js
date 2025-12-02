/**
 * Distance-based Sizing Module
 * Adds size property based on distance from center
 */

const { createRNG } = require('../../state');

/**
 * Apply distance-based sizing to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with size property added to elements
 */
function distance(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  const cellSize = Math.min(width, height) / gridSize;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
  
  const sizedElements = elements.map((element) => {
    const dist = Math.sqrt((element.x - centerX) ** 2 + (element.y - centerY) ** 2);
    const scale = 1 - (dist / maxDist) * 0.5;
    const size = cellSize * 0.6 * scale;
    
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

module.exports = distance;

