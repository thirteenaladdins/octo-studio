# LLM-Driven Template Generation System

A robust system for automatically generating p5.js generative art templates using Large Language Models (LLMs) with automated validation, evaluation, and quality gates.

## Overview

This system implements a DSL-first approach where:
1. **LLM generates declarative JSON** describing the visual pattern
2. **JSON Schema validates** the structure before processing
3. **Transpiler converts** DSL to safe p5.js template code
4. **Puppeteer renders** templates headlessly for evaluation
5. **Sharp extracts features** (contrast, symmetry, palette, etc.)
6. **Quality gates ensure** templates are visually interesting and performant
7. **Auto-repair loop** fixes common issues with specific feedback

## Quick Start

### Prerequisites

```bash
npm install
```

Make sure you have an OpenAI API key in your `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

### Generate a Template

```bash
npm run create-template -- --name "vortex-field" --prompt "Swirling flow with central attractor, teal/amber palette, low symmetry"
```

### Command Line Options

```bash
node tools/create-template.js --name <name> --prompt <description> [options]

Options:
  --name <name>        Template identifier (kebab-case)
  --prompt <desc>      Description of the desired visual pattern
  --avoid <list>       Comma-separated list of recent concepts to avoid
  --help              Show help message
```

## Architecture

### Core Components

1. **Template API** (`template.d.ts`) - Strict TypeScript interface for all templates
2. **DSL Schema** (`dsl/schema.json`) - JSON Schema for declarative template format
3. **DSL Validator** (`dsl/validator.js`) - Ajv-based validation before transpilation
4. **DSL Transpiler** (`dsl/transpile.js`) - Safe code generation (no eval)
5. **Template Evaluator** (`tools/evaluateTemplate.js`) - Puppeteer rendering + sharp analysis
6. **Create Template CLI** (`tools/create-template.js`) - Main orchestration with repair loop

### DSL Format

Templates are described using a declarative JSON format:

```json
{
  "id": "flow-field-ribbons",
  "description": "Flowing ribbons with noise-driven curves",
  "canvas": { "w": 1024, "h": 1024, "bg": "#0a0a0f" },
  "palette": ["#06d6a0", "#ffd166", "#ef476f"],
  "layers": [
    {
      "type": "flowField",
      "count": 450,
      "step": 1.8,
      "strokeAlpha": 55,
      "noise": { "scale": 0.004, "zSpeed": 0.0005 }
    }
  ],
  "claims": {
    "dominant_hues": ["teal", "amber"],
    "symmetry": "low",
    "flow": "high",
    "density": 0.7,
    "motifs": ["ribbons", "waves"]
  },
  "knobs": [
    {
      "key": "noiseScale",
      "effect": "Higher values create tighter curls",
      "range": [0.002, 0.01]
    }
  ]
}
```

### Supported Layer Types

- **flowField**: Noise-driven flowing curves and ribbons
- **orbitals**: Multi-center orbital motion with attractors
- **grain**: Texture overlay for visual interest
- **noiseOverlay**: Subtle noise patterns

### Quality Gates

The system enforces 8 quality gates:

1. **Not Blank**: Non-background pixel ratio > 5%
2. **Has Contrast**: Luminance stddev > 0.12
3. **Not Pure Noise**: Edge density between 0.02-0.40
4. **Render Time OK**: < 500ms at 1024x1024
5. **Has Palette**: At least 3 dominant colors
6. **Reasonable Brightness**: Between 0.1-0.9
7. **Has Symmetry**: Symmetry score > 0.1
8. **Has Harmony**: Color harmony score > 10

### Feature Extraction

The evaluator extracts 8+ features using sharp:

- **Blank Ratio**: Percentage of non-background pixels
- **Contrast**: Luminance standard deviation
- **Edge Density**: Sobel gradient edge detection
- **Dominant Colors**: K-means clustering (k=5)
- **Palette Entropy**: Shannon entropy of color distribution
- **Symmetry**: Horizontal mirror pixel comparison
- **Color Harmony**: CIEDE2000 distances between colors
- **Brightness**: Overall luminance

## Output Structure

Generated templates are saved to `templates/generated/` with:

```
vortex-field-2024-01-15T10-30-45-123Z.js          # Transpiled p5.js template
vortex-field-2024-01-15T10-30-45-123Z.dsl.json     # Original DSL specification
vortex-field-2024-01-15T10-30-45-123Z.meta.json    # Evaluation metadata
vortex-field-2024-01-15T10-30-45-123Z.png          # Reference screenshot
```

## Integration

Generated templates can be integrated into the main system:

1. **Review** the generated template and screenshot
2. **Copy** the `.js` file to `templates/` directory
3. **Register** the template in `services/artGenerator.js`
4. **Add** a corresponding schema to `schemas/` directory

## Security & Safety

- **No eval()**: Transpiler uses pure string templating
- **Sandboxed rendering**: Puppeteer provides isolated execution
- **Input validation**: JSON Schema validates all inputs
- **Deterministic seeding**: All templates use explicit random seeds
- **Budget enforcement**: Particle counts and render times are capped

## Examples

### Flow Field Template
```bash
npm run create-template -- --name "flowing-waves" --prompt "Organic flowing patterns with high contrast, blue/green palette, low symmetry"
```

### Orbital Template
```bash
npm run create-template -- --name "gravitational-dance" --prompt "Multiple orbital centers with gravitational attraction, purple/gold colors"
```

### Mixed Layer Template
```bash
npm run create-template -- --name "textured-flow" --prompt "Flow field with grain texture overlay, warm colors, medium density"
```

## Troubleshooting

### Common Issues

1. **OpenAI API errors**: Check your API key and rate limits
2. **Puppeteer failures**: Ensure Chrome/Chromium is installed
3. **Sharp errors**: Verify image processing dependencies
4. **Validation failures**: Check DSL JSON structure against schema

### Debug Mode

Add `--debug` flag to see detailed logging:
```bash
node tools/create-template.js --name "test" --prompt "simple pattern" --debug
```

## Contributing

The system is designed to be extensible:

- **Add new layer types** in `dsl/transpile.js`
- **Extend feature extraction** in `tools/evaluateTemplate.js`
- **Improve prompts** in `prompts/dsl-template.txt`
- **Add quality gates** in the evaluator

## License

Same as the main octo-studio project.
