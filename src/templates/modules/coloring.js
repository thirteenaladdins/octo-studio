/**
 * Coloring Modules
 * Calculate the color of elements
 */

/**
 * Time-based color cycling (HSB)
 * Matches gridPatternRuntime exactly
 */
export function timeBasedColor(p5, i, j, t, n, palette) {
  // Exact match: const colorIndex = (i + j) % 4;
  const colorIndex = (i + j) % 4;
  // Exact match: const hue = (colorIndex * 60 + t * 30) % 360;
  const hue = (colorIndex * 60 + t * 30) % 360;
  // Exact match: const brightness = 60 + noiseVal * 35;
  const brightness = 60 + n * 35;
  return { h: hue, s: 75, b: brightness, a: 70 };
}

/**
 * Palette-based coloring (from config palette)
 */
export function paletteColor(p5, i, j, t, n, palette) {
  if (!palette || palette.length === 0) {
    return { h: 0, s: 100, b: 100, a: 100 }; // Bright red as fallback
  }
  
  const index = Math.floor(n * palette.length) % palette.length;
  const hex = palette[index];
  
  // Convert hex to HSB - temporarily switch to RGB to parse hex, then get HSB
  try {
    // Save current color mode
    const currentMode = p5._colorMode || 'HSB';
    
    // Temporarily switch to RGB to parse hex
    p5.colorMode(p5.RGB, 255, 255, 255, 255);
    const c = p5.color(hex);
    const r = p5.red(c);
    const g = p5.green(c);
    const b = p5.blue(c);
    
    // Switch back to HSB
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    
    // Convert RGB to HSB manually
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
      if (max === r / 255) {
        h = 60 * (((g - b) / 255) / delta);
      } else if (max === g / 255) {
        h = 60 * (2 + ((b - r) / 255) / delta);
      } else {
        h = 60 * (4 + ((r - g) / 255) / delta);
      }
      if (h < 0) h += 360;
    }
    
    const s = max === 0 ? 0 : (delta / max) * 100;
    const brightness = max * 100;
    
    return {
      h: h,
      s: s,
      b: brightness,
      a: 100, // Full opacity
    };
  } catch (e) {
    console.error('Error converting hex to HSB:', hex, e);
    // Return bright red as fallback so we can see if rendering works
    return { h: 0, s: 100, b: 100, a: 100 };
  }
}

/**
 * Gradient coloring (based on position)
 */
export function gradientColor(p5, i, j, maxI, maxJ, palette) {
  const ratioX = i / maxI;
  const ratioY = j / maxJ;
  const ratio = (ratioX + ratioY) / 2;

  const index1 = Math.floor(ratio * (palette.length - 1));
  const index2 = Math.min(index1 + 1, palette.length - 1);
  const blend = (ratio * (palette.length - 1)) % 1;

  try {
    const c1 = p5.color(palette[index1]);
    const c2 = p5.color(palette[index2]);
    const c = p5.lerpColor(c1, c2, blend);
    return {
      h: p5.hue(c),
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 };
  }
}

/**
 * Noise-based color variation
 */
export function noiseColor(p5, i, j, t, noiseScale = 0.1, palette) {
  const n = p5.noise(i * noiseScale, j * noiseScale, t);
  const index = Math.floor(n * palette.length) % palette.length;
  try {
    const c = p5.color(palette[index]);
    return {
      h: (p5.hue(c) + t * 2) % 360,
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 };
  }
}

/**
 * Index-based color (cycled through palette)
 */
export function indexColor(p5, i, j, palette) {
  const index = (i + j) % palette.length;
  try {
    const c = p5.color(palette[index]);
    return {
      h: p5.hue(c),
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 };
  }
}
