export function defaultSetup(p5, config) {
  p5.colorMode(p5.HSB, 360, 100, 100, 100);
  // Use HSB background like original sketches: (0, 0, 12) = dark gray
  p5.background(0, 0, 12);
  p5.noStroke();
}

export function invertedSetup(p5, config) {
  p5.colorMode(p5.RGB, 255, 255, 255, 255);
  p5.background(240, 240, 240);
  p5.stroke(0);
  p5.strokeWeight(1);
  p5.noFill();
}

/**
 * RGB setup for templates that use RGB color mode (like ballots)
 */
export function rgbSetup(p5, config) {
  p5.colorMode(p5.RGB, 255, 255, 255, 255);
  p5.noStroke();
}

