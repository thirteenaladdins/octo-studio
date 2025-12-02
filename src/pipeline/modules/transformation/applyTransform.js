/**
 * Apply Transform Module (Wave-based)
 * Modifies x, y positions of elements with wave transformation
 * This is a default/legacy transform - consider using wave.js instead
 */

const wave = require('./wave');

/**
 * Apply transformations to elements (delegates to wave)
 * @param {Object} state - Current state object
 * @returns {Object} New state with transformed positions
 */
function applyTransform(state) {
  return wave(state);
}

module.exports = applyTransform;

