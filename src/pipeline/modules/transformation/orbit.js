/**
 * Orbit Transform Module
 * Adds circular orbit motion to element positions
 */

const { createRNG } = require('../../state');

/**
 * Apply orbit transformation to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with transformed positions
 */
function orbit(state) {
  const { config, elements, width, height, randomSeed } = state;
  const t = config.speed || 0.01;
  const orbitSpeed = 0.01;
  const radius = 10;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const rng = createRNG(randomSeed);
  
  const transformedElements = elements.map((element, index) => {
    // Each element gets a different phase based on its index
    const phase = (index / elements.length) * Math.PI * 2;
    const angle = t * orbitSpeed + phase;
    
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    
    return {
      ...element,
      x: element.x + offsetX,
      y: element.y + offsetY
    };
  });
  
  return {
    ...state,
    elements: transformedElements
  };
}

module.exports = orbit;

