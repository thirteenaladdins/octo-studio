#!/usr/bin/env node

/**
 * DSL Transpiler
 * Converts DSL JSON to valid p5.js Template code
 * Safe code generation - no eval, deterministic seed injection
 */

class DSLTranspiler {
  constructor() {
    this.layerGenerators = {
      flowField: this.generateFlowFieldLayer.bind(this),
      orbitals: this.generateOrbitalsLayer.bind(this),
      grain: this.generateGrainLayer.bind(this),
      noiseOverlay: this.generateNoiseOverlayLayer.bind(this),
    };
  }

  /**
   * Transpile DSL JSON to p5.js template code
   * @param {Object} dsl - Validated DSL JSON
   * @returns {string} Complete p5.js template code
   */
  transpile(dsl) {
    const meta = this.generateMeta(dsl);
    const renderFunction = this.generateRenderFunction(dsl);

    return `/**
 * Generated Template: ${dsl.id}
 * ${dsl.description}
 */

const meta = ${JSON.stringify(meta, null, 2)};

const tpl = {
  meta,
  render: ${renderFunction}
};

module.exports = tpl;`;
  }

  /**
   * Generate TemplateMeta from DSL
   * @param {Object} dsl - DSL JSON
   * @returns {Object} TemplateMeta object
   */
  generateMeta(dsl) {
    const inputs = [
      {
        key: "palette",
        type: "color[]",
        default: dsl.palette,
      },
    ];

    // Add knobs as inputs
    dsl.knobs.forEach((knob) => {
      const input = {
        key: knob.key,
        type: this.inferInputType(knob.key, dsl),
        effect: knob.effect,
      };

      if (knob.range) {
        input.min = knob.range[0];
        input.max = knob.range[1];
      }

      inputs.push(input);
    });

    return {
      id: dsl.id,
      version: "1.0.0",
      description: dsl.description,
      inputs: inputs,
      budget: {
        maxDrawMs: 500,
        maxParticles: this.calculateMaxParticles(dsl),
      },
    };
  }

  /**
   * Infer input type from knob key and DSL context
   * @param {string} key - Knob key
   * @param {Object} dsl - DSL JSON
   * @returns {string} Input type
   */
  inferInputType(key, dsl) {
    // Common patterns
    if (key.includes("count") || key.includes("steps")) return "int";
    if (
      key.includes("scale") ||
      key.includes("speed") ||
      key.includes("step") ||
      key.includes("amount") ||
      key.includes("opacity")
    )
      return "number";
    if (key.includes("alpha") || key.includes("weight")) return "number";
    return "number"; // default
  }

  /**
   * Calculate maximum particles for budget enforcement
   * @param {Object} dsl - DSL JSON
   * @returns {number} Maximum particle count
   */
  calculateMaxParticles(dsl) {
    let maxParticles = 0;
    dsl.layers.forEach((layer) => {
      if (layer.type === "flowField" && layer.count) {
        maxParticles += layer.count * 200; // rough estimate: count * steps
      } else if (layer.type === "orbitals" && layer.count) {
        maxParticles += layer.count;
      }
    });
    return Math.min(maxParticles, 2000); // cap at 2000
  }

  /**
   * Generate the render function
   * @param {Object} dsl - DSL JSON
   * @returns {string} Render function code
   */
  generateRenderFunction(dsl) {
    const layerCode = dsl.layers
      .map((layer) => {
        const generator = this.layerGenerators[layer.type];
        if (!generator) {
          throw new Error(`Unknown layer type: ${layer.type}`);
        }
        return generator(layer, dsl);
      })
      .join("\n\n    ");

    return `(p, params, seed) => {
    // Deterministic seeding - CRITICAL for reproducibility
    p.randomSeed(seed);
    p.noiseSeed(seed);
    
    // Setup
    p.colorMode(p.HSB, 360, 100, 100, 100);
    
    // Convert background hex to HSB and set background
    const bgColor = p.color("${dsl.canvas.bg}");
    p.background(p.hue(bgColor), p.saturation(bgColor), p.brightness(bgColor));
    
    // Get palette from params or use default
    const palette = (params.palette && params.palette.length) ? params.palette : ${JSON.stringify(
      dsl.palette
    )};
    
    // Helper: Convert hex color to HSB array [h, s, b]
    const hexToHSB = (hex) => {
      try {
        const c = p.color(hex);
        return [p.hue(c), p.saturation(c), p.brightness(c)];
      } catch (e) {
        console.error('Error converting hex to HSB:', hex, e);
        // Fallback to a default color if conversion fails
        return [180, 50, 50]; // Default cyan
      }
    };
    
    ${layerCode}
  }`;
  }

