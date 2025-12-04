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
    this.screenshotsDir = path.join(__dirname, "../output/thumbnails");
    this.publicThumbsDir = path.join(__dirname, "../public/thumbnails");
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
   * Capture screenshot from a P5.js sketch file
   * @param {string} sketchPath - Path to the sketch .js file
   * @param {string} outputFileName - Output filename (without extension)
   * @param {string} outputDir - Directory to save the screenshot
   * @returns {Promise<Buffer>} Image buffer
   */
  async captureSketch(sketchPath, outputFileName, outputDir) {
    console.log(`Capturing screenshot from sketch: ${sketchPath}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1200 });

      // Read sketch code
      let sketchCode = fs.readFileSync(sketchPath, "utf8");
      let isModule = false;

      // Handle ES modules if present
      if (sketchCode.includes("export default")) {
        // Replace "export default" with "const sketch ="
        sketchCode = sketchCode.replace(
          /export\s+default\s+/,
          "const sketch = "
        );
        isModule = true;
      }

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
  <style>body { margin: 0; padding: 0; overflow: hidden; background: #000; } canvas { display: block; }</style>
</head>
<body>
  <script>
    ${sketchCode}
    
    // Adapter for the object-style sketch
    if (typeof sketch !== 'undefined') {
       new p5((p) => {
          if (sketch.setup) {
             p.setup = () => {
                p.createCanvas(1200, 1200);
                sketch.setup(p);
             };
          }
          if (sketch.draw) p.draw = () => sketch.draw(p);
       });
    }
  </script>
</body>
</html>`;

      await page.setContent(html);

      // Wait for canvas
      try {
        await page.waitForSelector("canvas", { timeout: 5000 });
      } catch (e) {
        console.warn("Canvas not found quickly, waiting fixed delay...");
      }

      // Wait a bit for render
      await new Promise((r) => setTimeout(r, 2000));

      const outputPath = path.join(outputDir, `${outputFileName}.png`);
      await page.screenshot({ path: outputPath });

      return fs.readFileSync(outputPath);
    } finally {
      await browser.close();
    }
  }

  /**
   * Capture screenshot from config using runtime template (parameter-based approach)
   * @param {string} template - Template name (e.g., "flowField")
   * @param {Object} config - Configuration object
   * @param {string} outputFileName - Output filename (without extension)
   * @param {number} captureFrame - Frame number to capture (default: 180 for ~3 seconds at 60fps)
   * @param {number} resolution - Canvas resolution (default: 2400 for full-size)
   * @returns {Promise<Buffer>} Image buffer
   */
  async captureFromConfig(
    template,
    config,
    outputFileName,
    captureFrame = 180,
    resolution = 2400
  ) {
    console.log(
      `Capturing screenshot from config for template: ${template} (${resolution}x${resolution})`
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: resolution, height: resolution });

      // Generate HTML from config using runtime template
      const html = this.generateHTMLFromConfig(
        template,
        config,
        captureFrame,
        resolution
      );
      await page.setContent(html);

      // Wait for p5.js to load and render to the specific frame
      await page.evaluate((frame) => {
        return new Promise((resolve) => {
          let attempts = 0;
          const checkFrame = () => {
            if (window.p5Instance && window.p5Instance.frameCount >= frame) {
              resolve();
            } else {
              attempts++;
              if (attempts < 1000) {
                setTimeout(checkFrame, 10);
              } else {
                resolve(); // Timeout after 10 seconds
              }
            }
          };
          checkFrame();
        });
      }, captureFrame);

      // Take screenshot
      const outputPath = path.join(
        this.screenshotsDir,
        `${outputFileName}.png`
      );
      await page.screenshot({
        path: outputPath,
        type: "png",
      });

      console.log(`Screenshot saved to: ${outputPath}`);

      // Also copy to public thumbnails
      try {
        const publicThumbPath = path.join(
          this.publicThumbsDir,
          `${outputFileName}.png`
        );
        fs.copyFileSync(outputPath, publicThumbPath);
        console.log(`Public thumbnail updated: ${publicThumbPath}`);
      } catch (copyErr) {
        console.warn("Warning: failed to copy thumbnail to public/:", copyErr);
      }

      const buffer = fs.readFileSync(outputPath);
      return buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Inline ES module imports by reading and embedding module files
   * @param {string} code - Template code with imports
   * @param {string} templatePath - Path to the template file
   * @returns {string} Code with imports inlined
   */
  inlineModuleImports(code, templatePath) {
    const templateDir = path.dirname(templatePath);
    const processedFiles = new Set();
    const moduleExports = {};

    // Find all import statements (including export * from)
    // This regex matches both "import ... from" and "export * from"
    const importRegex =
      /(?:import|export)\s+(?:\*\s+from\s+)?(?:[^'"]*from\s+)?['"](.+?)['"];?/gs;
    let match;
    const imports = [];
    const importStatements = [];

    // Collect all import statements
    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];
      if (
        importPath &&
        (importPath.startsWith("./modules/") || importPath.startsWith("./"))
      ) {
        // Handle both './modules/index.js' and './modules/positioning.js'
        let modulePath = importPath;
        if (!modulePath.endsWith(".js")) {
          modulePath = modulePath + ".js";
        }

        // Resolve path relative to templateDir
        let fullPath;
        if (path.isAbsolute(modulePath)) {
          fullPath = modulePath;
        } else {
          fullPath = path.join(templateDir, modulePath);
        }

        if (fs.existsSync(fullPath)) {
          // Avoid duplicates
          if (!imports.find((imp) => imp.fullPath === fullPath)) {
            imports.push({
              statement: match[0],
              path: importPath,
              fullPath: fullPath,
            });
          }
          importStatements.push(match[0]);
        } else {
          console.warn(`⚠️  Module file not found: ${fullPath}`);
        }
      }
    }

    // Read and inline each module file (only once per file)
    imports.forEach((imp) => {
      if (!processedFiles.has(imp.fullPath)) {
        processedFiles.add(imp.fullPath);
        let moduleCode = fs.readFileSync(imp.fullPath, "utf8");

        // Recursively inline imports in module files (THIS IS THE KEY FIX)
        moduleCode = this.inlineModuleImports(moduleCode, imp.fullPath);

        // Remove export keywords and convert to regular functions/constants
        moduleCode = moduleCode.replace(
          /export\s+function\s+(\w+)/g,
          "function $1"
        );
        moduleCode = moduleCode.replace(/export\s+const\s+(\w+)/g, "const $1");
        moduleCode = moduleCode.replace(/export\s+default\s+/g, "");
        // Handle export * from statements (they should be handled by recursive inlining)
        moduleCode = moduleCode.replace(
          /export\s+\*\s+from\s+['"].+?['"];?/g,
          ""
        );
        moduleCode = moduleCode.replace(
          /export\s*\{([^}]+)\}/g,
          (match, exports) => {
            // Handle named exports like export { func1, func2 }
            return exports
              .split(",")
              .map((e) => e.trim())
              .join("\n");
          }
        );

        // Store the module code
        const moduleName = path.basename(imp.fullPath, ".js");
        moduleExports[moduleName] = moduleCode;
      }
    });

    // Remove all import statements from the code
    let inlinedCode = code;
    importStatements.forEach((stmt) => {
      // Remove the import statement, handling multi-line imports
      // Escape special regex characters in the statement
      const escaped = stmt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      inlinedCode = inlinedCode.replace(new RegExp(escaped, "gs"), "");
    });

    // Prepend all module code before the main template code
    const allModulesCode = Object.values(moduleExports).join("\n\n");
    const result = allModulesCode + "\n\n" + inlinedCode;

    // Debug: log if modules were found
    if (Object.keys(moduleExports).length === 0) {
      console.warn("⚠️  Warning: No modules were inlined for modular runtime!");
    } else {
      console.log(
        `✓ Inlined ${
          Object.keys(moduleExports).length
        } module(s): ${Object.keys(moduleExports).join(", ")}`
      );
    }

    return result;
  }

  /**
   * Generate HTML from config using runtime template
   * @param {string} template - Template name
   * @param {Object} config - Configuration object
   * @param {number} captureFrame - Frame to capture at
   * @param {number} resolution - Canvas resolution
   * @returns {string} HTML content
   */
  generateHTMLFromConfig(
    template,
    config,
    captureFrame = 180,
    resolution = 2400
  ) {
    // All templates now use pipeline runtime
    const templateFileName = "pipelineRuntime";

    // Try multiple potential locations for the template
    const possiblePaths = [
      path.join(__dirname, "../../src/templates", `${templateFileName}.js`),
      path.join(__dirname, "../src/templates", `${templateFileName}.js`), // Adjusted for services/ location
      path.join(
        __dirname,
        "../../src/templates/legacy",
        `${templateFileName}.js`
      ),
      path.join(__dirname, "../src/templates/legacy", `${templateFileName}.js`),
    ];

    let templatePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatePath = p;
        break;
      }
    }

    if (!templatePath) {
      throw new Error(
        `Runtime template not found: ${templateFileName}.js (checked ${possiblePaths.length} locations)`
      );
    }

    // Read and process the runtime template code
    let templateCode = fs.readFileSync(templatePath, "utf8");

    // pipelineRuntime.js doesn't have ES module imports, so no inlining needed
    // Remove ES module export and convert to function that can be called
    // Replace "export default function" with "function"
    templateCode = templateCode.replace(
      /export\s+default\s+function\s+(\w+)/,
      "function $1"
    );

    const configJson = JSON.stringify(config, null, 2);

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
  <script>
    // Inline runtime template
    ${templateCode}
    
    // Get sketch from config
    const config = ${configJson};
    const sketch = generatedSketchFromConfig(config);
    
    window.p5Instance = new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(${resolution}, ${resolution});
        if (sketch.setup) sketch.setup(p5);
      };
      
      if (sketch.draw) {
        p5.draw = () => {
          sketch.draw(p5);
          // Stop at capture frame for consistent screenshots
          if (p5.frameCount >= ${captureFrame}) {
            p5.noLoop();
          }
        };
      } else {
        // If no draw function, call setup and then stop
        p5.draw = () => {
          p5.noLoop();
        };
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
