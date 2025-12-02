/**
 * Noise-based Coloring Module
 * Adds color property based on noise values
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
 * Simple noise function
 */
function simpleNoise(x, y, z, rng) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (n - Math.floor(n));
}

/**
 * Apply noise-based coloring to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with color property added to elements
 */
function noiseColor(state) {
  const { config, elements, randomSeed } = state;
  const gridSize = config.gridSize || 20;
  const palette = config.palette || ['#000000', '#ffffff'];
  const t = config.speed || 0.01;
  const noiseScale = 0.1;
  
  const rng = createRNG(randomSeed);
  const paletteHSB = palette.map(hex => hexToHSB(hex));
  
  const coloredElements = elements.map((element, index) => {
    const i = index % gridSize;
    const j = Math.floor(index / gridSize);
    
    const n = simpleNoise(i * noiseScale, j * noiseScale, t, rng);
    const colorIndex = Math.floor(n * paletteHSB.length) % paletteHSB.length;
    const baseColor = paletteHSB[colorIndex];
    
    return {
      ...element,
      color: {
        h: (baseColor.h + t * 2) % 360,
        s: baseColor.s,
        b: baseColor.b,
        a: 70
      }
    };
  });
  
  return {
    ...state,
    elements: coloredElements
  };
}

module.exports = noiseColor;

