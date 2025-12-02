/**
 * Pipeline Execution Engine
 * Executes modules sequentially on a state object
 */

/**
 * Execute a pipeline of modules on a state object
 * @param {Array<Function>} modules - Array of module functions to execute
 * @param {Object} initialState - Initial state object
 * @returns {Object} Final state after all modules executed
 */
function executePipeline(modules, initialState) {
  if (!Array.isArray(modules) || modules.length === 0) {
    throw new Error('Pipeline must contain at least one module');
  }

  let currentState = { ...initialState };

  for (let i = 0; i < modules.length; i++) {
    const moduleFn = modules[i];
    
    if (typeof moduleFn !== 'function') {
      throw new Error(`Module at index ${i} is not a function`);
    }

    try {
      // Execute module - it should return a new state object
      const newState = moduleFn(currentState);
      
      // Validate the returned state
      if (!newState || typeof newState !== 'object') {
        throw new Error(`Module ${moduleFn.name || `at index ${i}`} returned invalid state`);
      }

      // Ensure elements array exists
      if (!Array.isArray(newState.elements)) {
        throw new Error(`Module ${moduleFn.name || `at index ${i}`} did not return valid elements array`);
      }

      // Update metadata element count
      if (newState.metadata) {
        newState.metadata.elementCount = newState.elements.length;
      }

      currentState = newState;
    } catch (error) {
      throw new Error(`Error executing module ${moduleFn.name || `at index ${i}`}: ${error.message}`);
    }
  }

  return currentState;
}

module.exports = {
  executePipeline
};

