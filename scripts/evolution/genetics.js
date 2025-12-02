/**
 * Genetics Module
 * Handles the creation and mutation of artwork configurations (genomes).
 * Mirroring module definitions from src/templates/UniversalModularRuntime.js
 */

// Module pools define the available genes for each category
// These must match the export maps in UniversalModularRuntime.js
const MODULE_POOLS = {
  setup: ['default', 'inverted'],
  background: ['transparent', 'solid', 'none', 'trailFade'],
  context: ['time', 'mouse'],
  traversal: ['grid', 'random', 'column', 'density'],
  positioning: ['grid', 'offsetGrid', 'spiral', 'flowGrid', 'random'],
  sizing: ['noise', 'constant', 'distance', 'pulse'],
  coloring: ['time', 'palette', 'gradient', 'noise', 'index'],
  rendering: ['shape', 'flowCurve', 'circle', 'rect', 'triangle', 'line', 'cross'],
  transform: ['none', 'jitter', 'noiseOffset']
};

/**
 * Create a completely random genome
 * @returns {Object} A random modules configuration
 */
function createRandomGenome() {
  const genome = {};
  for (const [category, pool] of Object.entries(MODULE_POOLS)) {
    genome[category] = pool[Math.floor(Math.random() * pool.length)];
  }
  return genome;
}

/**
 * Mutate an existing genome
 * @param {Object} parentGenome - The genome to mutate
 * @param {number} mutationRate - Probability of mutation per gene (0.0 to 1.0)
 * @returns {Object} A new, mutated genome
 */
function mutateGenome(parentGenome, mutationRate = 0.2) {
  const child = { ...parentGenome };
  let mutated = false;
  
  // Try to mutate at least one gene if mutationRate > 0
  while (!mutated) {
    for (const [category, pool] of Object.entries(MODULE_POOLS)) {
      if (Math.random() < mutationRate) {
        const currentGene = child[category];
        // Pick a gene that is different from the current one (if possible)
        const options = pool.filter(g => g !== currentGene);
        if (options.length > 0) {
           child[category] = options[Math.floor(Math.random() * options.length)];
           mutated = true;
        }
      }
    }
    // Safety break if mutation rate is very low or 0
    if (mutationRate <= 0) break;
  }
  
  return child;
}

/**
 * Generate a random color palette
 * @returns {string[]} Array of hex colors
 */
function generateRandomPalette() {
  // Simple placeholder palettes or random generation
  const palettes = [
    ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"], // Rainbow
    ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"], // Earth
    ["#000000", "#14213d", "#fca311", "#e5e5e5", "#ffffff"], // Dark/Gold
    ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"], // Pastel
    ["#ff7b00", "#ff8800", "#ff9500", "#ffa200", "#ffaa00"], // Orange
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
}

module.exports = { 
  createRandomGenome, 
  mutateGenome, 
  generateRandomPalette,
  MODULE_POOLS 
};

