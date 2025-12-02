# Exporting Templates to Other Projects

This guide shows you how to import and use Octo Studio templates in different project types.

## Quick Reference

| Project Type | File Format | Import Method |
|-------------|-------------|---------------|
| **Node.js (CommonJS)** | `.js` (original) | `const template = require('./template.js')` |
| **ES Modules** | `.esm.js` | `import template from './template.esm.js'` |
| **Browser (Direct)** | Copy code inline | Use script tag or inline code |
| **TypeScript** | `.d.ts` (type definitions) | Use with either format above |

---

## Option 1: Node.js / CommonJS Projects

The original template file already uses CommonJS format.

### Import:
```javascript
const template = require('./templates/generated/organic-flowing-patterns-2025-11-01T20-30-38-273Z.js');

// Use the template
const p5Instance = getP5Instance(); // Your p5 instance
const params = {}; // Optional parameters
const seed = 12345;

template.render(p5Instance, params, seed);
```

### Example Usage:
```javascript
const p5 = require('p5');
const template = require('./template.js');

new p5((p5) => {
  p5.setup = () => {
    p5.createCanvas(1024, 1024);
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.noLoop();
  };
  
  p5.draw = () => {
    template.render(p5, {}, 12345);
  };
});
```

---

## Option 2: ES Modules / Modern JavaScript

Use the `.esm.js` version for ES module projects.

### Import:
```javascript
import template from './template.esm.js';

// Or import specific exports
import { meta, render } from './template.esm.js';
```

### Example Usage:
```javascript
import p5 from 'p5';
import template from './organic-flowing-patterns-2025-11-01T20-30-38-273Z.esm.js';

new p5((p5) => {
  p5.setup = () => {
    p5.createCanvas(1024, 1024);
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.noLoop();
  };
  
  p5.draw = () => {
    template.render(p5, {}, 12345);
  };
});
```

### With React/Next.js:
```jsx
import { useEffect, useRef } from 'react';
import p5 from 'p5';
import template from './template.esm.js';

function ArtworkCanvas() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const instance = new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(1024, 1024);
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.noLoop();
      };
      
      p5.draw = () => {
        template.render(p5, {}, Math.floor(Math.random() * 1000000));
      };
    }, canvasRef.current);
    
    return () => {
      instance.remove();
    };
  }, []);
  
  return <div ref={canvasRef} />;
}
```

---

## Option 3: Browser / HTML

For direct browser use, you can either:

### A. Load as Script Tag:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
</head>
<body>
  <script>
    const module = { exports: {} };
  </script>
  <script src="templates/generated/organic-flowing-patterns-2025-11-01T20-30-38-273Z.js"></script>
  <script>
    const template = module.exports;
    
    new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(1024, 1024);
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.noLoop();
      };
      
      p5.draw = () => {
        template.render(p5, {}, 12345);
      };
    });
  </script>
</body>
</html>
```

### B. Inline the Code:
Copy the render function directly into your HTML file.

---

## Option 4: TypeScript Projects

Create a type definition file `template.d.ts`:

```typescript
export interface TemplateMeta {
  id: string;
  version: string;
  description: string;
  inputs: Array<{
    key: string;
    type: string;
    default?: any;
    min?: number;
    max?: number;
    effect?: string;
  }>;
  budget: {
    maxDrawMs: number;
    maxParticles: number;
  };
}

export interface Template {
  meta: TemplateMeta;
  render: (p5: any, params?: Record<string, any>, seed?: number) => void;
}

declare const template: Template;
export default template;
```

Then import:
```typescript
import template from './template.esm.js';
```

---

## Template API

All templates follow this structure:

```javascript
{
  meta: {
    id: string,              // Template identifier
    version: string,          // Version number
    description: string,       // Human-readable description
    inputs: [...],            // Configurable parameters
    budget: {                 // Performance constraints
      maxDrawMs: number,
      maxParticles: number
    }
  },
  render: (p5, params, seed) => {
    // Rendering logic
  }
}
```

### Render Function Parameters:

- **`p5`**: p5.js instance (from `new p5(...)`)
- **`params`**: Object with custom parameters (optional)
  - Example: `{ palette: ["#ff0000", "#00ff00"] }`
- **`seed`**: Number for reproducible randomness (optional, default: random)

---

## Custom Parameters

Templates accept parameters based on their `meta.inputs`. For example:

```javascript
const params = {
  palette: ["#ff0000", "#00ff00", "#0000ff"],
  noiseScale: 0.01,
  step: 2.0,
  count: 500,
  strokeAlpha: 50
};

template.render(p5Instance, params, 12345);
```

Use `template.meta.inputs` to see what parameters are available.

---

## Copying Templates to Another Project

1. **Copy the template file(s)** to your project:
   ```bash
   cp templates/generated/organic-flowing-patterns-*.js /path/to/your/project/
   ```

2. **Choose the format** that matches your project:
   - `.js` for CommonJS/Node.js
   - `.esm.js` for ES Modules

3. **Install p5.js** in your project:
   ```bash
   npm install p5
   # or
   yarn add p5
   ```

4. **Import and use** as shown in the examples above.

---

## Need Help?

- Check the template's `meta.inputs` to see available parameters
- Look at the template's `.meta.json` file for detailed metadata
- View the `.png` screenshot to see what it generates
- See `README-TEMPLATE-VIEWER.md` for viewing templates locally
