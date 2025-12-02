#!/usr/bin/env node

const puppeteer = require("puppeteer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

/**
 * Template Evaluator
 * Renders templates with Puppeteer and extracts features with sharp
 */
class TemplateEvaluator {
  constructor() {
    this.evaluationSeed = 12345; // Fixed seed for reproducible evaluation
    this.canvasSize = { width: 1024, height: 1024 };
  }

  /**
   * Evaluate a template by rendering and analyzing it
   * @param {string} templateCode - Generated p5.js template code
   * @param {Object} params - Runtime parameters
   * @returns {Promise<Object>} Evaluation results with features and gates
   */
  async evaluateTemplate(templateCode, params = {}) {
    console.log("🎨 Rendering template...");

    // Render template with Puppeteer
    const { imageBuffer, renderTime } = await this.renderTemplate(
      templateCode,
      params
    );

    console.log("🔍 Extracting features...");

    // Extract features with sharp
    const features = await this.extractFeatures(imageBuffer);

    // Run quality gates
    const gates = this.runQualityGates(features, renderTime);

    return {
      features,
      gates,
      renderTime,
      imageBuffer,
      seed: this.evaluationSeed,
    };
  }

  /**
   * Render template using Puppeteer
   * @param {string} templateCode - Template code
   * @param {Object} params - Runtime parameters
   * @returns {Promise<Object>} Image buffer and render time
   */
  async renderTemplate(templateCode, params) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: this.canvasSize.width,
        height: this.canvasSize.height,
      });

      // Create HTML page with template
      const html = this.generateHTML(templateCode, params);
      await page.setContent(html);

      // Capture console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      page.on('pageerror', error => {
        errors.push(error.message);
      });

      // Measure render time - start timer after page content is set
      const renderStartTime = Date.now();

      // Wait for p5.js to load and canvas to appear
      await page.waitForSelector('canvas', { timeout: 3000 }).catch(() => {
        // Canvas might not appear if there's an error
      });

      // Wait for rendering to complete (noLoop means draw runs once)
      // Additional wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const renderTime = Date.now() - renderStartTime;
      
      // Log errors if any
      if (errors.length > 0) {
        console.warn('Console errors during rendering:', errors);
      }

      // Take screenshot
      const imageBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      return { imageBuffer, renderTime };
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML for template rendering
   * @param {string} templateCode - Template code
   * @param {Object} params - Runtime parameters
   * @returns {string} HTML content
   */
  generateHTML(templateCode, params) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh;
      background: #000;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <script>
    // Create module shim for browser environment
    const module = { exports: {} };
    
    // Inject template code
    ${templateCode}
    
    // Run template with evaluation seed
    const template = module.exports;
    const params = ${JSON.stringify(params)};
    const seed = ${this.evaluationSeed};
    
    new p5((p5) => {
      p5.setup = () => {
        try {
          p5.createCanvas(${this.canvasSize.width}, ${this.canvasSize.height});
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noLoop(); // Single frame render
        } catch (e) {
          console.error('Error in setup:', e);
        }
      };
      
      p5.draw = () => {
        try {
          if (template && template.render) {
            template.render(p5, params, seed);
          } else {
            console.error('Template render function not available. Template:', template);
          }
        } catch (e) {
          console.error('Error in draw/render:', e);
          console.error('Stack:', e.stack);
        }
      };
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * Extract features from image using sharp
   * @param {Buffer} imageBuffer - PNG image buffer
   * @returns {Promise<Object>} Extracted features
   */
  async extractFeatures(imageBuffer) {
    const img = sharp(imageBuffer).ensureAlpha();
    const stats = await img.stats();
    const channels = stats.channels || [];

    // Extract features with error handling
    let dominantColors = [];
    try {
      dominantColors = await this.extractDominantColors(img);
    } catch (error) {
      console.warn("Warning: Failed to extract dominant colors:", error.message);
    }

    // Basic metrics
    const features = {
      // Blank check: non-background pixel ratio
      blankRatio: await this.calculateBlankRatio(img),

      // Contrast: luminance stddev (calculated from pixel data)
      contrast: await this.calculateContrast(img),

      // Edge density: Sobel gradient detection
      edgeDensity: await this.calculateEdgeDensity(img),

      // Palette extraction: k-means clustering
      dominantColors: dominantColors || [],

      // Palette entropy: Shannon entropy
      paletteEntropy: await this.calculatePaletteEntropy(img),

      // Symmetry score: horizontal mirror comparison
      symmetry: await this.calculateSymmetry(img),

      // Color harmony: CIEDE2000 distances
      colorHarmony: await this.calculateColorHarmony(img),

      // Overall brightness
      brightness: this.calculateBrightness(channels),
    };

    return features;
  }

  /**
   * Calculate blank ratio (non-background pixels)
   * @param {Object} img - Sharp image object
   * @returns {Promise<number>} Ratio of non-background pixels
   */
  async calculateBlankRatio(img) {
    const { data, info } = await img
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    if (!data || !info || !info.width || !info.height) {
      return 0;
    }
    
    const totalPixels = info.width * info.height;
    let nonBackgroundPixels = 0;

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Consider pixel non-background if it's not pure black/dark
      if (r > 20 || g > 20 || b > 20) {
        nonBackgroundPixels++;
      }
    }

    return nonBackgroundPixels / (totalPixels / 4);
  }

  /**
   * Calculate contrast from image data (computes stddev from pixels)
   * @param {Object} img - Sharp image object
   * @returns {Promise<number>} Contrast score
   */
  async calculateContrast(img) {
    // Get raw pixel data to compute stddev
    const { data, info } = await img
      .resize(256, 256) // Downsample for performance
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    if (!data || !info || !info.width || !info.height) {
      return 0;
    }

    let sumLuminance = 0;
    const luminances = [];

    // Calculate luminance for each pixel and store for stddev calculation
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
      luminances.push(luminance);
      sumLuminance += luminance;
    }

    if (luminances.length === 0) {
      return 0;
    }

    // Calculate mean
    const meanLuminance = sumLuminance / luminances.length;

    // Calculate variance and stddev
    let variance = 0;
    for (const lum of luminances) {
      const diff = lum - meanLuminance;
      variance += diff * diff;
    }
    variance /= luminances.length;
    const stddev = Math.sqrt(variance);

    // Normalize to 0-1 range (divide by ~128 for typical range)
    const normalizedContrast = stddev / 128;

    // Handle NaN or invalid results
    if (isNaN(normalizedContrast) || !isFinite(normalizedContrast)) {
      return 0;
    }

    return normalizedContrast;
  }

  /**
   * Calculate edge density using Sobel gradient
   * @param {Object} img - Sharp image object
   * @returns {Promise<number>} Edge density ratio
   */
  async calculateEdgeDensity(img) {
    // Downsample for performance
    const small = await img
      .resize(256, 256)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    if (!small.data || !small.info || !small.info.width || !small.info.height) {
      return 0;
    }
    
    let edges = 0;
    const width = small.info.width;
    const height = small.info.height;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;

        // Sobel gradients
        const gx = small.data[i + 1] - small.data[i - 1];
        const gy = small.data[i + width] - small.data[i - width];
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        if (magnitude > 30) {
          // Threshold for edge detection
          edges++;
        }
      }
    }

    return edges / (width * height);
  }

  /**
   * Extract dominant colors using k-means clustering
   * @param {Object} img - Sharp image object
   * @returns {Promise<Array>} Array of dominant colors in hex
   */
  async extractDominantColors(img) {
    // Downsample and get pixel data
    const { data, info } = await img
      .resize(128, 128)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    if (!data || !data.length) {
      return [];
    }
    
    const pixels = [];

    // Sample pixels
    for (let i = 0; i < data.length; i += 12) {
      // Sample every 4th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      pixels.push([r, g, b]);
    }

    // Simple k-means clustering (k=5)
    const clusters = this.kMeansClustering(pixels, 5);

    // Convert to hex colors - ensure we always return an array
    if (!clusters || clusters.length === 0) {
      return [];
    }

    return clusters
      .map((cluster) => {
        if (!cluster || !cluster.center) return null;
        const [r, g, b] = cluster.center;
        return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
          .toString(16)
          .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
      })
      .filter(Boolean); // Remove any null values
  }

  /**
   * Simple k-means clustering implementation
   * @param {Array} pixels - Array of [r,g,b] pixel values
   * @param {number} k - Number of clusters
   * @returns {Array} Cluster centers
   */
  kMeansClustering(pixels, k) {
    if (pixels.length === 0) return [];

    // Initialize random centroids
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push({ center: [...randomPixel], points: [] });
    }

    // Iterate until convergence
    for (let iter = 0; iter < 10; iter++) {
      // Clear points
      centroids.forEach((c) => (c.points = []));

      // Assign pixels to closest centroid
      pixels.forEach((pixel) => {
        let minDist = Infinity;
        let closestCentroid = 0;

        centroids.forEach((centroid, i) => {
          const dist = this.colorDistance(pixel, centroid.center);
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = i;
          }
        });

        centroids[closestCentroid].points.push(pixel);
      });

      // Update centroids
      centroids.forEach((centroid) => {
        if (centroid.points.length > 0) {
          const sum = centroid.points.reduce(
            (acc, point) => [
              acc[0] + point[0],
              acc[1] + point[1],
              acc[2] + point[2],
            ],
            [0, 0, 0]
          );

          centroid.center = [
            sum[0] / centroid.points.length,
            sum[1] / centroid.points.length,
            sum[2] / centroid.points.length,
          ];
        }
      });
    }

    return centroids;
  }

  /**
   * Calculate color distance (Euclidean)
   * @param {Array} color1 - [r,g,b] color
   * @param {Array} color2 - [r,g,b] color
   * @returns {number} Distance
   */
  colorDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
  }

  /**
   * Calculate palette entropy
   * @param {Object} img - Sharp image object
   * @returns {Promise<number>} Shannon entropy
   */
  async calculatePaletteEntropy(img) {
    const { data } = await img.resize(64, 64).raw().toBuffer();
    
    if (!data || !data.length) {
      return 0;
    }
    
    const colorCounts = {};

    // Count color frequencies
    for (let i = 0; i < data.length; i += 12) {
      const r = Math.floor(data[i] / 32) * 32; // Quantize to reduce colors
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    const totalPixels = Object.values(colorCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    let entropy = 0;

    Object.values(colorCounts).forEach((count) => {
      const probability = count / totalPixels;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    return entropy;
  }

  /**
   * Calculate symmetry score
   * @param {Object} img - Sharp image object
   * @returns {Promise<number>} Symmetry score (0-1)
   */
  async calculateSymmetry(img) {
    try {
      const { data, info } = await img
        .resize(256, 256)
        .ensureAlpha() // Ensure RGBA format
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      if (!data || !info || !info.width || !info.height || !info.channels) {
        return 0;
      }
      
      const channels = info.channels; // Usually 3 (RGB) or 4 (RGBA)
      const pixelStride = channels;
      let symmetry = 0;
      let count = 0;

      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < Math.floor(info.width / 2); x++) {
          const i = (y * info.width + x) * pixelStride;
          const j = (y * info.width + (info.width - 1 - x)) * pixelStride;

          // Check bounds
          if (i + 2 >= data.length || j + 2 >= data.length) {
            continue;
          }

          const diff =
            Math.abs(data[i] - data[j]) +
            Math.abs(data[i + 1] - data[j + 1]) +
            Math.abs(data[i + 2] - data[j + 2]);

          // Ensure valid numeric result
          const similarity = (765 - diff) / 765;
          if (!isNaN(similarity) && isFinite(similarity)) {
            symmetry += similarity;
            count++;
          }
        }
      }

      if (count === 0) {
        return 0;
      }

      const result = symmetry / count;
      return isNaN(result) || !isFinite(result) ? 0 : result;
    } catch (error) {
      console.warn("Error calculating symmetry:", error.message);
      return 0;
    }
  }

  /**
   * Calculate color harmony using simple RGB distance
   * @param {Object} img - Sharp image object
   * @returns {Promise<number>} Color harmony score
   */
  async calculateColorHarmony(img) {
    let dominantColors = [];
    try {
      dominantColors = await this.extractDominantColors(img);
    } catch (error) {
      return 0;
    }

    if (!dominantColors || dominantColors.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < dominantColors.length; i++) {
      for (let j = i + 1; j < dominantColors.length; j++) {
        const distance = this.hexColorDistance(
          dominantColors[i],
          dominantColors[j]
        );
        totalDistance += distance;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  /**
   * Calculate distance between two hex colors
   * @param {string} hex1 - First hex color
   * @param {string} hex2 - Second hex color
   * @returns {number} Distance
   */
  hexColorDistance(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);

    if (!rgb1 || !rgb2) return 0;

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color string
   * @returns {Object|null} RGB object or null if invalid
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Calculate overall brightness
   * @param {Array} channels - Sharp channel statistics
   * @returns {number} Brightness score
   */
  calculateBrightness(channels) {
    if (channels.length < 3) return 0;

    return (
      (channels[0].mean * 0.2126 +
        channels[1].mean * 0.7152 +
        channels[2].mean * 0.0722) /
      255
    );
  }

  /**
   * Run quality gates on features
   * @param {Object} features - Extracted features
   * @param {number} renderTime - Render time in ms
   * @returns {Object} Gate results
   */
  runQualityGates(features, renderTime) {
    const gates = {
      notBlank: features.blankRatio > 0.05,
      hasContrast: features.contrast > 0.12,
      notPureNoise: features.edgeDensity >= 0.02 && features.edgeDensity <= 0.4,
      renderTimeOK: renderTime < 500,
      hasPalette: features.dominantColors && features.dominantColors.length >= 3,
      reasonableBrightness:
        features.brightness > 0.1 && features.brightness < 0.9,
      hasSymmetry: features.symmetry > 0.03, // Lowered threshold for organic/flowing patterns
      hasHarmony: features.colorHarmony > 10,
    };

    gates.allPassed = Object.values(gates).every((gate) => gate === true);

    return gates;
  }

  /**
   * Get human-readable gate summary
   * @param {Object} gates - Gate results
   * @returns {string} Summary message
   */
  getGateSummary(gates) {
    const failed = Object.entries(gates)
      .filter(([key, passed]) => key !== "allPassed" && !passed)
      .map(([key]) => key);

    if (failed.length === 0) {
      return "✅ All quality gates passed";
    }

    return `❌ Failed gates: ${failed.join(", ")}`;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node evaluateTemplate.js <template-file.js>");
    process.exit(1);
  }

  const filePath = args[0];
  const templateCode = fs.readFileSync(filePath, "utf8");

  const evaluator = new TemplateEvaluator();
  evaluator
    .evaluateTemplate(templateCode)
    .then((result) => {
      console.log("🎨 Evaluation Results:");
      console.log(`Render Time: ${result.renderTime.toFixed(2)}ms`);
      console.log(`Features:`, JSON.stringify(result.features, null, 2));
      console.log(evaluator.getGateSummary(result.gates));
    })
    .catch((error) => {
      console.error("Error evaluating template:", error.message);
      process.exit(1);
    });
}

module.exports = TemplateEvaluator;
