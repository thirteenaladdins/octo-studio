/**
 * Wave Transform Module
 * Applies wave transformation to element positions
 */

const { createRNG } = require('../../state');

/**
 * Apply wave transformation to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with transformed positions
 */
function wave(state) {
  const { config, elements, randomSeed } = state;
  
  const rng = createRNG(randomSeed);
  const waveAmount = 20;
  const waveFrequency = 0.01;
  const jitter = 5;
  
  const transformedElements = elements.map((element) => {
    const x = element.x;
    const y = element.y;
    
    // Wave transformation
    const newX = x + Math.sin(y * waveFrequency) * waveAmount;
    const newY = y + Math.cos(x * waveFrequency) * waveAmount;
    
    // Add slight jitter
    const jitterX = (rng() - 0.5) * jitter;
    const jitterY = (rng() - 0.5) * jitter;
    
    return {
      ...element,
      x: newX + jitterX,
      y: newY + jitterY
    };
  });
  
  return {
    ...state,
    elements: transformedElements
  };
}

module.exports = wave;

