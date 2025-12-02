export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 42,
    speed: 0.012,
    density: 80,
    steps: 15,
    noiseScale: 0.01,
    strokeWeight: 2,
    strokeSaturation: 75,
    strokeBrightness: 85,
    strokeAlpha: 35,
    background: "#26262b",
    palette: ["#ff7a7a", "#ffd166", "#70d6ff", "#bdb2ff"],
    ...config,
  };

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      const bg = cfg.background;
      p5.background(bg);
      p5.noFill();
      p5.strokeWeight(cfg.strokeWeight);
    },
    draw: (p5) => {
      // trail fade
      p5.push();
      p5.noStroke();
      p5.fill(0, 0, 0, 8);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      const t = p5.frameCount * cfg.speed;
      const count = Math.max(5, Math.floor(cfg.density));
      const cols = 10;
      const rows = Math.ceil(count / cols);
      const cellW = p5.width / cols;
      const cellH = p5.height / rows;

      for (let i = 0; i < count; i++) {
        const cx = (i % cols) * cellW + cellW * 0.1;
        const cy = Math.floor(i / cols) * cellH + cellH * 0.5;
        p5.beginShape();
        for (let s = 0; s < cfg.steps; s++) {
          const x = cx + s * (cellW / cfg.steps);
          const y =
            cy +
            p5.noise(i * cfg.noiseScale, s * cfg.noiseScale, t) * cellH -
            cellH / 2;
          const hue = (i * 8 + s * 15 + t * 240) % 360;
          const alpha = Math.min(100, cfg.strokeAlpha + s * 2);
          p5.stroke(hue, cfg.strokeSaturation, cfg.strokeBrightness, alpha);
          p5.vertex(x, y);
        }
        p5.endShape();
      }
    },
  };
}
