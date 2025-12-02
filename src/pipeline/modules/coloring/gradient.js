/**
 * Gradient Coloring Module
 * Adds color property based on position gradient
 */

const { createRNG } = require('../../state');

/**
 * Convert hex to HSB
 */
function hexToHSB(hex) {
  hex = hex.replace('#', '');
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
  
  return { h, s, b: brightness, a: 70 };
}

/**
 * Apply gradient coloring to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with color property added to elements
 */
function gradient(state) {
  const { config, elements, width, height, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  const palette = config.palette || ['#000000', '#ffffff'];
  
  const rng = createRNG(randomSeed);
  
  // Convert palette to HSB
  const paletteHSB = palette.map(hex => hexToHSB(hex));
  
  const coloredElements = elements.map((element, index) => {
    const i = index % gridSize;
    const j = Math.floor(index / gridSize);
    const maxI = gridSize;
    const maxJ = gridSize;
    
    const ratioX = i / maxI;
    const ratioY = j / maxJ;
    const ratio = (ratioX + ratioY) / 2;
    
    const index1 = Math.floor(ratio * (paletteHSB.length - 1));
    const index2 = Math.min(index1 + 1, paletteHSB.length - 1);
    const blend = (ratio * (paletteHSB.length - 1)) % 1;
    
    // Interpolate between two colors
    const c1 = paletteHSB[index1];
    const c2 = paletteHSB[index2];
    
    const h = c1.h + (c2.h - c1.h) * blend;
    const s = c1.s + (c2.s - c1.s) * blend;
    const b = c1.b + (c2.b - c1.b) * blend;
    
    return {
      ...element,
      color: {
        h: h % 360,
        s: s,
        b: b,
        a: 70
      }
    };
  });
  
  return {
    ...state,
    elements: coloredElements
  };
}

module.exports = gradient;

