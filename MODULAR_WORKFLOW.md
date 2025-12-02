# Modular Art System Workflow

This document explains the complete workflow for creating, viewing, and evolving modular generative artworks.

## Overview

The modular system allows you to compose artworks by mixing and matching plug-and-play functions (modules). This creates a powerful workflow where:

1. **Code** = Modules (reusable functions)
2. **Art** = Configurations (JSON that selects modules)
3. **Evolution** = Automated discovery of good configurations

## The Complete Cycle

```
Template Development → Modularization → Module Library
                                              ↓
                                    UniversalModularRuntime
                                              ↓
                    ┌─────────────────────────┴─────────────────────────┐
                    ↓                                                     ↓
            Manual Exploration                                    Automated Evolution
         (Viewer with JSON Editor)                              (Evolution Script)
                    ↓                                                     ↓
            Save Best Configs                                    AI Evaluation
                    ↓                                                     ↓
                    └─────────────────────────┬─────────────────────────┘
                                              ↓
                                    Best Configurations
                                              ↓
                                    New Templates/Modules
```

## Phase 1: Template Development → Modularization

### Step 1: Develop a Template

Start by creating a traditional template (e.g., `gridPattern.js`) that produces consistent, good results. Work on it until you're happy with the output quality and consistency.

**Example:** You might create a grid-based pattern with:
- Grid positioning
- Noise-based sizing
- Time-cycling colors
- Jitter transforms

### Step 2: Modularize

Once your template works well, break it down into modules:

1. **Positioning** → Extract position calculation to `src/templates/modules/positioning.js`
2. **Sizing** → Extract size calculation to `src/templates/modules/sizing.js`
3. **Coloring** → Extract color calculation to `src/templates/modules/coloring.js`
4. **Transform** → Extract transforms to `src/templates/modules/transform.js`
5. **Rendering** → Extract shape rendering to `src/templates/modules/rendering.js`

**Example Module:**
```javascript
// src/templates/modules/coloring.js
export function paletteColor(p5, i, j, t, n, palette) {
  const index = Math.floor(n * palette.length) % palette.length;
  const hex = palette[index];
  const c = p5.color(hex);
  return {
    h: p5.hue(c),
    s: p5.saturation(c),
    b: p5.brightness(c),
    a: 70,
  };
}
```

### Step 3: Register in Runtime

The `UniversalModularRuntime.js` automatically uses modules from `src/templates/modules/`. Just ensure your new modules are exported from the module index files.

## Phase 2: Viewing & Manual Experimentation

### Using the Modular Viewer

1. **Bundle the runtime:**
   ```bash
   node scripts/bundle-modules.js
   ```

2. **Start a local server:**
   ```bash
   npm run view-template
   # Or: python3 -m http.server 8000
   ```

3. **Open `view-modular.html`** in your browser

4. **Edit the JSON configuration** in the left panel:
   ```json
   {
     "seed": 12345,
     "gridSize": 20,
     "palette": ["#06d6a0", "#ffd166", "#ef476f"],
     "modules": {
       "positioning": "grid",
       "sizing": "noise",
       "coloring": "palette",
       "transform": "jitter"
     }
   }
   ```

5. **Click "Apply Config"** to see the artwork update in real-time

6. **Try different combinations:**
   - Change `positioning` to `"spiral"` or `"offsetGrid"`
   - Change `coloring` to `"time"` or `"gradient"`
   - Adjust `gridSize`, `speed`, `palette`, etc.

7. **Save good configs:** Click "Save Config" to download JSON files of configurations you like

### Available Modules

**Positioning:**
- `grid` - Standard grid layout
- `offsetGrid` - Staggered/hexagonal grid
- `spiral` - Spiral pattern
- `flowGrid` - Flow field grid
- `random` - Random positioning

**Sizing:**
- `noise` - Organic varying sizes
- `constant` - Uniform sizes
- `distance` - Size based on distance from center
- `pulse` - Animated pulsing sizes

**Coloring:**
- `time` - Time-cycling colors (HSB)
- `palette` - Colors from palette array
- `gradient` - Gradient across canvas
- `noise` - Noise-based color variation
- `index` - Color based on grid index

**Transform:**
- `none` - No transformation
- `jitter` - Random jitter/movement
- `noiseOffset` - Noise-based smooth offset
- `orbit` - Orbital motion

**Rendering:**
- Controlled by `shape` parameter: `circle`, `rect`, `triangle`, `line`, `cross`

## Phase 3: Automated Evolution

### Using the Evolution Script

The evolution script (`services/evolve.js`) automatically discovers good configurations:

1. **Start with a seed config** (optional - can start random):
   ```json
   {
     "modules": {
       "positioning": "grid",
       "sizing": "noise",
       "coloring": "palette",
       "transform": "jitter"
     },
     "seed": 12345,
     "palette": ["#ff0000", "#00ff00"]
   }
   ```

