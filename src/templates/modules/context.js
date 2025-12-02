export function timeBasedContext(p5, config) {
  const t = p5.frameCount * (config.speed || 0.012);
  const gridSize = config.gridSize || Math.floor(Math.sqrt(60));
  const cellSize = Math.min(p5.width, p5.height) / gridSize;
  return { t, gridSize, cellSize, config };
}

export function mouseBasedContext(p5, config) {
  // Map mouseX to time, normalized
  const t = (p5.mouseX / p5.width) * 10;
  const gridSize = config.gridSize || Math.floor(Math.sqrt(60));
  const cellSize = Math.min(p5.width, p5.height) / gridSize;
  return { t, gridSize, cellSize, config };
}
