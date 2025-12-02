#!/usr/bin/env node

/**
 * Title Word Store Service
 * Extracts and tracks title words from existing artworks to avoid repetition
 */

class TitleWordStore {
  /**
   * Extract meaningful words from a title
   * @param {string} title - Artwork title
   * @returns {Array<string>} Array of lowercase words (excluding common words)
   */
  extractTitleWords(title) {
    if (!title || typeof title !== "string") return [];

    // Remove "Signal XXX: " prefix if present
    const cleanTitle = title.replace(/^Signal \d+: /i, "").trim();

    // Extract words (alphanumeric, allow hyphens)
    const words = cleanTitle
      .toLowerCase()
      .split(/[\s\-:;,.!?]+/)
      .filter((w) => w.length > 2); // Only words with 3+ characters

    // Common words to ignore
    const stopWords = new Set([
      "the",
      "of",
      "and",
      "a",
      "an",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "from",
      "by",
      "as",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
      "it",
      "its",
      "they",
      "their",
      "them",
      "or",
      "but",
      "if",
      "than",
      "then",
      "when",
      "where",
      "what",
      "who",
      "which",
      "how",
      "why",
    ]);

    return words.filter((w) => !stopWords.has(w));
  }

  /**
   * Build a store of used title words from artworks
   * @param {Array<Object>} artworks - Array of artwork objects
   * @param {number} lookbackCount - Number of recent artworks to analyze (default: 20)
   * @returns {Object} Store with word frequencies and common words list
   */
  buildWordStore(artworks, lookbackCount = 20) {
    const recentArtworks = artworks.slice(-lookbackCount);
    const wordFrequency = {};
    const allWords = [];

    recentArtworks.forEach((artwork) => {
      if (artwork.title) {
        const words = this.extractTitleWords(artwork.title);
        words.forEach((word) => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          allWords.push(word);
        });
      }
    });

    // Find words used 3+ times (overused)
    const overusedWords = Object.entries(wordFrequency)
      .filter(([word, count]) => count >= 3)
      .map(([word]) => word)
      .sort();

    // Get all unique words used
    const usedWords = [...new Set(allWords)];

    return {
      wordFrequency,
      overusedWords,
      usedWords,
      recentTitles: recentArtworks.map((a) => a.title).filter(Boolean),
    };
  }

  /**
   * Generate avoidance text for the LLM prompt
   * @param {Object} wordStore - Word store from buildWordStore()
   * @param {number} maxOverusedToShow - Maximum number of overused words to list (default: 10)
   * @returns {string} Formatted avoidance text
   */
  generateAvoidanceText(wordStore, maxOverusedToShow = 10) {
    const { overusedWords, recentTitles } = wordStore;

    let text = "";

    if (overusedWords.length > 0) {
      const wordsToShow = overusedWords.slice(0, maxOverusedToShow);
      text += `\nAvoid overused title words that appear frequently in recent artworks:\n${wordsToShow.map((w) => `- "${w}"`).join(", ")}\n`;
    }

    if (recentTitles.length > 0) {
      text += `\nRecent artwork titles to avoid repeating:\n${recentTitles.slice(-10).map((t) => `- "${t}"`).join("\n")}\n`;
    }

    return text;
  }
}

module.exports = TitleWordStore;

