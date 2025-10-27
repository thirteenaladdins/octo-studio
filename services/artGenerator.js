#!/usr/bin/env node

const path = require("path");
const { generateRandomConfig } = require("./templateConfigService");

/**
 * Art Generator Service
 * Translates AI concepts into P5.js code using templates
 */
class ArtGenerator {
  constructor() {
    this.templates = {
      particleSystem: require("../templates/particleSystem"),
      gridPattern: require("../templates/gridPattern"),
      orbitalMotion: require("../templates/orbitalMotion"),
      flowField: require("../templates/flowField"),
      noiseWaves: require("../templates/noiseWaves"),
      geometricGrid: require("../templates/geometricGrid"),
      ballots: require("../templates/ballots"),
    };
  }

  /**
   * Generate P5.js sketch code from an AI concept
   * @param {Object} concept - The AI-generated concept
   * @param {string} sketchId - The sketch ID (e.g., "006")
   * @returns {string} Complete P5.js sketch code
   */
  generateSketch(concept, sketchId) {
    const { template, shapes, colors, movement, density } = concept;

    // Validate template exists
    if (!this.templates[template]) {
      throw new Error(`Unknown template: ${template}`);
    }

    // Prepare template parameters
    const params = {
      shapes: this.normalizeShapes(shapes),
      colors: this.normalizeColors(colors),
      movement: movement.toLowerCase(),
      density: Math.max(10, Math.min(100, density)),
    };

    // Build a per-template randomized config from schema to introduce variance
    const seed = Date.now() % 2147483647;
    const config = generateRandomConfig(template, seed);

    console.log(`Generating sketch using template: ${template}`);
    console.log(`Parameters:`, JSON.stringify(params, null, 2));
    console.log(`Config:`, JSON.stringify(config, null, 2));

    // Generate the sketch code
    const sketchCode = this.embedConfig(
      this.templates[template](params),
      config
    );

    return sketchCode;
  }

  embedConfig(code, config) {
    // Prepend a CONFIG constant so runtime can use it
    const header = `const CONFIG = ${JSON.stringify(config, null, 2)};\n`;
    return header + code;
  }

  /**
   * Normalize shape names to valid P5.js shapes
   * @param {Array<string>} shapes - Raw shape names from AI
   * @returns {Array<string>} Normalized shape names
   */
  normalizeShapes(shapes) {
    const validShapes = ["circle", "rect", "ellipse", "triangle", "line"];
    return shapes
      .map((shape) => {
        const normalized = shape.toLowerCase().trim();
        // Map common variations
        if (normalized.includes("square")) return "rect";
        if (normalized.includes("round") || normalized.includes("dot"))
          return "circle";
        if (validShapes.includes(normalized)) return normalized;
        return "circle"; // default fallback
      })
      .filter((s, i, arr) => arr.indexOf(s) === i); // unique
  }

  /**
   * Normalize color values to valid hex codes
   * @param {Array<string>} colors - Raw color values from AI
   * @returns {Array<string>} Normalized hex colors
   */
  normalizeColors(colors) {
    return colors
      .map((color) => {
        // Ensure it starts with #
        if (!color.startsWith("#")) {
          color = "#" + color;
        }
        // Validate hex format
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
          return color;
        }
        return null;
      })
      .filter(Boolean);
  }

  /**
   * Extract tags from the concept
   * @param {Object} concept - The AI-generated concept
   * @returns {Array<string>} Generated tags
   */
  generateTags(concept) {
    const tags = [
      "generative",
      "ai-generated",
      concept.template.replace(/([A-Z])/g, "-$1").toLowerCase(),
    ];

    // Add mood as tag
    if (concept.mood) {
      tags.push(
        ...concept.mood
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );
    }

    // Add shape tags
    tags.push(...concept.shapes.slice(0, 2).map((s) => s.toLowerCase()));

    return [...new Set(tags)].slice(0, 6); // max 6 unique tags
  }
}

module.exports = ArtGenerator;
