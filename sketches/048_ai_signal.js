const CONFIG = {
  "seed": 4,
  "gridSize": 16,
  "speed": 0.05,
  "fade": 0.17,
  "jitter": 0.559,
  "shape": "circle",
  "background": "#1f1f24",
  "palette": [
    "#06d6a0",
    "#ffd166",
    "#ef476f",
    "#118ab2"
  ],
  "template": "gridPattern"
};
const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 12);
  },

  draw: (p5) => {
    p5.background(0, 0, 12, Math.min(100, Math.max(0, (CONFIG && CONFIG.fade) ? CONFIG.fade * 100 : 8)));
    p5.noStroke();
    
    const t = p5.frameCount * ((CONFIG && CONFIG.speed) || 0.012);
    const gridSize = (CONFIG && CONFIG.gridSize) || Math.floor(Math.sqrt(75));
    const cellSize = Math.min(p5.width, p5.height) / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * cellSize + cellSize / 2;
        const y = j * cellSize + cellSize / 2;
        
        const noiseVal = p5.noise(i * 0.1, j * 0.1, t * 0.3);
        const size = cellSize * 0.6 * noiseVal;
        
        const colorIndex = (i + j) % 4;
        const hue = (colorIndex * 60 + t * 30) % 360;
        const brightness = 60 + noiseVal * 35;
        
        p5.fill(hue, 75, brightness, 70);
        p5.ellipse(x, y, size, size);
      }
    }
  },
};

export default generatedSketch;