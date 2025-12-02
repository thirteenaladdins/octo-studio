/**
 * Stroke Rendering Modules
 * Draw strokes/lines in different patterns
 */

/**
 * Straight horizontal strokes (original ballots behavior)
 */
export function renderStraightStrokes(p5, sub, strokeCount, strokeWeight, strokeAlpha, waveAmount) {
  const col = p5.color(sub.color);
  p5.stroke(p5.red(col), p5.green(col), p5.blue(col), strokeAlpha);
  p5.strokeWeight(strokeWeight);
  p5.noFill();
  
  for (let i = 0; i < strokeCount; i++) {
    const t = i / strokeCount;
    const offsetY = (t - 0.5) * sub.height * 0.95;
    const waveX = p5.sin(t * p5.PI) * sub.width * waveAmount;
    
    p5.line(
      -sub.width / 2 + waveX,
      offsetY,
      sub.width / 2 + waveX,
      offsetY
    );
  }
}

/**
 * Vertical strokes
 */
export function renderVerticalStrokes(p5, sub, strokeCount, strokeWeight, strokeAlpha, waveAmount) {
  const col = p5.color(sub.color);
  p5.stroke(p5.red(col), p5.green(col), p5.blue(col), strokeAlpha);
  p5.strokeWeight(strokeWeight);
  p5.noFill();
  
  for (let i = 0; i < strokeCount; i++) {
    const t = i / strokeCount;
    const offsetX = (t - 0.5) * sub.width * 0.95;
    const waveY = p5.sin(t * p5.PI) * sub.height * waveAmount;
    
    p5.line(
      offsetX,
      -sub.height / 2 + waveY,
      offsetX,
      sub.height / 2 + waveY
    );
  }
}

/**
 * Diagonal strokes
 */
export function renderDiagonalStrokes(p5, sub, strokeCount, strokeWeight, strokeAlpha, waveAmount) {
  const col = p5.color(sub.color);
  p5.stroke(p5.red(col), p5.green(col), p5.blue(col), strokeAlpha);
  p5.strokeWeight(strokeWeight);
  p5.noFill();
  
  for (let i = 0; i < strokeCount; i++) {
    const t = i / strokeCount;
    const startX = -sub.width / 2;
    const endX = sub.width / 2;
    const startY = p5.map(t, 0, 1, -sub.height / 2, sub.height / 2);
    const endY = p5.map(t, 0, 1, sub.height / 2, -sub.height / 2);
    
    p5.line(startX, startY, endX, endY);
  }
}

/**
 * Curved strokes
 */
export function renderCurvedStrokes(p5, sub, strokeCount, strokeWeight, strokeAlpha, waveAmount) {
  const col = p5.color(sub.color);
  p5.stroke(p5.red(col), p5.green(col), p5.blue(col), strokeAlpha);
  p5.strokeWeight(strokeWeight);
  p5.noFill();
  
  for (let i = 0; i < strokeCount; i++) {
    const t = i / strokeCount;
    const offsetY = (t - 0.5) * sub.height * 0.95;
    const curveAmount = waveAmount * 2;
    
    p5.beginShape();
    for (let x = -sub.width / 2; x <= sub.width / 2; x += 2) {
      const normalizedX = (x + sub.width / 2) / sub.width;
      const curveY = offsetY + p5.sin(normalizedX * p5.PI) * sub.height * curveAmount;
      p5.vertex(x, curveY);
    }
    p5.endShape();
  }
}

