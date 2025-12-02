/**
 * Pipeline Builder
 * Constructs pipeline array from config.modules object
 * Validates module availability and enforces constraints
 */

const registry = require('./registry');

/**
 * Build pipeline from config.modules object
 * @param {Object} configModules - Config modules object (e.g., { positioning: 'grid', coloring: 'palette' })
 * @returns {Array<Function>} Array of module functions in execution order
 */
function buildPipeline(configModules) {
  if (!configModules || typeof configModules !== 'object') {
    throw new Error('config.modules must be an object');
  }

  const pipeline = [];
  const errors = [];

  // Validate that exactly one positioning module exists (required)
  const positioningModules = Object.keys(configModules)
    .filter(key => key === 'positioning' && configModules[key]);
  
  if (positioningModules.length === 0) {
    errors.push('Pipeline must contain exactly one positioning module');
  } else if (positioningModules.length > 1) {
    errors.push('Pipeline must contain exactly one positioning module (found multiple)');
  }

  if (errors.length > 0) {
    throw new Error(`Pipeline validation failed: ${errors.join(', ')}`);
  }

  // Build pipeline in execution order
  // 1. Positioning (must be first to create elements)
  if (configModules.positioning) {
    const moduleFn = registry.getModule('positioning', configModules.positioning);
    if (!moduleFn) {
      throw new Error(`Positioning module '${configModules.positioning}' not found`);
    }
    pipeline.push(moduleFn);
  }

  // 2. Sizing (applies to elements)
  if (configModules.sizing) {
    const moduleFn = registry.getModule('sizing', configModules.sizing);
    if (!moduleFn) {
      throw new Error(`Sizing module '${configModules.sizing}' not found`);
    }
    pipeline.push(moduleFn);
  }

  // 3. Coloring (applies to elements)
  if (configModules.coloring) {
    const moduleFn = registry.getModule('coloring', configModules.coloring);
    if (!moduleFn) {
      throw new Error(`Coloring module '${configModules.coloring}' not found`);
    }
    pipeline.push(moduleFn);
  }

  // 4. Transformation (modifies positions)
  if (configModules.transformation) {
    const moduleFn = registry.getModule('transformation', configModules.transformation);
    if (!moduleFn) {
      throw new Error(`Transformation module '${configModules.transformation}' not found`);
    }
    pipeline.push(moduleFn);
  }

  // 5. Rendering (adds shape info)
  if (configModules.rendering) {
    const moduleFn = registry.getModule('rendering', configModules.rendering);
    if (!moduleFn) {
      throw new Error(`Rendering module '${configModules.rendering}' not found`);
    }
    pipeline.push(moduleFn);
  }

  // Ensure at least one module (positioning is required)
  if (pipeline.length === 0) {
    throw new Error('Pipeline must contain at least one module');
  }

  return pipeline;
}

module.exports = {
  buildPipeline
};

