/**
 * Fitness Module
 * Evaluates the artistic quality of generated images using OpenAI Vision.
 */

/**
 * Evaluate an image using AI Critic
 * @param {Buffer} imageBuffer - The rendered image
 * @param {Object} openaiService - Instance of OpenAIService
 * @returns {Promise<Object>} Evaluation result { score, reason }
 */
async function evaluateFitness(imageBuffer, openaiService) {
  const prompt = `
    Act as a sophisticated art critic. Evaluate this generative artwork on a scale of 0 to 100.
    
    Criteria:
    1. Visual Harmony & Composition (30%)
    2. Complexity & Detail (30%) - Is it too simple? Too chaotic?
    3. Uniqueness & Aesthetic Appeal (40%) - Is it interesting to look at?

    Be strict. A random mess should get a low score (< 30). A simple geometric shape should be mid-tier (40-60). 
    Only truly compelling, complex, and balanced compositions should exceed 80.

    Return ONLY a JSON object with this exact structure:
    {
      "score": <number 0-100>,
      "reason": "<brief explanation of the score>"
    }
  `;

  try {
    const result = await openaiService.evaluateImage(imageBuffer, prompt);
    return {
      score: result.score || 0,
      reason: result.reason || "No reason provided"
    };
  } catch (error) {
    console.error("Fitness evaluation failed:", error.message);
    // Return a neutral low score on failure to avoid breaking the loop
    return { score: 0, reason: "Evaluation failed" };
  }
}

module.exports = { evaluateFitness };

