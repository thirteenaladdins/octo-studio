import {
  gridPosition,
  offsetGridPosition,
  spiralPosition,
  flowGridPosition,
  randomPosition,
  noiseSize,
  constantSize,
  distanceSize,
  pulseSize,
  timeBasedColor,
  paletteColor,
  gradientColor,
  noiseColor,
  indexColor,
  renderCircle,
  renderRect,
  renderTriangle,
  renderShape,
  noTransform,
  jitterTransform,
  noiseOffsetTransform,
  orbitTransform,
  defaultSetup,
  solidBackground
} from './modules/index.js';

/**
 * Universal Modular Runtime
 * 
 * This runtime interprets a JSON configuration to compose an artwork
 * from atomic modules.
 * 
 * @param {Object} config The configuration object
 * @returns {Object} A p5.js sketch object { setup, draw }
 */
export default function generatedSketchFromConfig(config) {
  // Default configuration
  const cfg = {
    seed: 12345,
    width: 1024,
    height: 1024,
    gridSize: 20,
    speed: 0.01,
    shape: 'circle',
    palette: ['#000000', '#ffffff'],
    background: '#ffffff',
    modules: {
      positioning: 'grid',
      sizing: 'constant',
      coloring: 'palette',
      transform: 'none',
      rendering: 'shape'
    },
    ...config
  };

  // Module Maps - mapping string keys to functions
  const positioningModules = {
    grid: gridPosition,
    offsetGrid: offsetGridPosition,
    spiral: spiralPosition,
    flowGrid: flowGridPosition,
    random: randomPosition
  };

  const sizingModules = {
    noise: noiseSize,
    constant: constantSize,
    distance: distanceSize,
    pulse: pulseSize
  };

  const coloringModules = {
    time: timeBasedColor,
    palette: paletteColor,
    gradient: gradientColor,
    noise: noiseColor,
    index: indexColor
  };

  const transformModules = {
    none: noTransform,
    jitter: jitterTransform,
    noiseOffset: noiseOffsetTransform,
    orbit: orbitTransform
  };

  const renderingModules = {
    circle: renderCircle,
    rect: renderRect,
    triangle: renderTriangle,
    shape: renderShape
  };

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      
      p5.createCanvas(cfg.width, cfg.height);
      
      // Set color mode to HSB FIRST (before any color operations)
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      
      // Set background - convert hex to HSB values
      if (cfg.background) {
        try {
          const bgColor = p5.color(cfg.background);
          p5.background(p5.hue(bgColor), p5.saturation(bgColor), p5.brightness(bgColor));
        } catch (e) {
          // Fallback: white background in HSB
          p5.background(0, 0, 100);
        }
      } else {
        p5.background(0, 0, 12); // Default dark gray in HSB
      }
      
      p5.noStroke();
      
      // Don't call noLoop here - let the caller control animation
    },

    draw: (p5) => {
      // Clear background each frame (unless tracing)
      if (!cfg.trace) {
        if (cfg.background) {
          try {
            const bgColor = p5.color(cfg.background);
            p5.background(p5.hue(bgColor), p5.saturation(bgColor), p5.brightness(bgColor));
          } catch (e) {
            p5.background(0, 0, 100); // White fallback
          }
        } else {
          p5.background(0, 0, 12);
        }
      }

      const t = p5.frameCount * cfg.speed;
      const g = Math.floor(cfg.gridSize);
      const cell = p5.width / g;
      
      // Debug: ensure we have valid grid
      if (g <= 0 || cell <= 0) {
        console.warn('Invalid grid size:', g, cell);
        return;
      }

      // Get selected modules
      const getPos = positioningModules[cfg.modules.positioning] || positioningModules.grid;
      const getSize = sizingModules[cfg.modules.sizing] || sizingModules.constant;
      const getColor = coloringModules[cfg.modules.coloring] || coloringModules.palette;
      const getTransform = transformModules[cfg.modules.transform] || transformModules.none;
      // Rendering module is usually handled by renderShape, but could be direct
      const render = renderShape; 

      // Context object for modules that need it
      const context = {
        config: cfg,
        gridSize: g,
        t: t
      };
      
      // Universal Loop - grid-based iteration
      for (let i = 0; i < g; i++) {
        for (let j = 0; j < g; j++) {
          
          // 1. Position
          // Different positioning modules have different signatures
          let pos;
          if (cfg.modules.positioning === 'spiral') {
            const index = i * g + j;
            const total = g * g;
            pos = getPos(i, j, cell, p5, context);
          } else if (cfg.modules.positioning === 'flowGrid' || cfg.modules.positioning === 'random') {
            pos = getPos(i, j, cell, p5, context);
          } else {
            pos = getPos(i, j, cell);
          }

          if (!pos || pos.x === undefined || pos.y === undefined) continue;

          // 2. Size
          let size;
          if (cfg.modules.sizing === 'distance') {
            size = getSize(p5, i, j, g, g, cell);
          } else {
            size = getSize(p5, i, j, t, cell);
          }
          
          // Ensure size is valid
          if (!size || size <= 0 || isNaN(size)) {
            size = cell * 0.5; // Default size
          }

          // 3. Color
          // Normalized noise value often needed for color
          const n = p5.noise(i * 0.1, j * 0.1, t); 
          const color = getColor(p5, i, j, t, n, cfg.palette);
          
          if (color && color.h !== undefined) {
            p5.fill(color.h, color.s, color.b, color.a || 100);
            p5.noStroke(); // or configurable stroke
          } else {
            // Fallback color if color function fails
            p5.fill(180, 50, 50, 100);
            p5.noStroke();
          }

          // 4. Transform
          // Apply additional transforms (jitter, orbit, etc.)
          let finalPos;
          if (cfg.modules.transform === 'orbit') {
            finalPos = getTransform(p5, pos.x, pos.y, p5.width/2, p5.height/2, t, 0.01, 10);
          } else {
            finalPos = getTransform(p5, pos.x, pos.y, i, j, t, 0.25, cell);
          }

          // 5. Render
          // Ensure we have valid position and size before rendering
          if (finalPos && finalPos.x !== undefined && finalPos.y !== undefined && size > 0 && !isNaN(finalPos.x) && !isNaN(finalPos.y) && !isNaN(size)) {
            try {
              // Ensure fill is set before rendering
              if (!p5._renderer._doFill) {
                // Force fill if not set
                p5.fill(180, 50, 50, 100); // Default cyan
              }
              render(p5, finalPos.x, finalPos.y, size, cfg.shape, context);
            } catch (e) {
              // Fallback: draw a simple circle if render fails
              console.error('Render error:', e);
              p5.fill(180, 50, 50, 100); // Force fill
              p5.ellipse(finalPos.x, finalPos.y, size, size);
            }
          }
        }
      }
    }
  };
}

