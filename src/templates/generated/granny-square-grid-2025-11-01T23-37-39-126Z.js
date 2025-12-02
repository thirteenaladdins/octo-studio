/**
 * Generated Template: granny-square-grid
 * Geometric precision grid with a granny square pattern, creating structured and defined visual elements.
 */

const meta = {
  "id": "granny-square-grid",
  "version": "1.0.0",
  "description": "Geometric precision grid with a granny square pattern, creating structured and defined visual elements.",
  "inputs": [
    {
      "key": "palette",
      "type": "color[]",
      "default": [
        "#ff6b6b",
        "#ffd93d",
        "#6bcb77",
        "#4d96ff",
        "#ffffff"
      ]
    },
    {
      "key": "strokeAlpha",
      "type": "number",
      "effect": "Higher alpha increases visibility of geometric edges",
      "min": 30,
      "max": 60
    },
    {
      "key": "count",
      "type": "int",
      "effect": "More elements create a denser grid pattern",
      "min": 400,
      "max": 800
    },
    {
      "key": "step",
      "type": "number",
      "effect": "Larger steps create more spaced-out patterns",
      "min": 1,
      "max": 2.5
    },
    {
      "key": "noiseScale",
      "type": "number",
      "effect": "Higher values introduce more complexity in the grid structure",
      "min": 0.005,
      "max": 0.02
    }
  ],
  "budget": {
    "maxDrawMs": 500,
    "maxParticles": 2000
  }
};

const tpl = {
  meta,
  render: (p, params, seed) => {
    // Deterministic seeding - CRITICAL for reproducibility
    p.randomSeed(seed);
    p.noiseSeed(seed);
    
    // Setup
    p.colorMode(p.HSB, 360, 100, 100, 100);
    
    // Convert background hex to HSB and set background
    const bgColor = p.color("#2e2e2e");
    p.background(p.hue(bgColor), p.saturation(bgColor), p.brightness(bgColor));
    
    // Get palette from params or use default
    const palette = (params.palette && params.palette.length) ? params.palette : ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#ffffff"];
    
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
    
    // Grain Layer
    p.noStroke();
    const grainCount = Math.floor(p.width * p.height * 0.03);
    
    for (let i = 0; i < grainCount; i++) {
      const x = p.random(p.width);
      const y = p.random(p.height);
      const alpha = p.random(10, 30);
      
      p.fill(0, 0, p.random(20, 80), alpha);
      p.ellipse(x, y, 1.5, 1.5);
    }

    // FlowField Layer
    p.noFill();
    const count = 600;
    const step = 1.5;
    const strokeAlpha = 45;
    const noiseScale = 0.008;
    const zSpeed = 0.001;
    
    for (let i = 0; i < count; i++) {
      const colorIndex = i % palette.length;
      const [h, s, b] = hexToHSB(palette[colorIndex]);
      p.strokeWeight(p.random(1, 4));
      
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
    }
  }
};

module.exports = tpl;