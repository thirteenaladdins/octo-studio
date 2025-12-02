/**
 * Pipeline Runtime Template
 * Converts pipeline state to p5.js sketch for ScreenshotService
 */

/**
 * Generate p5.js sketch from pipeline state
 * @param {Object} config - Configuration object with state embedded
 * @returns {Object} p5.js sketch object { setup, draw }
 */
export default function generatedSketchFromConfig(config) {
  // Extract state from config (it's embedded during generation)
  const state = config._pipelineState || {
    elements: [],
    width: config.width || 2400,
    height: config.height || 2400,
    randomSeed: config.seed || 12345,
    config: config
  };

  const { elements, width, height, randomSeed, config: cfg } = state;

  return {
    setup: (p5) => {
      p5.randomSeed(randomSeed);
      p5.noiseSeed(randomSeed);
      
      p5.createCanvas(width, height);
      
      // Set color mode to HSB
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      
      // Set background
      if (cfg.background) {
        try {
          const bgColor = p5.color(cfg.background);
          p5.background(p5.hue(bgColor), p5.saturation(bgColor), p5.brightness(bgColor));
        } catch (e) {
          p5.background(0, 0, 100);
        }
      } else {
        p5.background(0, 0, 12);
      }
      
      p5.noStroke();
    },

    draw: (p5) => {
      // Clear background each frame with fade support (like legacy gridPatternRuntime)
      const fade = cfg.fade !== undefined ? cfg.fade : 1.0;
      const fadeAlpha = Math.min(100, Math.max(0, fade * 100));
      
      if (cfg.background) {
        try {
          const bgColor = p5.color(cfg.background);
          p5.background(
            p5.hue(bgColor), 
            p5.saturation(bgColor), 
            p5.brightness(bgColor),
            fadeAlpha
          );
        } catch (e) {
          p5.background(0, 0, 100, fadeAlpha);
        }
      } else {
        p5.background(0, 0, 12, fadeAlpha);
      }

      // Check if runtime noise adjustment is needed (matches legacy gridPatternRuntime)
      const needsRuntimeNoise = state.metadata && state.metadata.runtimeNoiseAdjust;
      const gridSize = needsRuntimeNoise ? (state.metadata.gridSize || cfg.gridSize || 20) : null;
      const speed = cfg.speed || 0.012;
      const frameCount = cfg._captureFrame !== undefined ? cfg._captureFrame : 1;
      const t = frameCount * speed; // Match legacy: t = frameCount * speed

      // Render each element
      elements.forEach((element) => {
        // Validate element has x, y (required)
        if (typeof element.x !== 'number' || typeof element.y !== 'number') {
          return;
        }

        let finalSize = element.size || 10;
        let finalColor = element.color;

        // Recalculate noise values using p5.noise() if runtime adjustment is enabled
        // This matches the exact behavior of gridPatternRuntime.js
        if (needsRuntimeNoise && element._runtimeNoise) {
          const { i, j, recalculateSize, recalculateColor } = element._runtimeNoise;
          
          // Calculate noise value exactly like legacy: p5.noise(i * 0.1, j * 0.1, t * 0.3)
          const noiseVal = p5.noise(i * 0.1, j * 0.1, t * 0.3);
          
          // Recalculate size if needed (matches legacy: cellSize * 0.6 * noiseVal)
          if (recalculateSize) {
            const cellSize = Math.min(width, height) / gridSize;
            finalSize = cellSize * 0.6 * noiseVal;
          }
          
          // Recalculate color if needed (matches legacy exactly)
          if (recalculateColor) {
            // Exact match: const colorIndex = (i + j) % 4;
            const colorIndex = (i + j) % 4;
            // Exact match: const hue = (colorIndex * 60 + t * 30) % 360;
            const hue = (colorIndex * 60 + t * 30) % 360;
            // Exact match: const brightness = 60 + noiseVal * 35;
            const brightness = 60 + noiseVal * 35;
            // Exact match: p5.fill(hue, 75, brightness, 70);
            finalColor = {
              h: hue,
              s: 75,
              b: brightness,
              a: 70
            };
          }
        }

        // Set color with graceful degradation
        if (finalColor) {
          try {
            // If color is HSB object
            if (finalColor.h !== undefined) {
              p5.fill(
                finalColor.h || 0,
                finalColor.s || 0,
                finalColor.b || 0,
                finalColor.a || element.alpha || 100
              );
            } else {
              // Try to parse as hex
              const c = p5.color(finalColor);
              p5.fill(p5.hue(c), p5.saturation(c), p5.brightness(c), element.alpha || 100);
            }
          } catch (e) {
            p5.fill(0, 0, 0, 100); // Default to black
          }
        } else {
          p5.fill(0, 0, 0, 100); // Default color
        }

        // Set size with graceful degradation
        const size = finalSize;

        // Set shape with graceful degradation
        const shape = element.shape || cfg.shape || 'circle';

        // Render based on shape
        p5.noStroke();
        switch (shape.toLowerCase()) {
          case 'circle':
            p5.ellipse(element.x, element.y, size, size);
            break;
          case 'rect':
          case 'rectangle':
          case 'square':
            p5.rectMode(p5.CENTER);
            p5.rect(element.x, element.y, size, size);
            break;
          case 'triangle':
            // Match legacy triangle rendering when using runtimeNoiseAdjust
            if (needsRuntimeNoise && element._runtimeNoise) {
              p5.triangle(
                element.x,
                element.y - size / 2,
                element.x - size / 2,
                element.y + size / 2,
                element.x + size / 2,
                element.y + size / 2
              );
            } else {
              const h = size * 0.866;
              p5.triangle(
                element.x, element.y - h * 0.67,
                element.x - size * 0.5, element.y + h * 0.33,
                element.x + size * 0.5, element.y + h * 0.33
              );
            }
            break;
          case 'line':
            p5.strokeWeight(2);
            p5.stroke(p5.fill());
            p5.line(element.x - size * 0.5, element.y, element.x + size * 0.5, element.y);
            p5.noStroke();
            break;
          case 'cross':
            p5.strokeWeight(2);
            p5.stroke(p5.fill());
            p5.line(element.x - size * 0.5, element.y, element.x + size * 0.5, element.y);
            p5.line(element.x, element.y - size * 0.5, element.x, element.y + size * 0.5);
            p5.noStroke();
            break;
          default:
            p5.ellipse(element.x, element.y, size, size);
        }
      });

      p5.noLoop();
    }
  };
}

