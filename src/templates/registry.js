#!/usr/bin/env node

/**
 * Template Registry
 * Declares capabilities and required inputs for each template
 */
module.exports = {
  gridPattern: {
    name: "Grid Pattern",
    inputs: [
      "seed",
      "gridSize",
      "speed",
      "fade",
      "jitter",
      "shape",
      "background",
      "palette",
    ],
    capabilities: {
      colors: true,
      shapes: ["circle", "rect", "triangle"],
      animation: "continuous",
      interaction: false,
    },
    description: "Structured grid-based compositions with animated elements",
  },
  noiseWaves: {
    name: "Noise Waves",
    inputs: [
      "seed",
      "frequency",
      "amplitude",
      "bands",
      "speed",
      "lineWeight",
      "fade",
      "background",
      "palette",
    ],
    capabilities: {
      colors: true,
      shapes: ["line", "curve"],
      animation: "wave",
      interaction: false,
    },
    description: "Wave-like patterns using Perlin noise",
  },
  universalModular: {
    name: "Universal Modular",
    inputs: [
      "seed",
      "gridSize",
      "speed",
      "shape",
      "background",
      "palette",
      "modules",
    ],
    capabilities: {
      colors: true,
      shapes: ["circle", "rect", "triangle", "line", "cross"],
      animation: "continuous",
      interaction: false,
    },
    description: "Modular plug-and-play system for composing artworks from atomic modules",
  },
};
