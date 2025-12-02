const CONFIG = {
  "template": "flowField",
  "seed": 2,
  "speed": 0.048,
  "density": 179,
  "steps": 12,
  "noiseScale": 0.014,
  "strokeWeight": 4.713,
  "strokeSaturation": 16.404,
  "strokeBrightness": 20.722,
  "strokeAlpha": 26.346,
  "background": "#26262b",
  "palette": [
    "#ff7a7a",
    "#ffd166",
    "#70d6ff",
    "#bdb2ff"
  ]
};
const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    if (typeof CONFIG !== 'undefined' && CONFIG.background) {
      p5.background(0, 0, 15);
    }
  },

  draw: (p5) => {
    p5.background(0, 0, 15, 8);
    p5.noFill();
    p5.strokeWeight((CONFIG && CONFIG.strokeWeight) || 2);
    
    const t = p5.frameCount * ((CONFIG && CONFIG.speed) || 0.012);
    const count = (CONFIG && CONFIG.density) || 52;
    
    for (let i = 0; i < count; i++) {
      const startX = (i % 10) * (p5.width / 10);
      const startY = Math.floor(i / 10) * (p5.height / 10);
      
      p5.beginShape();
      for (let step = 0; step < ((CONFIG && CONFIG.steps) || 15); step++) {
        const x = startX + step * 8;
        const y = startY + p5.noise(i * ((CONFIG && CONFIG.noiseScale) || 0.1), step * ((CONFIG && CONFIG.noiseScale) || 0.1), t) * 60 - 30;
        
        const hue = (i * 8 + step * 15 + t * 240) % 360;
        const alpha = ((CONFIG && CONFIG.strokeAlpha) || 35) + step * 2;
        
        p5.stroke(hue, (CONFIG && CONFIG.strokeSaturation) || 75, (CONFIG && CONFIG.strokeBrightness) || 85, alpha);
        p5.vertex(x, y);
      }
      p5.endShape();
    }
  },
};

export default generatedSketch;