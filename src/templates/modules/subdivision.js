/**
 * Subdivision Modules
 * Generate subdivisions within grid cells
 */

/**
 * Uniform subdivisions (original ballots behavior)
 */
export function uniformSubdivisions(p5, col, row, cellSize, margin, subdivisions) {
  const subs = [];
  for (let i = 0; i < subdivisions; i++) {
    const subY = margin + (i * (cellSize - 2 * margin) / subdivisions);
    const subHeight = (cellSize - 2 * margin) / subdivisions;
    
    subs.push({
      index: i,
      y: subY,
      height: subHeight,
    });
  }
  return subs;
}

/**
 * Variable height subdivisions (based on noise)
 */
export function variableSubdivisions(p5, col, row, cellSize, margin, subdivisions) {
  const subs = [];
  let currentY = margin;
  
  for (let i = 0; i < subdivisions; i++) {
    const noiseVal = p5.noise(col * 0.3, row * 0.3, i * 0.2);
    const minHeight = (cellSize - 2 * margin) / (subdivisions * 1.5);
    const maxHeight = (cellSize - 2 * margin) / (subdivisions * 0.7);
    const subHeight = p5.map(noiseVal, 0, 1, minHeight, maxHeight);
    
    subs.push({
      index: i,
      y: currentY,
      height: subHeight,
    });
    
    currentY += subHeight;
    if (currentY + margin > cellSize) break;
  }
  
  return subs;
}

/**
 * Alternating height subdivisions
 */
export function alternatingSubdivisions(p5, col, row, cellSize, margin, subdivisions) {
  const subs = [];
  const totalHeight = cellSize - 2 * margin;
  const smallHeight = totalHeight / (subdivisions * 1.5);
  const largeHeight = totalHeight / (subdivisions * 0.75);
  
  let currentY = margin;
  for (let i = 0; i < subdivisions; i++) {
    const isLarge = i % 2 === 0;
    const subHeight = isLarge ? largeHeight : smallHeight;
    
    subs.push({
      index: i,
      y: currentY,
      height: subHeight,
    });
    
    currentY += subHeight;
  }
  
  return subs;
}

