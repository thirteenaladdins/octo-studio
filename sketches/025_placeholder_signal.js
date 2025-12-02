const placeholderSketch025 = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(270, 35, 12);
  },

  draw: (p5) => {
    p5.noStroke();
    const t = p5.frameCount * 0.015;
    for (let i = 0; i < 32; i++) {
      const angle = t + (i / 32) * p5.TWO_PI;
      const radius = 120 + 90 * p5.noise(i * 0.08, t * 0.4);
      const x = p5.width / 2 + radius * Math.cos(angle);
      const y = p5.height / 2 + radius * Math.sin(angle);
      const hue = (210 + i * 7 + t * 40) % 360;
      const alpha = 24 + 60 * p5.noise(i * 0.05, t * 0.6);
      p5.fill(hue, 70, 95, alpha);
      p5.ellipse(x, y, 26, 26);
    }

    if (p5.frameCount % 240 === 0) {
      p5.background(270, 35, 12, 12);
    }
  },
};

export default placeholderSketch025;
