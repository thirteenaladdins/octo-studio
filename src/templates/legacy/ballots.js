/**
 * Ballots Template (inspired by Kjetil Golid)
 * Subdivided grid with layered strokes, subtle rotations, and organic flow
 */

module.exports = function ballots(params, artworkId) {
  const { colors = ["#000000"], density = 50 } = params || {};
  const seed = parseInt(artworkId, 10) || 1;
  
  // Ballots typically use 4-8 cells with subdivision
  const gridSize = Math.max(3, Math.min(8, Math.floor(density / 15) + 3));
  const subdivisions = Math.floor(3 + Math.random() * 5); // 3-7 subdivisions per cell
  const maxRotation = 5 + Math.random() * 10; // 5-15 degrees subtle rotation
  const strokeCount = Math.floor(8 + Math.random() * 12); // 8-20 strokes per subdivision
  
  return `
export default function sketch(p) {
  let palette;
  let grid = [];

  p.setup = function() {
    p.createCanvas(1200, 1200);
    p.noLoop();
    p.randomSeed(${seed});
    p.noiseSeed(${seed});

    palette = ${JSON.stringify(colors)};
    
    const cellSize = p.width / ${gridSize};
    const margin = cellSize * 0.1;

    // Generate grid cells
    for (let row = 0; row < ${gridSize}; row++) {
      for (let col = 0; col < ${gridSize}; col++) {
        const x = col * cellSize;
        const y = row * cellSize;
        
        // Create subdivisions within each cell
        const subs = [];
        for (let i = 0; i < ${subdivisions}; i++) {
          const subY = y + margin + (i * (cellSize - 2 * margin) / ${subdivisions});
          const subHeight = (cellSize - 2 * margin) / ${subdivisions};
          
          // Noise-based rotation and offset
          const noiseVal = p.noise(col * 0.5, row * 0.5, i * 0.3);
          const rotation = p.map(noiseVal, 0, 1, -${maxRotation}, ${maxRotation});
          const offsetX = (p.noise(col * 0.3 + 100, row * 0.3 + 100, i * 0.2) - 0.5) * margin * 2;
          
          // Color selection with noise
          const colorNoise = p.noise(col * 0.4, row * 0.4, i * 0.25);
          const colorIdx = p.floor(colorNoise * palette.length) % palette.length;
          
          subs.push({
            x: x + margin + offsetX,
            y: subY,
            width: cellSize - 2 * margin,
            height: subHeight,
            rotation: rotation,
            color: palette[colorIdx],
            strokes: ${strokeCount}
          });
        }
        
        grid.push(subs);
      }
    }
  };

  p.draw = function() {
    p.background(250);
    
    // Draw all subdivisions
    for (let cell of grid) {
      for (let sub of cell) {
        p.push();
        p.translate(sub.x + sub.width / 2, sub.y + sub.height / 2);
        p.rotate(p.radians(sub.rotation));
        
        // Draw layered strokes
        const col = p.color(sub.color);
        p.stroke(p.red(col), p.green(col), p.blue(col), 40);
        p.strokeWeight(0.8);
        p.noFill();
        
        for (let i = 0; i < sub.strokes; i++) {
          const t = i / sub.strokes;
          const offsetY = (t - 0.5) * sub.height * 0.95;
          const waveX = p.sin(t * p.PI) * sub.width * 0.02; // Subtle wave
          
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
  };
}
`;
};

