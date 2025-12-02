export function transparentFade(p5, config) {
  // Assumes HSB mode from default setup, or works reasonably in RGB
  p5.background(
    0,
    0,
    12,
    Math.min(100, Math.max(0, config.fade ? config.fade * 100 : 8))
  );
}

export function solidBackground(p5, config) {
  // Use config.background if provided (hex string works in any color mode)
  if (config.background) {
    p5.background(config.background);
  } else {
    // Fallback: try to detect color mode and use appropriate default
    // For RGB mode (ballots), use light gray
    // For HSB mode (gridPattern), use dark gray
    // Since we can't reliably detect mode, default to HSB dark gray for backward compatibility
    // Templates using RGB should always provide config.background
    p5.background(0, 0, 12); // Dark gray in HSB mode
  }
}

export function noBackground(p5, config) {
  // Use config.background if provided, otherwise no background (transparent/black)
  // For ballots (RGB mode), we should still set a background if config.background is provided
  if (config.background && config.background !== "none") {
    p5.background(config.background);
  }
  // Otherwise, don't set background (will be black/transparent)
}

export function trailFade(p5, config) {
  p5.push();
  p5.noStroke();
  // Default to black with low alpha if not specified
  // We can't easily parse hex to RGB/HSB without helper, so we rely on p5's color parsing if available
  // or just use simple HSB/RGB values
  
  // Try to respect the color mode or config
  if (config.background && config.background.startsWith('#')) {
      // If it's a hex, we can try to use it with alpha but p5 doesn't support hex+alpha easily in all versions
      // So we'll just use black with alpha for trails usually
      p5.fill(0, 8); 
  } else {
      // Assume HSB or RGB, use 0,0,0 (black)
      p5.fill(0, 0, 0, 8);
  }
  
  p5.rect(0, 0, p5.width, p5.height);
  p5.pop();
}
