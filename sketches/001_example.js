// Example sketch for demonstration (your existing sketch)
const exampleSketch = {
  setup: (p5) => {
    p5.background(240);
    p5.colorMode(p5.HSB, 360, 100, 100);
  },

  draw: (p5) => {
    p5.background(240, 0.1);

    // Create flowing particles
    for (let i = 0; i < 5; i++) {
      const x = p5.noise(p5.frameCount * 0.01 + i) * p5.width;
      const y = p5.noise(p5.frameCount * 0.01 + i + 100) * p5.height;
      const hue = (p5.frameCount + i * 50) % 360;

      p5.fill(hue, 80, 90);
      p5.noStroke();
      p5.ellipse(x, y, 15, 15);
    }

    // Add mouse interaction
    if (p5.mouseIsPressed) {
      p5.fill(0, 80, 90);
      p5.ellipse(p5.mouseX, p5.mouseY, 30, 30);
    }
  },

  mousePressed: (p5) => {
    p5.background(240);
  },

  keyPressed: (p5) => {
    if (p5.key === "r" || p5.key === "R") {
      p5.background(240);
    }
  },
};

export default exampleSketch;
