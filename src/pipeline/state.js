/**
 * State Object Factory
 * Creates and validates the shared state object used by all pipeline modules
 */

/**
 * Create initial state object from config
 * @param {Object} config - Configuration object with generation parameters
 * @returns {Object} Initial state object
 */
function createInitialState(config) {
  const defaultConfig = {
    seed: 12345,
    width: 2400,
    height: 2400,
    gridSize: 20,
    speed: 0.01,
    shape: 'circle',
    palette: ['#000000', '#ffffff'],
    background: '#ffffff',
    ...config
  };

  return {
    config: defaultConfig,
    elements: [], // Will be populated by positioning modules
    width: defaultConfig.width || 2400,
    height: defaultConfig.height || 2400,
    randomSeed: defaultConfig.seed || 12345, // For deterministic RNG across modules
    metadata: {
      elementCount: 0,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Validate state object structure
 * @param {Object} state - State object to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateState(state) {
  const errors = [];

  if (!state) {
    errors.push('State is null or undefined');
    return { valid: false, errors };
  }

  if (!Array.isArray(state.elements)) {
    errors.push('State.elements must be an array');
  }

  if (typeof state.width !== 'number' || state.width <= 0) {
    errors.push('State.width must be a positive number');
  }

  if (typeof state.height !== 'number' || state.height <= 0) {
    errors.push('State.height must be a positive number');
  }

  if (typeof state.randomSeed !== 'number') {
    errors.push('State.randomSeed must be a number');
  }

  if (!state.config || typeof state.config !== 'object') {
    errors.push('State.config must be an object');
  }

  if (!state.metadata || typeof state.metadata !== 'object') {
    errors.push('State.metadata must be an object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a deterministic RNG function from seed
 * @param {number} seed - Random seed
 * @returns {Function} RNG function that returns 0-1
 */
function createRNG(seed) {
  let value = seed;
  return function() {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return value / 0x7fffffff;
  };
}

module.exports = {
  createInitialState,
  validateState,
  createRNG
};

