export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 19,
    frequency: 1.2,
    amplitude: 60,
    bands: 6,
    speed: 0.01,
    lineWeight: 2,
    fade: 0.08,
    background: "#0b0b12",
    palette: ["#90e0ef", "#48cae4", "#00b4d8", "#03045e"],
    ...config,
  };

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      p5.background(cfg.background);
      p5.noFill();
      p5.strokeWeight(cfg.lineWeight);
    },
    draw: (p5) => {
      p5.push();
      p5.noStroke();
      p5.fill(0, 0, 0, cfg.fade * 100);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      const t = p5.frameCount * cfg.speed;
      const bands = Math.max(1, Math.floor(cfg.bands));
      for (let b = 0; b < bands; b++) {
        p5.beginShape();
        for (let x = 0; x <= p5.width; x += 6) {
          const n = p5.noise(x * 0.01 * cfg.frequency, b * 0.2, t);
          const y = p5.height * 0.3 + b * 40 + (n - 0.5) * 2 * cfg.amplitude;
          const hue = (b * 40 + t * 120) % 360;
          p5.stroke(hue, 70, 85, 80);
          p5.vertex(x, y);
        }
        p5.endShape();
      }
    },
  };
}
