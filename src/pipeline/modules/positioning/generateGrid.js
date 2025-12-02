/**
 * Generate Grid Module
 * Creates initial grid of points with {x, y} positions
 * This is typically the first module in the pipeline
 */

const { createRNG } = require('../../state');

/**
 * Generate grid of points
 * @param {Object} state - Current state object
 * @returns {Object} New state with elements array populated
 */
function generateGrid(state) {
  const { config, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  // Create deterministic RNG
  const rng = createRNG(randomSeed);
  
  const elements = [];
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // Generate grid points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Center each point in its cell
      const x = i * cellWidth + cellWidth / 2;
      const y = j * cellHeight + cellHeight / 2;
      
      elements.push({
        x: x,
        y: y
        // Only x, y - other modules will add properties
      });
    }
  }
  
  // Return new state with elements
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

module.exports = generateGrid;

