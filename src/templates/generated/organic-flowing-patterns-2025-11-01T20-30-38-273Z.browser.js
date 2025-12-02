/**
 * Generated Template: organic-flowing-patterns
 * Organic flowing patterns with high contrast, utilizing a vibrant blue and green color palette to create depth and movement.
 */

const meta = {
  "id": "organic-flowing-patterns",
  "version": "1.0.0",
  "description": "Organic flowing patterns with high contrast, utilizing a vibrant blue and green color palette to create depth and movement.",
  "inputs": [
    {
      "key": "palette",
      "type": "color[]",
      "default": [
        "#0074D9",
        "#39CCCC",
        "#2ECC40",
        "#FF4136"
      ]
    },
    {
      "key": "noiseScale",
      "type": "number",
      "effect": "Higher values create more intricate, chaotic patterns",
      "min": 0.005,
      "max": 0.02
    },
    {
      "key": "step",
      "type": "number",
      "effect": "Larger steps create broader, more sweeping movements",
      "min": 1,
      "max": 3
    },
    {
      "key": "count",
      "type": "int",
      "effect": "Increasing count leads to denser pattern formations",
      "min": 300,
      "max": 700
    },
    {
      "key": "strokeAlpha",
      "type": "number",
      "effect": "Adjusting alpha influences the visibility of the flowing lines",
      "min": 20,
      "max": 60
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
    const bgColor = p.color("#001f3f");
    p.background(p.hue(bgColor), p.saturation(bgColor), p.brightness(bgColor));
    
    // Get palette from params or use default
    const palette = (params.palette && params.palette.length) ? params.palette : ["#0074D9","#39CCCC","#2ECC40","#FF4136"];
    
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
    
    // FlowField Layer
    p.noFill();
    const count = 600;
    const step = 2.5;
    const strokeAlpha = 45;
    const noiseScale = 0.015;
    const zSpeed = 0.0008;
    
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
  }
};

// Browser version - assigns to window
if (typeof window !== 'undefined') {
  window.OctoTemplate = tpl;
}

// Also support module.exports for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tpl;
}