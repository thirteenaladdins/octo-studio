/**
 * No Transform Module
 * Returns elements unchanged (no transformation)
 */

/**
 * Apply no transformation (pass-through)
 * @param {Object} state - Current state object
 * @returns {Object} New state (unchanged elements)
 */
function none(state) {
  // Simply return state unchanged
  return {
    ...state,
    elements: [...state.elements] // Return new array reference for immutability
  };
}

module.exports = none;