2. **Run evolution:**
   ```bash
   node services/evolve.js
   ```

3. **The script will:**
   - Mutate module selections and parameters
   - Render each variation
   - Evaluate using AI (OpenAI Vision API)
   - Keep better configurations
   - Save best configs to `evolution_output/`

4. **Review results:**
   - Check `evolution_output/` for saved configurations
   - Load them into the viewer to see the artworks
   - Use them as seeds for further evolution

### How Evolution Works

1. **Mutation:** Randomly changes module selections and parameters
2. **Rendering:** Generates image using `ScreenshotService`
3. **Evaluation:** Uses OpenAI Vision API to score artwork (0-100)
4. **Selection:** Keeps better configs, discards worse ones
5. **Iteration:** Repeats for many generations

## Phase 4: Expansion & Evolution

### Adding New Modules

To add new capabilities:

1. **Create the module function:**
   ```javascript
   // src/templates/modules/coloring.js
   export function newColorFunction(p5, i, j, t, n, palette) {
     // Your implementation
     return { h: 180, s: 50, b: 50, a: 70 };
   }
   ```

2. **Register in runtime:**
   ```javascript
   // src/templates/UniversalModularRuntime.js
   const coloringModules = {
     // ... existing modules
     newColor: newColorFunction
   };
   ```

3. **Update evolution genetics:**
   ```javascript
   // scripts/evolution/genetics.js
   const MODULE_POOLS = {
     // ... existing pools
     coloring: ['time', 'palette', 'gradient', 'noise', 'index', 'newColor']
   };
   ```

4. **Use immediately:**
   - In the viewer: Change `"coloring": "newColor"` in JSON
   - In evolution: It will automatically try the new module

### Creating New Templates from Configs

When you find a great configuration:

1. **Save the config** from the viewer
2. **Create a new template file** that uses that config as default
3. **Or** use it as a seed for further evolution

## Workflow Questions Answered

### "Do I keep working on the template until it produces consistent results? Then modularise it? Then what?"

**Answer:** Yes, exactly:
1. ✅ Develop template until consistent results
2. ✅ Modularize it (extract functions to modules)
3. ✅ Use the viewer to experiment with combinations
4. ✅ Save good configs
5. ✅ Use evolution to discover new combinations
6. ✅ Add new modules to expand capabilities

### "I need a way to easily view the artworks when they're generated"

**Answer:** Use `view-modular.html`:
- Real-time preview as you edit JSON
- Change seeds instantly
- Save configs you like
- Try different module combinations

### "How do I see the different variations and patterns?"

**Answer:** 
- **Manual:** Use the viewer with different configs
- **Automated:** Run evolution script to discover variations
- **Presets:** Use the quick preset buttons in the viewer

### "How do I expand and evolve the templates?"

**Answer:**
- **Expand:** Add new modules (see "Adding New Modules" above)
- **Evolve:** Run evolution script to automatically discover good combinations
- **Refine:** Use saved configs as seeds for further evolution

### "How do I create a feedback system that allows me to guide the system?"

**Answer:** The evolution script provides AI-based feedback:
- Each artwork is evaluated by AI (0-100 score)
- Better artworks become parents for next generation
- You can also manually curate by:
  - Saving good configs from viewer
  - Using them as seeds for evolution
  - Adjusting evolution parameters (mutation rate, etc.)

## Best Practices

1. **Start Simple:** Begin with basic modules, add complexity gradually
2. **Document Modules:** Add comments explaining what each module does
3. **Test Combinations:** Use viewer to test module combinations before evolution
4. **Save Good Configs:** Keep a library of good configurations
5. **Iterate:** Use evolution results as seeds for further exploration
6. **Modularize First:** Don't skip modularization - it enables everything else

## File Structure

```
src/templates/
  ├── modules/              # Reusable module functions
  │   ├── positioning.js
  │   ├── sizing.js
  │   ├── coloring.js
  │   ├── transform.js
  │   └── rendering.js
  ├── UniversalModularRuntime.js  # Main runtime engine
  └── registry.js            # Template registry

scripts/
  └── bundle-modules.js      # Bundle runtime for viewer

dist/
  └── modular-runtime.js     # Bundled runtime (generated)

view-modular.html            # Web viewer for experimentation

services/
  └── evolve.js              # Evolution script
```

## Next Steps

1. **Try the viewer:** Run `node scripts/bundle-modules.js` then open `view-modular.html`
2. **Experiment:** Try different module combinations
3. **Save configs:** Download JSON files of good configurations
4. **Run evolution:** Let the AI discover new combinations
5. **Add modules:** Expand the system with new capabilities

Happy creating! 🎨

