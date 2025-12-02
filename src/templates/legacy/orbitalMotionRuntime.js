export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 7,
    numOrbits: 10,
    orbitSpeed: 0.01,
    trailFade: 0.06,
    radiusMin: 60,
    radiusMax: 400,
    lineWeight: 2,
    background: "#0e0f1a",
    palette: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee"],
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
      p5.fill(0, 0, 0, cfg.trailFade * 100);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      const t = p5.frameCount * cfg.orbitSpeed;
      const n = Math.max(1, Math.floor(cfg.numOrbits));
      for (let i = 0; i < n; i++) {
        const r = p5.map(i, 0, n - 1, cfg.radiusMin, cfg.radiusMax);
        const angle = t + (i * Math.PI * 2) / n;
        const x = p5.width / 2 + Math.cos(angle) * r;
        const y = p5.height / 2 + Math.sin(angle) * r;
        const hue = (i * (360 / n) + t * 60) % 360;
        p5.stroke(hue, 80, 90, 80);
        p5.point(x, y);
      }
    },
  };
}
