/**
 * Generated Template: organic-knitted-granny-square
 * Dynamic granny square patterns inspired by knitted textures, featuring flowing organic shapes and a vibrant blue-green palette.
 */

const meta = {
  "id": "organic-knitted-granny-square",
  "version": "1.0.0",
  "description": "Dynamic granny square patterns inspired by knitted textures, featuring flowing organic shapes and a vibrant blue-green palette.",
  "inputs": [
    {
      "key": "palette",
      "type": "color[]",
      "default": [
        "#1b2631",
        "#4a7c92",
        "#6c9dcf",
        "#d9d9d9",
        "#ff6f61"
      ]
    },
    {
      "key": "noiseScale",
      "type": "number",
      "effect": "Higher values create more intricate flow patterns",
      "min": 0.005,
      "max": 0.02
    },
    {
      "key": "step",
      "type": "number",
      "effect": "Larger steps result in broader strokes and shapes",
      "min": 1.5,
      "max": 3
    },
    {
      "key": "count",
      "type": "int",
      "effect": "Increased count results in denser patterns",
      "min": 300,
      "max": 600
    },
    {
      "key": "strokeAlpha",
      "type": "number",
      "effect": "Increasing alpha enhances visibility and contrast of strokes",
      "min": 30,
      "max": 70
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
    const bgColor = p.color("#0d1b2a");
    p.background(p.hue(bgColor), p.saturation(bgColor), p.brightness(bgColor));
    
    // Get palette from params or use default
    const palette = (params.palette && params.palette.length) ? params.palette : ["#1b2631","#4a7c92","#6c9dcf","#d9d9d9","#ff6f61"];
    
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
    const count = 500;
    const step = 2;
    const strokeAlpha = 50;
    const noiseScale = 0.008;
    const zSpeed = 0.001;
    
    for (let i = 0; i < count; i++) {
      const colorIndex = i % palette.length;
      const [h, s, b] = hexToHSB(palette[colorIndex]);
      p.strokeWeight(p.random(1, 5));
      
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

module.exports = tpl;