  /**
   * Generate flowField layer code
   * @param {Object} layer - Layer configuration
   * @param {Object} dsl - Full DSL
   * @returns {string} Layer code
   */
  generateFlowFieldLayer(layer, dsl) {
    const count = layer.count || 300;
    const step = layer.step || 1.5;
    const strokeAlpha = layer.strokeAlpha || 35;
    const widthJitter = layer.widthJitter || [1, 4];
    const noiseScale = layer.noise.scale || 0.004;
    const zSpeed = layer.noise.zSpeed || 0.0005;

    return `// FlowField Layer
    p.noFill();
    const count = ${count};
    const step = ${step};
    const strokeAlpha = ${strokeAlpha};
    const noiseScale = ${noiseScale};
    const zSpeed = ${zSpeed};
    
    for (let i = 0; i < count; i++) {
      const colorIndex = i % palette.length;
      const [h, s, b] = hexToHSB(palette[colorIndex]);
      p.strokeWeight(p.random(${widthJitter[0]}, ${widthJitter[1]}));
      
      let x = p.random(p.width);
      let y = p.random(p.height);
      
      p.beginShape();
      for (let t = 0; t < 200; t++) {
        const angle = p.noise(x * noiseScale, y * noiseScale, t * zSpeed) * p.TAU * 2;
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        
        if (x < 0 || y < 0 || x > p.width || y > p.height) break;
        
        p.stroke(h, s, b, strokeAlpha);
        p.vertex(x, y);
      }
      p.endShape();
    }`;
  }

  /**
   * Generate orbitals layer code
   * @param {Object} layer - Layer configuration
   * @param {Object} dsl - Full DSL
   * @returns {string} Layer code
   */
  generateOrbitalsLayer(layer, dsl) {
    const count = layer.count || 100;
    const radiusMin = layer.radiusMin || 60;
    const radiusMax = layer.radiusMax || 300;
    const orbitSpeed = layer.orbitSpeed || 0.01;
    const shapeSize = layer.shapeSize || 16;
    const attractors = layer.attractors || [{ x: 0.5, y: 0.5, strength: 1.0 }];

    return `// Orbitals Layer
    p.noStroke();
    const count = ${count};
    const radiusMin = ${radiusMin};
    const radiusMax = ${radiusMax};
    const orbitSpeed = ${orbitSpeed};
    const shapeSize = ${shapeSize};
    const attractors = ${JSON.stringify(attractors)};
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * p.TAU;
      const radius = p.random(radiusMin, radiusMax);
      
      // Apply attractor influence
      let x = p.width / 2 + radius * Math.cos(angle);
      let y = p.height / 2 + radius * Math.sin(angle);
      
      attractors.forEach(attractor => {
        const ax = attractor.x * p.width;
        const ay = attractor.y * p.height;
        const dx = ax - x;
        const dy = ay - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = attractor.strength / (dist + 1);
        x += dx * influence * 0.1;
        y += dy * influence * 0.1;
      });
      
      const colorIndex = i % palette.length;
      const [h, s, b] = hexToHSB(palette[colorIndex]);
      const alpha = 40 + p.noise(i * 0.1) * 30;
      
      p.fill(h, s, b, alpha);
      p.ellipse(x, y, shapeSize, shapeSize);
    }`;
  }

  /**
   * Generate grain layer code
   * @param {Object} layer - Layer configuration
   * @param {Object} dsl - Full DSL
   * @returns {string} Layer code
   */
  generateGrainLayer(layer, dsl) {
    const amount = layer.amount || 0.02;
    const size = layer.size || 1.0;

    return `// Grain Layer
    p.noStroke();
    const grainCount = Math.floor(p.width * p.height * ${amount});
    
    for (let i = 0; i < grainCount; i++) {
      const x = p.random(p.width);
      const y = p.random(p.height);
      const alpha = p.random(10, 30);
      
      p.fill(0, 0, p.random(20, 80), alpha);
      p.ellipse(x, y, ${size}, ${size});
    }`;
  }

  /**
   * Generate noise overlay layer code
   * @param {Object} layer - Layer configuration
   * @param {Object} dsl - Full DSL
   * @returns {string} Layer code
   */
  generateNoiseOverlayLayer(layer, dsl) {
    const opacity = layer.opacity || 0.1;
    const scale = layer.scale || 0.005;

    return `// Noise Overlay Layer
    p.noStroke();
    const opacity = ${opacity};
    const scale = ${scale};
    
    for (let x = 0; x < p.width; x += 4) {
      for (let y = 0; y < p.height; y += 4) {
        const noiseVal = p.noise(x * scale, y * scale);
        const alpha = noiseVal * opacity * 100;
        
        p.fill(0, 0, noiseVal * 100, alpha);
        p.rect(x, y, 4, 4);
      }
    }`;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node transpile.js <dsl-file.json>");
    process.exit(1);
  }

  const fs = require("fs");
  const filePath = args[0];

  try {
    const dsl = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const transpiler = new DSLTranspiler();
    const code = transpiler.transpile(dsl);
    console.log(code);
  } catch (error) {
    console.error("Error transpiling DSL:", error.message);
    process.exit(1);
  }
}

module.exports = DSLTranspiler;
