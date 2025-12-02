/**
 * Offset Grid Positioning Module
 * Creates staggered/hexagonal grid of points
 */

const { createRNG } = require('../../state');

/**
 * Generate offset grid of points
 * @param {Object} state - Current state object
 * @returns {Object} New state with elements array populated
 */
function offsetGrid(state) {
  const { config, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  
  const elements = [];
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // Generate offset grid points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Staggered offset: every other row is offset
      const offset = j % 2 === 0 ? 0 : cellWidth / 2;
      const x = i * cellWidth + cellWidth / 2 + offset;
      const y = j * cellHeight + cellHeight / 2;
      
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

module.exports = offsetGrid;

