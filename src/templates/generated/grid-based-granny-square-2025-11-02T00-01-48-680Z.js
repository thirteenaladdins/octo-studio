/**
 * Generated Template: grid-based-granny-square
 * Geometric precision in a grid layout mimicking granny square patterns with sharp angles and defined edges.
 */

const meta = {
  "id": "grid-based-granny-square",
  "version": "1.0.0",
  "description": "Geometric precision in a grid layout mimicking granny square patterns with sharp angles and defined edges.",
  "inputs": [
    {
      "key": "palette",
      "type": "color[]",
      "default": [
        "#4a4e69",
        "#9a8c98",
        "#f2e9e4",
        "#22223b"
      ]
    },
    {
      "key": "orbitSpeed",
      "type": "number",
      "effect": "Faster speeds create more dynamic motion within the grid",
      "min": 0.01,
      "max": 0.04
    },
    {
      "key": "count",
      "type": "int",
      "effect": "More particles create denser patterns within the grid",
      "min": 150,
      "max": 350
    },
    {
      "key": "radiusMax",
      "type": "number",
      "effect": "Larger radius allows shapes to spread further across the canvas",
      "min": 200,
      "max": 600
    }
  ],
  "budget": {
    "maxDrawMs": 500,
    "maxParticles": 300
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
    const bgColor = p.color("#1a1a2e");
    p.background(p.hue(bgColor), p.saturation(bgColor), p.brightness(bgColor));
    
    // Get palette from params or use default
    const palette = (params.palette && params.palette.length) ? params.palette : ["#4a4e69","#9a8c98","#f2e9e4","#22223b"];
    
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
    
    // Orbitals Layer
    p.noStroke();
    const count = 300;
    const radiusMin = 80;
    const radiusMax = 400;
    const orbitSpeed = 0.02;
    const shapeSize = 20;
    const attractors = [{"x":0.2,"y":0.2,"strength":1.5},{"x":0.8,"y":0.8,"strength":1.5},{"x":0.5,"y":0.5,"strength":2},{"x":0.25,"y":0.75,"strength":1.2},{"x":0.75,"y":0.25,"strength":1.2}];
    
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
    }
  }
};

module.exports = tpl;