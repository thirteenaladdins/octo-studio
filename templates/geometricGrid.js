/**
 * Geometric Grid Template (inspired by Kjetil Golid's Riak/Reward)
 * Creates a grid of geometric shapes with subtle distortions and color variations
 */

module.exports = function geometricGrid(params, artworkId) {
  const { shapes = ["rect"], colors = ["#000000"], density = 50 } = params || {};
  const seed = parseInt(artworkId, 10) || 1;
  const gridSize = Math.max(3, Math.min(13, Math.floor(density / 10) + 3));
  const distortion = 0.15 + Math.random() * 0.25; // 0.15 - 0.4
  const rotationAmount = Math.random() * 45; // 0 - 45 degrees

  return `
export default function sketch(p) {
  let palette;
  let gridCols, gridRows;
  let cellWidth, cellHeight;
  let shapesData = [];

  p.setup = function() {
    p.createCanvas(1200, 1200);
    p.noLoop();
    p.randomSeed(${seed});
    p.noiseSeed(${seed});

    palette = ${JSON.stringify(colors)};
    gridCols = ${gridSize};
    gridRows = ${gridSize};

    cellWidth = p.width / gridCols;
    cellHeight = p.height / gridRows;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = col * cellWidth + cellWidth / 2;
        const y = row * cellHeight + cellHeight / 2;

        const noiseVal = p.noise(col * 0.3, row * 0.3);
        const dx = (noiseVal - 0.5) * cellWidth * ${distortion};
        const dy = (p.noise(col * 0.3 + 100, row * 0.3 + 100) - 0.5) * cellHeight * ${distortion};

        const rotation = p.map(p.noise(col * 0.5, row * 0.5), 0, 1, -${rotationAmount}, ${rotationAmount});
        const colorIndex = p.floor(p.map(p.noise(col * 0.2, row * 0.2), 0, 1, 0, palette.length));
        const size = p.map(p.noise(col * 0.4 + 200, row * 0.4 + 200), 0, 1, 0.4, 1.0);

        shapesData.push({
          x: x + dx,
          y: y + dy,
          rotation: rotation,
          color: palette[colorIndex % palette.length],
          size: size,
          type: '${shapes[0]}'
        });
      }
    }
    
    // Draw immediately in setup for static render
    p.background(250);
    p.noStroke();

    for (let s of shapesData) {
      p.push();
      p.translate(s.x, s.y);
      p.rotate(p.radians(s.rotation));
      p.fill(s.color);

      const w = cellWidth * 0.7 * s.size;
      const h = cellHeight * 0.7 * s.size;

      if (s.type === 'rect') {
        p.rectMode(p.CENTER);
        p.rect(0, 0, w, h);
      } else if (s.type === 'ellipse' || s.type === 'circle') {
        p.ellipse(0, 0, w, h);
      } else if (s.type === 'triangle') {
        p.triangle(-w/2, h/2, w/2, h/2, 0, -h/2);
      } else {
        p.rectMode(p.CENTER);
        p.rect(0, 0, w, h);
      }

      p.pop();
    }
  };
}
`;
};


