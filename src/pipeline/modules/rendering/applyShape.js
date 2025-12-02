/**
 * Apply Shape Module
 * Adds shape property to elements
 */

/**
 * Apply shapes to elements
 * @param {Object} state - Current state object
 * @returns {Object} New state with shape property added to elements
 */
function applyShape(state) {
  const { config, elements } = state;
  const shape = config.shape || 'circle';
  
  // Apply shape to each element
  const shapedElements = elements.map((element) => {
    return {
      ...element,
      shape: shape
    };
  });
  
  return {
    ...state,
    elements: shapedElements
  };
}

module.exports = applyShape;

