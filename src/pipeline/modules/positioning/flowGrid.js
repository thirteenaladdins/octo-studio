/**
 * Flow Grid Positioning Module
 * Creates linear grid layout (for flow fields)
 */

const { createRNG } = require('../../state');

/**
 * Generate flow grid of points
 * @param {Object} state - Current state object
 * @returns {Object} New state with elements array populated
 */
function flowGrid(state) {
  const { config, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  const cols = 10;
  
  const rng = createRNG(randomSeed);
  
  const elements = [];
  const cellW = width / cols;
  const total = gridSize * gridSize;
  const rows = Math.ceil(total / cols);
  const cellH = height / rows;
  
  // Generate flow grid points
  for (let i = 0; i < total; i++) {
    const x = (i % cols) * cellW + cellW * 0.1;
    const y = Math.floor(i / cols) * cellH + cellH * 0.5;
    
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

module.exports = flowGrid;

