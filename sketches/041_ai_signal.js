const CONFIG = {
  "seed": 10,
  "numParticles": 4194,
  "maxSpeed": 5.179,
  "cohesion": 0.287,
  "separation": 1.784,
  "alignment": 1.615,
  "trailFade": 0.543,
  "background": "#0a0a0e",
  "palette": [
    "#ffbe0b",
    "#fb5607",
    "#ff006e",
    "#8338ec"
  ]
};
const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 8);
  },

  draw: (p5) => {
    p5.background(0, 0, 8, 5);
    p5.noStroke();
    
    const t = p5.frameCount * ((CONFIG && CONFIG.maxSpeed) ? (CONFIG.maxSpeed * 0.006) : 0.008);
    const count = (CONFIG && CONFIG.numParticles) || 85;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * p5.TWO_PI;
      const noiseVal = p5.noise(i * 0.1, t * 0.5);
      const radius = 80 + noiseVal * 150;
      
      const x = p5.width / 2 + Math.cos(angle + t) * radius;
      const y = p5.height / 2 + Math.sin(angle + t) * radius;
      
      const colorIndex = Math.floor((i / count) * 4);
      const hue = p5.map(colorIndex, 0, 4, 0, 360);
      const alpha = 30 + noiseVal * 50;
      
      p5.fill(hue, 70, 85, alpha);
      p5.ellipse(x, y, 20 + noiseVal * 15, 20 + noiseVal * 15);
    }
  },
};

export default generatedSketch;