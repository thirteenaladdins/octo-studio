# Modular Template Example

This demonstrates how the modular template system works. You can create new artwork variations by simply changing which modules are used.

## Example Configurations

### Example 1: Standard Grid Pattern (Original)
```json
{
  "seed": 42,
  "gridSize": 20,
  "speed": 0.012,
  "fade": 0.08,
  "jitter": 0.25,
  "shape": "rect",
  "palette": ["#06d6a0", "#ffd166", "#ef476f", "#118ab2"],
  "modules": {
    "positioning": "grid",
    "sizing": "noise",
    "coloring": "time",
    "transform": "jitter"
  }
}
```

### Example 2: Staggered Grid with Gradient Colors
```json
{
  "seed": 43,
  "gridSize": 15,
  "speed": 0.015,
  "fade": 0.05,
  "shape": "circle",
  "palette": ["#ff0000", "#00ff00", "#0000ff"],
  "modules": {
    "positioning": "offsetGrid",
    "sizing": "constant",
    "coloring": "gradient",
    "transform": "none"
  }
}
```

### Example 3: Spiral Layout with Pulsing Sizes
```json
{
  "seed": 44,
  "gridSize": 25,
  "speed": 0.02,
  "fade": 0.1,
  "shape": "triangle",
  "palette": ["#ff6b6b", "#4ecdc4", "#ffe66d"],
  "modules": {
    "positioning": "spiral",
    "sizing": "pulse",
    "coloring": "palette",
    "transform": "noiseOffset"
  }
}
```

### Example 4: Distance-Based with Index Colors
```json
{
  "seed": 45,
  "gridSize": 18,
  "speed": 0.01,
  "fade": 0.08,
  "shape": "cross",
  "palette": ["#ff9ff3", "#54a0ff", "#5f27cd"],
  "modules": {
    "positioning": "grid",
    "sizing": "distance",
    "coloring": "index",
    "transform": "jitter"
  }
}
```

## Module Combinations

Each artwork is built by selecting one module from each category:

**Positioning Options:**
- `grid` - Standard grid
- `offsetGrid` - Staggered/hexagonal grid
- `spiral` - Spiral pattern

**Sizing Options:**
- `noise` - Organic varying sizes (most common)
- `constant` - Uniform sizes
- `distance` - Size based on distance from center
- `pulse` - Animated pulsing sizes

**Coloring Options:**
- `time` - Time-cycling colors (most dynamic)
- `palette` - Colors from palette array
- `gradient` - Gradient across canvas
- `noise` - Noise-based color variation
- `index` - Color based on grid index

**Transform Options:**
- `none` - No transformation
- `jitter` - Random jitter/movement
- `noiseOffset` - Noise-based smooth offset

**Rendering Options:**
- Controlled by `shape` parameter: `circle`, `rect`, `triangle`, `line`, `cross`

## Creating New Artworks

To create a new artwork, simply specify different module combinations in the config:

```javascript
const config = {
  // ... other parameters ...
  modules: {
    positioning: "grid",      // Try: "offsetGrid", "spiral"
    sizing: "noise",          // Try: "constant", "distance", "pulse"
    coloring: "palette",      // Try: "time", "gradient", "noise", "index"
    transform: "jitter",       // Try: "none", "noiseOffset"
  },
  shape: "circle",            // Try: "rect", "triangle", "line", "cross"
};
```

The modular system automatically assembles the artwork from these components!

