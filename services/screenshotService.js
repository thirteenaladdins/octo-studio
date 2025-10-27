#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Screenshot Service
 * Captures artwork images using Puppeteer
 */
class ScreenshotService {
  constructor() {
    this.screenshotsDir = path.join(__dirname, "../../screenshots");
    this.publicThumbsDir = path.join(__dirname, "../../public/thumbnails");
    this.ensureScreenshotsDir();
  }

  /**
   * Ensure screenshots directory exists
   */
  ensureScreenshotsDir() {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(this.publicThumbsDir)) {
      fs.mkdirSync(this.publicThumbsDir, { recursive: true });
    }
  }

  /**
   * Capture a screenshot of a P5.js sketch
   * @param {string} sketchFilePath - Path to the sketch file
   * @param {string} outputFileName - Output filename (without extension)
   * @param {string} outputDir - Optional custom output directory
   * @returns {Promise<Buffer>} Image buffer
   */
  async captureSketch(sketchFilePath, outputFileName, outputDir = null) {
    console.log(`Capturing screenshot for: ${sketchFilePath}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1200 });

      // Create a simple HTML page to run the sketch
      const html = this.generateHTML(sketchFilePath);
      await page.setContent(html);

      // Wait for p5.js to load and render
      // Use a generic delay to support multiple Puppeteer versions
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Take screenshot
      const finalOutputDir = outputDir || this.screenshotsDir;
      if (!fs.existsSync(finalOutputDir)) {
        fs.mkdirSync(finalOutputDir, { recursive: true });
      }

      const outputPath = path.join(finalOutputDir, `${outputFileName}.png`);
      await page.screenshot({
        path: outputPath,
        type: "png",
      });

      console.log(`Screenshot saved to: ${outputPath}`);

      // Read the file as buffer for Twitter upload
      const buffer = fs.readFileSync(outputPath);
      return buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML to render the P5.js sketch
   * @param {string} sketchFilePath - Path to sketch file
   * @returns {string} HTML content
   */
  generateHTML(sketchFilePath) {
    const sketchCode = fs.readFileSync(sketchFilePath, "utf8");

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
      background: #050512;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <script type="module">
    ${sketchCode}
    
    // Get the sketch object
    const sketch = generatedSketch || window.generatedSketch;
    
    new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(1200, 1200);
        if (sketch.setup) sketch.setup(p5);
      };
      
      if (sketch.draw) {
        p5.draw = () => sketch.draw(p5);
      }
      
      if (sketch.mousePressed) {
        p5.mousePressed = () => sketch.mousePressed(p5);
      }
      
      if (sketch.keyPressed) {
        p5.keyPressed = () => sketch.keyPressed(p5);
      }
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * Clean up old screenshots
   * @param {number} daysToKeep - Keep screenshots from last N days
   */
  cleanupOldScreenshots(daysToKeep = 7) {
    const files = fs.readdirSync(this.screenshotsDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(this.screenshotsDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old screenshot: ${file}`);
      }
    });
  }
}

module.exports = ScreenshotService;
