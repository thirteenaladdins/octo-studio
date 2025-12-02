#!/usr/bin/env node

/**
 * Art Generator Service
 * Generates tags from AI concepts for artworks
 */
class ArtGenerator {
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
    if (concept.shapes && Array.isArray(concept.shapes)) {
      tags.push(...concept.shapes.slice(0, 2).map((s) => s.toLowerCase()));
    }

    return [...new Set(tags)].slice(0, 6); // max 6 unique tags
  }
}

module.exports = ArtGenerator;
