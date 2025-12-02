/**
 * @deprecated This runtime is deprecated. Use gridPatternModularRuntime instead.
 * This file is kept for backward compatibility but will be removed in a future version.
 */
export default function generatedSketchFromConfig(config) {
  // Config is already complete from schema generation - no defaults needed
  return {
    setup: (p5) => {
      // Only set seed if provided (some original sketches don't set it)
      if (config.seed) {
        p5.randomSeed(config.seed);
        p5.noiseSeed(config.seed);
      }
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      // Use HSB background like original sketches: (0, 0, 12) = dark gray
      p5.background(0, 0, 12);
      p5.noStroke();
    },
    draw: (p5) => {
      // Use semi-transparent background fade like original sketches
      // Exact match: Math.min(100, Math.max(0, (CONFIG && CONFIG.fade) ? CONFIG.fade * 100 : 8))
      p5.background(
        0,
        0,
        12,
        Math.min(100, Math.max(0, config.fade ? config.fade * 100 : 8))
      );
      p5.noStroke();

      // Exact match: const t = p5.frameCount * ((CONFIG && CONFIG.speed) || 0.012);
      const t = p5.frameCount * (config.speed || 0.012);
      // Exact match: const gridSize = (CONFIG && CONFIG.gridSize) || Math.floor(Math.sqrt(60));
      const gridSize = config.gridSize || Math.floor(Math.sqrt(60));
      const cellSize = Math.min(p5.width, p5.height) / gridSize;

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          // Exact match: const x = i * cellSize + cellSize / 2;
          const x = i * cellSize + cellSize / 2;
          const y = j * cellSize + cellSize / 2;

          // Exact match: const noiseVal = p5.noise(i * 0.1, j * 0.1, t * 0.3);
          const noiseVal = p5.noise(i * 0.1, j * 0.1, t * 0.3);
          // Exact match: const size = cellSize * 0.6 * noiseVal;
          const size = cellSize * 0.6 * noiseVal;

          // Exact match: const colorIndex = (i + j) % 4;
          const colorIndex = (i + j) % 4;
          // Exact match: const hue = (colorIndex * 60 + t * 30) % 360;
          const hue = (colorIndex * 60 + t * 30) % 360;
          // Exact match: const brightness = 60 + noiseVal * 35;
          const brightness = 60 + noiseVal * 35;

          // Exact match: p5.fill(hue, 75, brightness, 70);
          p5.fill(hue, 75, brightness, 70);

          // Original sketches don't use jitter - draw at exact position
          // Match original behavior: respect shape config
          if (config.shape === "circle") {
            p5.ellipse(x, y, size, size);
          } else if (config.shape === "triangle") {
            p5.triangle(
              x,
              y - size / 2,
              x - size / 2,
              y + size / 2,
              x + size / 2,
              y + size / 2
            );
          } else {
            // Default to rect (rect mode) - matches original sketches
            p5.rectMode(p5.CENTER);
            p5.rect(x, y, size, size);
          }
        }
      }
    },
  };
}
