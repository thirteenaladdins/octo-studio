/**
 * Runtime Noise Adjustment Module
 * Marks elements for runtime noise recalculation using p5.noise()
 * This compensates for the difference between simpleNoise() and p5.noise()
 * by flagging elements to be recalculated during rendering
 */

/**
 * Apply runtime noise adjustment flag to elements
 * This doesn't change the elements, just marks them for runtime recalculation
 * @param {Object} state - Current state object
 * @returns {Object} New state with metadata flagging runtime noise recalculation
 */
function runtimeNoiseAdjust(state) {
  const { config, elements } = state;
  const gridSize = config.gridSize || 20;
  
  // Mark elements with their grid positions for runtime recalculation
  const adjustedElements = elements.map((element, index) => {
    // Calculate grid position from index
    const i = index % gridSize;
    const j = Math.floor(index / gridSize);
    
    return {
      ...element,
      // Add metadata for runtime noise recalculation
      _runtimeNoise: {
        i: i,
        j: j,
        recalculateSize: true,  // Flag to recalculate size using p5.noise()
        recalculateColor: true  // Flag to recalculate color using p5.noise()
      }
    };
  });
  
  // Add metadata to state indicating runtime noise adjustment is needed
  return {
    ...state,
    elements: adjustedElements,
    metadata: {
      ...state.metadata,
      runtimeNoiseAdjust: true,
      gridSize: gridSize
    }
  };
}

module.exports = runtimeNoiseAdjust;

