/**
 * Orbital Motion Template
 * Creates circular orbiting patterns
 */
module.exports = function orbitalMotion(params) {
  const { colors, density, movement, shapes } = params;
  const primaryShape = shapes[0] || "circle";

  return `const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 10);
  },

  draw: (p5) => {
    p5.background(0, 0, 10, 10);
    p5.noStroke();
    
    const t = p5.frameCount * ((CONFIG && CONFIG.orbitSpeed) || 0.${
      movement.includes("slow") ? "01" : "02"
    });
    const count = (CONFIG && CONFIG.numOrbits) || ${Math.floor(density)};
    
    for (let i = 0; i < count; i++) {
      const angle = t + (i / count) * p5.TWO_PI;
      const orbitRadius = ((CONFIG && CONFIG.radiusMin) || 60) + (i % 3) * (((CONFIG && CONFIG.radiusMax) || 400) / 6);
      const noiseVal = p5.noise(i * 0.08, t * 0.4);
      
      const radius = orbitRadius + 40 * noiseVal;
      const x = p5.width / 2 + radius * Math.cos(angle);
      const y = p5.height / 2 + radius * Math.sin(angle);
      
      const hue = (180 + i * (360 / Math.max(count,1)) + t * 60) % 360;
      const alpha = 40 + 45 * noiseVal;
      
      p5.fill(hue, 70, 90, alpha);
      const shapeSize = 16 + noiseVal * 12;
      ${
        primaryShape === "circle"
          ? `p5.ellipse(x, y, shapeSize, shapeSize);`
          : primaryShape === "rect"
          ? `p5.rectMode(p5.CENTER); p5.rect(x, y, shapeSize, shapeSize);`
          : `p5.ellipse(x, y, shapeSize, shapeSize);`
      }
    }
    
    if (p5.frameCount % 180 === 0) {
      p5.background(0, 0, 10, 20);
    }
  },
};

export default generatedSketch;`;
};
