# Modular Template System

This modular system allows you to create new artworks by mixing and matching plug-and-play functions.

## Architecture

Each artwork template is built from 5 types of modules:

1. **Positioning** - Where elements are placed
2. **Sizing** - How big elements are
3. **Coloring** - What color elements are
4. **Rendering** - What shape is drawn
5. **Transform** - Optional offset/jitter/transform applied

## Module Categories

### Positioning Modules
- `gridPosition(i, j, cell)` - Standard grid layout
- `offsetGridPosition(i, j, cell)` - Staggered/offset grid
- `spiralPosition(i, total, centerX, centerY, radius)` - Spiral layout
- `flowFieldPosition(p5, i, cols, rows, cellW, cellH, t)` - Flow field positions

### Sizing Modules
- `noiseSize(p5, i, j, t, cell)` - Organic varying sizes based on noise
- `constantSize(p5, i, j, t, cell)` - Uniform size
- `distanceSize(p5, i, j, maxI, maxJ, cell)` - Size based on distance from center
- `pulseSize(p5, i, j, t, cell)` - Pulsing/animated size

### Coloring Modules
- `timeBasedColor(p5, i, j, t, n, palette)` - Time-cycling colors (HSB)
- `paletteColor(p5, i, j, t, n, palette)` - Colors from palette array
- `gradientColor(p5, i, j, maxI, maxJ, palette)` - Gradient across canvas
- `noiseColor(p5, i, j, t, noiseScale, palette)` - Noise-based color variation
- `indexColor(p5, i, j, palette)` - Color based on grid index

### Rendering Modules
- `renderCircle(p5, x, y, size)` - Draw circle
- `renderRect(p5, x, y, size)` - Draw rectangle
- `renderTriangle(p5, x, y, size)` - Draw triangle
- `renderShape(p5, x, y, size, shape)` - Shape switcher (circle/rect/triangle/etc.)

### Transform Modules
- `noTransform(p5, x, y)` - No transformation
- `jitterTransform(p5, x, y, jitterAmount, cellSize)` - Random jitter
- `noiseOffsetTransform(p5, x, y, i, j, t, noiseScale, offsetAmount)` - Noise-based offset
- `orbitTransform(p5, x, y, centerX, centerY, t, orbitSpeed, radius)` - Orbital motion

## Usage Example

```javascript
import {
  gridPosition,
  noiseSize,
  paletteColor,
  renderShape,
  jitterTransform,
} from './modules';

export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 42,
    gridSize: 20,
    shape: 'circle',
    palette: ['#ff0000', '#00ff00', '#0000ff'],
    modules: {
      positioning: 'grid',
      sizing: 'noise',
      coloring: 'palette',
      transform: 'jitter',
    },
    ...config,
  };

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
    },
    draw: (p5) => {
      const t = p5.frameCount * cfg.speed;
      const g = Math.floor(cfg.gridSize);
      const cell = p5.width / g;

      for (let i = 0; i < g; i++) {
        for (let j = 0; j < g; j++) {
          // 1. Position
          const pos = gridPosition(i, j, cell);

          // 2. Size
          const size = noiseSize(p5, i, j, t, cell);

          // 3. Color
          const n = p5.noise(i * 0.1, j * 0.1, t);
          const color = paletteColor(p5, i, j, t, n, cfg.palette);
          p5.fill(color.h, color.s, color.b, color.a);

          // 4. Transform
          const finalPos = jitterTransform(p5, pos.x, pos.y, 0.25, cell);

          // 5. Render
          renderShape(p5, finalPos.x, finalPos.y, size, cfg.shape);
        }
      }
    },
  };
}
```

## Creating New Modules

To add a new module, simply create a function that matches the signature:

```javascript
// New sizing module: size based on mouse distance
export function mouseDistanceSize(p5, i, j, mouseX, mouseY, baseSize) {
  const dist = Math.sqrt((i - mouseX) ** 2 + (j - mouseY) ** 2);
  return baseSize * (1 + dist / 100);
}
```

Then add it to the module map in your template and it's ready to use!

## Config Structure

Your artwork config can specify which modules to use:

```json
{
  "seed": 42,
  "gridSize": 20,
  "shape": "circle",
  "palette": ["#ff0000", "#00ff00"],
  "modules": {
    "positioning": "grid",
    "sizing": "noise",
    "coloring": "palette",
    "transform": "jitter"
  }
}
```

This makes it easy for the AI to generate new artwork combinations by just changing the module names!

