export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 42,
    count: 600,
    step: 2.5,
    noiseScale: 0.015,
    zSpeed: 0.0008,
    strokeWeight: 2,
    strokeAlpha: 45,
    background: "#001f3f",
    palette: ["#0074D9", "#39CCCC", "#2ECC40", "#FF4136"],
    ...config,
  };

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      p5.background(cfg.background);
    },
    draw: (p5) => {
      // Trail fade
      p5.push();
      p5.noStroke();
      p5.fill(0, 0, 0, 8);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      p5.noFill();

      const t = p5.frameCount * cfg.zSpeed;

      // Helper: Convert hex color to HSB array [h, s, b]
      const hexToHSB = (hex) => {
        try {
          const c = p5.color(hex);
          return [p5.hue(c), p5.saturation(c), p5.brightness(c)];
        } catch (e) {
          return [180, 50, 50]; // Default cyan
        }
      };

      for (let i = 0; i < cfg.count; i++) {
        const colorIndex = i % cfg.palette.length;
        const [h, s, b] = hexToHSB(cfg.palette[colorIndex]);
        p5.strokeWeight(
          p5.random(cfg.strokeWeight * 0.5, cfg.strokeWeight * 2)
        );

        let x = p5.random(p5.width);
        let y = p5.random(p5.height);

        p5.beginShape();
        for (let stepIndex = 0; stepIndex < 200; stepIndex++) {
          const angle =
            p5.noise(x * cfg.noiseScale, y * cfg.noiseScale, t) * p5.TAU * 2;
          x += Math.cos(angle) * cfg.step;
          y += Math.sin(angle) * cfg.step;

          if (x < 0 || y < 0 || x > p5.width || y > p5.height) break;

          p5.stroke(h, s, b, cfg.strokeAlpha);
          p5.vertex(x, y);
        }
        p5.endShape();
      }

      // Grain Layer
      p5.noStroke();
      const grainCount = Math.floor(p5.width * p5.height * 0.03);

      for (let i = 0; i < grainCount; i++) {
        const x = p5.random(p5.width);
        const y = p5.random(p5.height);
        const alpha = p5.random(10, 30);

        p5.fill(0, 0, p5.random(20, 80), alpha);
        p5.ellipse(x, y, 1.5, 1.5);
      }

      // Border
      p5.stroke(0, 0, 100, 30);
      p5.strokeWeight(Math.min(p5.width, p5.height) * 0.1);
      p5.noFill();
      p5.rect(0, 0, p5.width, p5.height);
    },
  };
}
