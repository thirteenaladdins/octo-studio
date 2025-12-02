export default function generatedSketchFromConfig(config) {
  let palette;
  let grid = [];

  return {
    setup: (p) => {
      p.randomSeed(config.seed || 1);
      p.noiseSeed(config.seed || 1);

      // Set RGB color mode (ballots uses RGB, not HSB)
      p.colorMode(p.RGB, 255, 255, 255, 255);

      palette = config.palette || ["#1a1a1a", "#4a4a4a", "#7a7a7a"];

      const gridSize = config.gridSize || 5;
      const subdivisions = config.subdivisions || 5;
      const maxRotation = config.rotation || 8;
      const strokeCount = config.strokeCount || 12;
      const cellSize = p.width / gridSize;
      const margin = cellSize * 0.1;

      grid = [];

      // Generate grid cells with subdivisions
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x = col * cellSize;
          const y = row * cellSize;

          const subs = [];
          for (let i = 0; i < subdivisions; i++) {
            const subY =
              y + margin + (i * (cellSize - 2 * margin)) / subdivisions;
            const subHeight = (cellSize - 2 * margin) / subdivisions;

            const noiseVal = p.noise(col * 0.5, row * 0.5, i * 0.3);
            const rotation = p.map(noiseVal, 0, 1, -maxRotation, maxRotation);
            const offsetX =
              (p.noise(col * 0.3 + 100, row * 0.3 + 100, i * 0.2) - 0.5) *
              margin *
              2;

            const colorNoise = p.noise(col * 0.4, row * 0.4, i * 0.25);
            const colorIdx =
              p.floor(colorNoise * palette.length) % palette.length;

            subs.push({
              x: x + margin + offsetX,
              y: subY,
              width: cellSize - 2 * margin,
              height: subHeight,
              rotation: rotation,
              color: palette[colorIdx],
              strokes: strokeCount,
            });
          }

          grid.push(subs);
        }
      }

      p.background(config.background || "#FAFAFA");
      p.noLoop();
    },

    draw: (p) => {
      p.background(config.background || "#FAFAFA");

      for (let cell of grid) {
        for (let sub of cell) {
          p.push();
          p.translate(sub.x + sub.width / 2, sub.y + sub.height / 2);
          p.rotate(p.radians(sub.rotation));

          const col = p.color(sub.color);
          const alpha = config.strokeAlpha ?? 40;
          p.stroke(p.red(col), p.green(col), p.blue(col), alpha);
          p.strokeWeight(config.strokeWeight || 0.8);
          p.noFill();

          for (let i = 0; i < sub.strokes; i++) {
            const t = i / sub.strokes;
            const offsetY = (t - 0.5) * sub.height * 0.95;
            const waveAmount = config.waveAmount ?? 0.02;
            const waveX = p.sin(t * p.PI) * sub.width * waveAmount;

            p.line(
              -sub.width / 2 + waveX,
              offsetY,
              sub.width / 2 + waveX,
              offsetY
            );
          }

          p.pop();
        }
      }
    },
  };
}
