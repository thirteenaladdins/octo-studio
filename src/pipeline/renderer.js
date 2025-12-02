/**
 * State to p5.js Renderer
 * Converts state.elements array to p5.js sketch object
 * Handles missing properties gracefully with defaults
 */

/**
 * Convert state object to p5.js sketch
 * @param {Object} state - Final state object with elements
 * @returns {Object} p5.js sketch object { setup, draw }
 */
function stateToP5Sketch(state) {
  const { elements, width, height, config } = state;

  return {
    setup: (p5) => {
      p5.randomSeed(state.randomSeed);
      p5.noiseSeed(state.randomSeed);
      
      p5.createCanvas(width, height);
      
      // Set color mode to HSB
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      
      // Set background
      if (config.background) {
        try {
          const bgColor = p5.color(config.background);
          p5.background(p5.hue(bgColor), p5.saturation(bgColor), p5.brightness(bgColor));
        } catch (e) {
          // Fallback: white background in HSB
          p5.background(0, 0, 100);
        }
      } else {
        p5.background(0, 0, 12); // Default dark gray in HSB
      }
      
      p5.noStroke();
    },

    draw: (p5) => {
      // Clear background each frame
      if (config.background) {
        try {
          const bgColor = p5.color(config.background);
          p5.background(p5.hue(bgColor), p5.saturation(bgColor), p5.brightness(bgColor));
        } catch (e) {
          p5.background(0, 0, 100); // White fallback
        }
      } else {
        p5.background(0, 0, 12);
      }

      // Render each element
      elements.forEach((element) => {
        // Validate element has x, y (required)
        if (typeof element.x !== 'number' || typeof element.y !== 'number') {
          return; // Skip invalid elements
        }

        // Set color with graceful degradation
        if (element.color) {
          try {
            // Try to parse as hex
            const c = p5.color(element.color);
            p5.fill(p5.hue(c), p5.saturation(c), p5.brightness(c), element.alpha || 100);
          } catch (e) {
            // If color is already HSB object
            if (element.color.h !== undefined) {
              p5.fill(
                element.color.h || 0,
                element.color.s || 0,
                element.color.b || 0,
                element.color.a || element.alpha || 100
              );
            } else {
              // Default to black
              p5.fill(0, 0, 0, 100);
            }
          }
        } else {
          // Default color if no color property
          p5.fill(0, 0, 0, 100); // Black
        }

        // Set size with graceful degradation
        const size = element.size || 10; // Default size

        // Set shape with graceful degradation
        const shape = element.shape || config.shape || 'circle';

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
            const h = size * 0.866; // Height of equilateral triangle
            p5.triangle(
              element.x, element.y - h * 0.67,
              element.x - size * 0.5, element.y + h * 0.33,
              element.x + size * 0.5, element.y + h * 0.33
            );
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
            // Default to circle
            p5.ellipse(element.x, element.y, size, size);
        }
      });

      // Stop after first frame (static rendering)
      p5.noLoop();
    }
  };
}

module.exports = {
  stateToP5Sketch
};

