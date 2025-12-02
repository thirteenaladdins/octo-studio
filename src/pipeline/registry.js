/**
 * Module Registry
 * Maps module names to functions and provides discovery
 */

// Positioning modules
const generateGrid = require('./modules/positioning/generateGrid');
const offsetGrid = require('./modules/positioning/offsetGrid');
const spiral = require('./modules/positioning/spiral');
const random = require('./modules/positioning/random');
const flowGrid = require('./modules/positioning/flowGrid');

// Coloring modules
const applyPalette = require('./modules/coloring/applyPalette');
const time = require('./modules/coloring/time');
const gradient = require('./modules/coloring/gradient');
const noiseColor = require('./modules/coloring/noiseColor');
const index = require('./modules/coloring/index');

// Sizing modules
const applySizing = require('./modules/sizing/applySizing');
const noise = require('./modules/sizing/noise');
const constant = require('./modules/sizing/constant');
const distance = require('./modules/sizing/distance');
const pulse = require('./modules/sizing/pulse');

// Transformation modules
const applyTransform = require('./modules/transformation/applyTransform');
const none = require('./modules/transformation/none');
const jitter = require('./modules/transformation/jitter');
const noiseOffset = require('./modules/transformation/noiseOffset');
const orbit = require('./modules/transformation/orbit');
const wave = require('./modules/transformation/wave');
const runtimeNoiseAdjust = require('./modules/transformation/runtimeNoiseAdjust');

// Rendering modules
const applyShape = require('./modules/rendering/applyShape');

/**
 * Module registry organized by category
 */
const MODULE_REGISTRY = {
  positioning: {
    grid: generateGrid,
    offsetGrid: offsetGrid,
    spiral: spiral,
    random: random,
    flowGrid: flowGrid
  },
  coloring: {
    palette: applyPalette,
    time: time,
    gradient: gradient,
    noise: noiseColor, // 'noise' maps to noiseColor function
    index: index
  },
  sizing: {
    sizing: applySizing, // Default/legacy
    noise: noise,
    constant: constant,
    distance: distance,
    pulse: pulse
  },
  transformation: {
    transform: applyTransform, // Default/legacy (wave-based)
    none: none,
    jitter: jitter,
    noiseOffset: noiseOffset,
    orbit: orbit,
    wave: wave,
    runtimeNoiseAdjust: runtimeNoiseAdjust
  },
  rendering: {
    shape: applyShape
  }
};

/**
 * Get module function by category and name
 * @param {string} category - Module category (positioning, coloring, etc.)
 * @param {string} name - Module name
 * @returns {Function|null} Module function or null if not found
 */
function getModule(category, name) {
  if (!MODULE_REGISTRY[category]) {
    return null;
  }
  return MODULE_REGISTRY[category][name] || null;
}

/**
 * Get all modules in a category
 * @param {string} category - Module category
 * @returns {Object} Object mapping names to functions
 */
function getModulesByCategory(category) {
  return MODULE_REGISTRY[category] || {};
}

/**
 * Get all available categories
 * @returns {string[]} Array of category names
 */
function getCategories() {
  return Object.keys(MODULE_REGISTRY);
}

/**
 * Check if a module exists
 * @param {string} category - Module category
 * @param {string} name - Module name
 * @returns {boolean} True if module exists
 */
function hasModule(category, name) {
  return getModule(category, name) !== null;
}

/**
 * Get all available modules
 * @returns {Object} Complete registry
 */
function getAllModules() {
  return MODULE_REGISTRY;
}

module.exports = {
  getModule,
  getModulesByCategory,
  getCategories,
  hasModule,
  getAllModules,
  MODULE_REGISTRY
};

