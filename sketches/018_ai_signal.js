const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 12);
  },

  draw: (p5) => {
    p5.background(0, 0, 12, 10);
    p5.noFill();
    p5.strokeWeight(3);
    
    const t = p5.frameCount * 0.015;
    const waveCount = Math.max(2, Math.floor(55 / 3));
    
    for (let w = 0; w < waveCount; w++) {
      const yOffset = (w / waveCount) * p5.height;
      const hue = (w * (360 / waveCount) + t * 25) % 360;
      
      p5.stroke(hue, 70, 85, 60);
      p5.beginShape();
      
      for (let x = 0; x < p5.width; x += 8) {
        const noiseVal = p5.noise(x * 0.01, w * 0.5, t * 0.3);
        const y = yOffset + noiseVal * 80 - 40;
        p5.vertex(x, y);
      }
      p5.endShape();
    }
  },
};

export default generatedSketch;