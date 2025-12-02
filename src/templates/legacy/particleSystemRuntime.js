export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 13,
    numParticles: 800,
    maxSpeed: 2.5,
    cohesion: 0.5,
    separation: 0.6,
    alignment: 0.6,
    trailFade: 0.08,
    background: "#0a0a0e",
    palette: ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec"],
    ...config,
  };

  let particles = [];

  function makeParticle(p5) {
    return {
      x: p5.random(p5.width),
      y: p5.random(p5.height),
      vx: p5.random(-1, 1) * cfg.maxSpeed,
      vy: p5.random(-1, 1) * cfg.maxSpeed,
    };
  }

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.RGB, 255);
      p5.background(cfg.background);
      particles = new Array(Math.max(10, Math.floor(cfg.numParticles)))
        .fill(0)
        .map(() => makeParticle(p5));
    },
    draw: (p5) => {
      p5.push();
      p5.noStroke();
      p5.fill(0, cfg.trailFade * 255);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      // Simple boids-like update (very lightweight)
      const avg = particles.reduce(
        (acc, p) => {
          acc.x += p.x;
          acc.y += p.y;
          return acc;
        },
        { x: 0, y: 0 }
      );
      avg.x /= particles.length;
      avg.y /= particles.length;

      p5.stroke(255, 220);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // cohesion toward center
        p.vx += (avg.x - p.x) * 0.0005 * cfg.cohesion;
        p.vy += (avg.y - p.y) * 0.0005 * cfg.cohesion;

        // mild "separation" by adding noise perturbation
        const n = p5.noise(p.x * 0.002, p.y * 0.002, p5.frameCount * 0.005);
        const a = (n - 0.5) * 2 * cfg.separation;
        p.vx += Math.cos(a) * 0.02;
        p.vy += Math.sin(a) * 0.02;

        // alignment: steer slightly in current heading
        p.vx = p.vx * (0.98 + 0.02 * cfg.alignment);
        p.vy = p.vy * (0.98 + 0.02 * cfg.alignment);

        // clamp speed
        const sp = Math.hypot(p.vx, p.vy);
        const max = Math.max(0.1, cfg.maxSpeed);
        if (sp > max) {
          p.vx = (p.vx / sp) * max;
          p.vy = (p.vy / sp) * max;
        }

        const nx = p.x + p.vx;
        const ny = p.y + p.vy;
        p5.line(p.x, p.y, nx, ny);
        p.x = (nx + p5.width) % p5.width;
        p.y = (ny + p5.height) % p5.height;
      }
    },
  };
}
