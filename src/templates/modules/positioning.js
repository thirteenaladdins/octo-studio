/**
 * Positioning Modules
 * Calculate the x, y position of elements
 * Signature: (i, j, cellSize, p5, context)
 */

/**
 * Grid-based positioning (standard grid)
 */
export function gridPosition(i, j, cellSize) {
  const x = i * cellSize + cellSize / 2;
  const y = j * cellSize + cellSize / 2;
  return { x, y };
}

/**
 * Offset grid positioning (staggered)
 */
export function offsetGridPosition(i, j, cellSize) {
  const offset = j % 2 === 0 ? 0 : cellSize / 2;
  const x = i * cellSize + cellSize / 2 + offset;
  const y = j * cellSize + cellSize / 2;
  return { x, y };
}

/**
 * Circular/spiral positioning
 * Adapted to work with generic signature
 */
export function spiralPosition(i, j, cellSize, p5, context) {
  // Use 'i' as linear index if coming from densityTraversal, or i/j from grid
  // If grid, we can flatten it: i + j * gridSize
  let index = i;
  let total = context.config.density || 100;
  
  if (context.gridSize && j !== undefined) {
      index = i + j * context.gridSize;
      total = context.gridSize * context.gridSize;
  }
  
  const centerX = p5.width / 2;
  const centerY = p5.height / 2;
  const maxRadius = Math.min(p5.width, p5.height) * 0.45;
  
  // 3 full rotations by default
  const rotations = 3;
  const angle = (index / total) * Math.PI * 2 * rotations;
  const r = (index / total) * maxRadius;
  
  const x = centerX + Math.cos(angle) * r;
  const y = centerY + Math.sin(angle) * r;
  return { x, y };
}

/**
 * Random positioning within bounds
 */
export function randomPosition(i, j, cellSize, p5, context) {
   // Ignores i, j, but we might use them to seed if needed
   // But p5.random() is usually fine if seed was set in setup
   return {
    x: p5.random(p5.width),
    y: p5.random(p5.height),
  };
}

/**
 * Flow field positioning (linear grid)
 */
export function flowGridPosition(i, j, cellSize, p5, context) {
  const cols = 10; 
  // We ignore cellSize passed from context if we want fixed columns, 
  // or we could use it. FlowField uses specific layout.
  
  const cellW = p5.width / cols;
  // Estimate rows based on total count
  const count = context.config.density || 80;
  const rows = Math.ceil(count / cols);
  const cellH = p5.height / rows;
  
  const x = (i % cols) * cellW + cellW * 0.1;
  const y = Math.floor(i / cols) * cellH + cellH * 0.5;
  return { x, y };
}
