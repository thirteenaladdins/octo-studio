#!/usr/bin/env node

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const { validateConcept } = require("./conceptSchema");
const templateRegistry = require("../src/templates/registry");

const ALLOWED_TEMPLATES = Object.keys(templateRegistry);
if (!ALLOWED_TEMPLATES.length) {
  throw new Error(
    "Template registry is empty – cannot initialize OpenAI service."
  );
}

const TEMPLATE_GUIDELINES = ALLOWED_TEMPLATES.map((template) => {
  const details = templateRegistry[template] || {};
  const shapes =
    Array.isArray(details.capabilities?.shapes) &&
    details.capabilities.shapes.length
      ? details.capabilities.shapes.join(", ")
      : "varied shapes";
  const animation = details.capabilities?.animation || "varied animation";
  const interaction = details.capabilities?.interaction
    ? "; interaction: enabled"
    : "";
  const description = details.description || "No description provided";
  return `- ${template}: ${description} (shapes: ${shapes}; animation: ${animation}${interaction})`;
}).join("\n");

/**
 * OpenAI Service for generating generative art concepts
 */
class OpenAIService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.client = new OpenAI({ apiKey });
    this.logDir = path.join(__dirname, "..", "..", "logs");
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logResponse(concept, fullResponse) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      concept,
      fullResponse: {
        model: fullResponse.model,
        usage: fullResponse.usage,
        finishReason: fullResponse.choices[0].finish_reason,
        promptTokens: fullResponse.usage.prompt_tokens,
        completionTokens: fullResponse.usage.completion_tokens,
        totalTokens: fullResponse.usage.total_tokens,
      },
    };

    const logFile = path.join(
      this.logDir,
      `llm-${timestamp.split("T")[0]}.jsonl`
    );
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n", "utf8");

    console.log(`📝 Logged LLM response to: ${logFile}`);
  }

  /**
   * Generate a generative art concept using OpenAI
   * @returns {Promise<Object>} Art concept with shapes, colors, movement, density, mood, title, description
   */
  async generateArtConcept({ avoid = [], seed = null, wordStore = null } = {}) {
    const systemPrompt = `You are a generative art expert specializing in P5.js creative coding. Generate unique, visually interesting concepts for abstract generative artworks.`;

    const avoidText =
      Array.isArray(avoid) && avoid.length
        ? `Avoid repeating concepts similar to any of these signatures (template|colors|movement|density|mood|title):\n- ${avoid.join(
            "\n- "
          )}`
        : "";

    // Add title word avoidance text
    let titleWordAvoidanceText = "";
    if (wordStore && wordStore.overusedWords) {
      // Generate avoidance text directly without instantiating the class
      const { overusedWords, recentTitles } = wordStore;
      if (overusedWords.length > 0) {
        const wordsToShow = overusedWords.slice(0, 10);
        titleWordAvoidanceText += `\nAvoid overused title words that appear frequently in recent artworks:\n${wordsToShow
          .map((w) => `- "${w}"`)
          .join(", ")}\n`;
      }
      if (recentTitles.length > 0) {
        titleWordAvoidanceText += `\nRecent artwork titles to avoid repeating:\n${recentTitles
          .slice(-10)
          .map((t) => `- "${t}"`)
          .join("\n")}\n`;
      }
    }

    const seedText = seed != null ? `Creative seed: ${seed}` : "";

    const userPrompt = `Generate a unique generative art concept for a P5.js sketch. Choose whichever template best fits the concept while avoiding recent repetitions. ${avoidText}${titleWordAvoidanceText}\n${seedText}\n
Available templates:
${TEMPLATE_GUIDELINES}

Return ONLY valid JSON with this exact structure:
{
  "template": "<one of: ${ALLOWED_TEMPLATES.join(", ")}>",
  "shapes": ["list of 1-5 primary shapes relevant to the chosen template"],
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3", "#hexcolor4"],
  "movement": "description of the animation or motion behaviour (e.g., 'slow flowing streams')",
  "density": 20-100,
  "mood": "1-2 word mood description",
  "title": "poetic title for the artwork (1-6 words)",
  "description": "brief artistic description (15-25 words)",
  "hashtags": ["2-3 concept-specific hashtags (e.g., #Abstract, #Organic, #Flowing)"]
}

Guidelines:
- Template MUST be one of: ${ALLOWED_TEMPLATES.join(", ")}
- Align shapes and movement with what the chosen template supports
- Use 3-5 harmonious colors (hex values)
- Keep density within the 20-100 range and consistent with the template's behaviour
- Title should be evocative but not overly abstract (1-6 words, can be as short as 1 word)
- Avoid using overused words from recent artworks - be creative and use fresh vocabulary
- Ensure each concept feels distinct from the recent avoidance list
- Hashtags must be single words (no spaces; camelCase if needed)`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.95,
        presence_penalty: 0.8,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const rawConcept = JSON.parse(content);

      // Ensure template stays within the allowed registry
      if (
        !rawConcept.template ||
        !ALLOWED_TEMPLATES.includes(rawConcept.template)
      ) {
        console.log(
          `⚠️  LLM produced unsupported template "${
            rawConcept.template || "<missing>"
          }", defaulting to "${ALLOWED_TEMPLATES[0]}"`
        );
        rawConcept.template = ALLOWED_TEMPLATES[0];
      }

      // Validate with Zod schema
      try {
        const concept = validateConcept(rawConcept);

        // Log the full response for debugging
        this.logResponse(concept, response);

        console.log("Generated art concept:", concept.title);
        return concept;
      } catch (error) {
        console.error("❌ Concept validation failed:", error.message);
        // Log the raw response for debugging even if validation fails
        this.logResponse(rawConcept, response);
        throw error;
      }
    } catch (error) {
      console.error("Error generating art concept:", error.message);
      throw error;
    }
  }

  /**
   * Evaluate an image using GPT-4o Vision
   * @param {Buffer} imageBuffer - The image buffer to evaluate
   * @param {string} prompt - Specific evaluation criteria prompt
   * @returns {Promise<Object>} JSON evaluation result
   */
  async evaluateImage(imageBuffer, prompt) {
    const base64Image = imageBuffer.toString('base64');
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } }
            ],
          },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error("Error evaluating image:", error.message);
      throw error;
    }
  }
}

module.exports = OpenAIService;
