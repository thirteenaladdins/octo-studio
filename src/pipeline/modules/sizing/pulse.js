/**
 * Pulse Sizing Module
 * Adds time-based pulsing size property
 */

const { createRNG } = require('../../state');

/**
 * Apply pulsing sizing to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with size property added to elements
 */
function pulse(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  
  const rng = createRNG(randomSeed);
  const cellSize = Math.min(width, height) / gridSize;
  const t = config.speed || 0.01;
  const pulseSpeed = 1.0;
  const pulse = (Math.sin(t * pulseSpeed) + 1) / 2; // 0 to 1
  const size = cellSize * 0.5 + cellSize * 0.3 * pulse;
  
  const sizedElements = elements.map((element) => {
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

module.exports = pulse;

