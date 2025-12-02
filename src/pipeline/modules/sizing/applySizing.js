/**
 * Apply Sizing Module
 * Adds size property to elements
 */

const { createRNG } = require('../../state');

/**
 * Apply sizes to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with size property added to elements
 */
function applySizing(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  // Create deterministic RNG
  const rng = createRNG(randomSeed);
  
  const cellSize = Math.min(width, height) / gridSize;
  const baseSize = cellSize * 0.5; // Default size
  
  // Apply size to each element
  const sizedElements = elements.map((element, index) => {
    // Simple size calculation - can be enhanced with noise, distance, etc.
    // For now, use a simple variation based on position
    const sizeVariation = 0.3; // 30% variation
    const size = baseSize * (1 + (rng() - 0.5) * sizeVariation);
    
    return {
      ...element,
      size: Math.max(1, size) // Ensure minimum size
    };
  });
  
  return {
    ...state,
    elements: sizedElements
  };
}

module.exports = applySizing;

