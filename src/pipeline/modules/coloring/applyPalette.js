/**
 * Apply Palette Module
 * Adds color property to elements from config palette
 */

const { createRNG } = require('../../state');

/**
 * Convert hex color to HSB object
 * @param {string} hex - Hex color string
 * @returns {Object} {h, s, b, a}
 */
function hexToHSB(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * (2 + (b - r) / delta);
    } else {
      h = 60 * (4 + (r - g) / delta);
    }
    if (h < 0) h += 360;
  }
  
  const s = max === 0 ? 0 : (delta / max) * 100;
  const brightness = max * 100;
  
  return {
    h: h,
    s: s,
    b: brightness,
    a: 100
  };
}

/**
 * Apply palette colors to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with color property added to elements
 */
function applyPalette(state) {
  const { config, elements, randomSeed } = state;
  const palette = config.palette || ['#000000', '#ffffff'];
  
  // Create deterministic RNG
  const rng = createRNG(randomSeed);
  
  // Apply color to each element
  const coloredElements = elements.map((element, index) => {
    // Use index-based selection for deterministic results
    const colorIndex = Math.floor((index + rng() * 0.1) % palette.length);
    const hexColor = palette[colorIndex];
    
    // Convert hex to HSB for p5.js compatibility
    const color = hexToHSB(hexColor);
    
    return {
      ...element,
      color: color // Store as HSB object
    };
  });
  
  return {
    ...state,
    elements: coloredElements
  };
}

module.exports = applyPalette;

