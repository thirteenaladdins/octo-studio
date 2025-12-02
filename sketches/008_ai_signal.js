const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 15);
  },

  draw: (p5) => {
    p5.background(0, 0, 15, 8);
    p5.noFill();
    p5.strokeWeight(2);
    
    const t = p5.frameCount * 0.012;
    const count = 40;
    
    for (let i = 0; i < count; i++) {
      const startX = (i % 10) * (p5.width / 10);
      const startY = Math.floor(i / 10) * (p5.height / 10);
      
      p5.beginShape();
      for (let step = 0; step < 15; step++) {
        const x = startX + step * 8;
        const y = startY + p5.noise(i * 0.1, step * 0.1, t) * 60 - 30;
        
        const hue = (i * 8 + step * 15 + t * 40) % 360;
        const alpha = 35 + step * 3;
        
        p5.stroke(hue, 75, 85, alpha);
        p5.vertex(x, y);
      }
      p5.endShape();
    }
  },
};

export default generatedSketch;