export default function geometricGridRuntime(config) {
  let palette;
  let gridCols, gridRows;
  let cellWidth, cellHeight;
  let shapes = [];

  return {
    setup: (p) => {
      p.randomSeed(config.seed || 1);
      p.noiseSeed(config.seed || 1);

      palette = config.palette || ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"];
      gridCols = config.gridSize || 8;
      gridRows = config.gridSize || 8;

      cellWidth = p.width / gridCols;
      cellHeight = p.height / gridRows;

      const distortion = config.distortion ?? 0.3;
      const rotationAmount = config.rotation ?? 30;

      shapes = [];
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const x = col * cellWidth + cellWidth / 2;
          const y = row * cellHeight + cellHeight / 2;

          const noiseVal = p.noise(col * 0.3, row * 0.3);
          const dx = (noiseVal - 0.5) * cellWidth * distortion;
          const dy = (p.noise(col * 0.3 + 100, row * 0.3 + 100) - 0.5) * cellHeight * distortion;

          const rotation = p.map(p.noise(col * 0.5, row * 0.5), 0, 1, -rotationAmount, rotationAmount);
          const colorIndex = p.floor(p.map(p.noise(col * 0.2, row * 0.2), 0, 1, 0, palette.length));
          const size = p.map(p.noise(col * 0.4 + 200, row * 0.4 + 200), 0, 1, 0.4, 1.0);

          shapes.push({
            x: x + dx,
            y: y + dy,
            rotation: rotation,
            color: palette[colorIndex % palette.length],
            size: size
          });
        }
      }

      p.background(config.background || "#FAFAFA");
      p.noStroke();
      p.noLoop();
    },

    draw: (p) => {
      p.background(config.background || "#FAFAFA");
      p.noStroke();

      for (let s of shapes) {
        p.push();
        p.translate(s.x, s.y);
        p.rotate(p.radians(s.rotation));
        p.fill(s.color);

        const w = cellWidth * 0.7 * s.size;
        const h = cellHeight * 0.7 * s.size;

        p.rectMode(p.CENTER);
        p.rect(0, 0, w, h);

        p.pop();
      }
    }
  };
}


