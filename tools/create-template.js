#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const DSLValidator = require("../dsl/validator");
const DSLTranspiler = require("../dsl/transpile");
const TemplateEvaluator = require("./evaluateTemplate");

/**
 * Create Template CLI
 * Main orchestration tool for LLM-driven template generation
 */
class CreateTemplateCLI {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.validator = new DSLValidator();
    this.transpiler = new DSLTranspiler();
    this.evaluator = new TemplateEvaluator();
    this.outputDir = path.join(__dirname, "../templates/generated");
    this.maxRepairAttempts = 2;

    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Main CLI entry point
   * @param {Object} options - CLI options
   */
  async run(options) {
    const { name, prompt, avoidRecent = [] } = options;

    console.log("🎨 LLM-Driven Template Generation");
    console.log("=".repeat(50));
    console.log(`Template: ${name}`);
    console.log(`Prompt: ${prompt}`);
    console.log("=".repeat(50));

    let attempt = 0;
    let dsl = null;
    let repairFeedback = null;
    let lastEvaluation = null;

    while (attempt <= this.maxRepairAttempts) {
      try {
        console.log(
          `\n🔄 Attempt ${attempt + 1}/${this.maxRepairAttempts + 1}`
        );

        // Step 1: Generate DSL with LLM
        console.log("🤖 Generating DSL with OpenAI...");
        dsl = await this.generateDSL(prompt, avoidRecent, repairFeedback);

        // Step 2: Validate DSL
        console.log("✅ Validating DSL...");
        const validation = this.validator.validateDSL(dsl);
        if (!validation.success) {
          throw new Error(
            `DSL validation failed:\n${this.validator.getErrorSummary(
              validation.errors
            )}`
          );
        }

        // Step 3: Transpile to p5.js
        console.log("🔨 Transpiling DSL to p5.js...");
        const templateCode = this.transpiler.transpile(dsl);

        // Step 4: Evaluate template
        console.log("🎯 Evaluating template...");
        const evaluation = await this.evaluator.evaluateTemplate(templateCode);
        lastEvaluation = evaluation;

        // Step 5: Check quality gates
        console.log("🚪 Running quality gates...");
        if (evaluation.gates.allPassed) {
          console.log("✅ All quality gates passed!");

          // Step 6: Save successful template
          await this.saveTemplate(dsl, templateCode, evaluation);
          console.log("\n🎉 Template created successfully!");
          return;
        } else {
          console.log("❌ Quality gates failed:");
          console.log(this.evaluator.getGateSummary(evaluation.gates));

          // Generate repair feedback
          repairFeedback = this.generateRepairFeedback(dsl, evaluation);
          console.log("\n🔧 Repair feedback:");
          console.log(repairFeedback);

          attempt++;
        }
      } catch (error) {
        console.error(`❌ Error in attempt ${attempt + 1}:`, error.message);

        if (attempt >= this.maxRepairAttempts) {
          throw new Error(
            `Max repair attempts reached. Template generation failed. Last error: ${error.message}`
          );
        }

        repairFeedback = `Error: ${error.message}. Please fix the DSL structure and try again.`;
        attempt++;
      }
    }

    // If we get here, all attempts exhausted without success
    const failedGates = lastEvaluation 
      ? Object.entries(lastEvaluation.gates)
          .filter(([key, passed]) => key !== "allPassed" && !passed)
          .map(([key]) => key)
      : ["unknown"];
    
    throw new Error(
      `Template generation failed after ${this.maxRepairAttempts + 1} attempts. ` +
      `Failed quality gates: ${failedGates.join(", ")}. ` +
      `Consider adjusting the prompt or quality gate thresholds.`
    );
  }

  /**
   * Generate DSL using OpenAI
   * @param {string} prompt - User prompt
   * @param {Array} avoidRecent - Recent templates to avoid
   * @param {string} repairFeedback - Repair feedback from previous attempt
   * @returns {Promise<Object>} Generated DSL
   */
  async generateDSL(prompt, avoidRecent, repairFeedback) {
    const systemPrompt = fs.readFileSync(
      path.join(__dirname, "../prompts/dsl-template.txt"),
      "utf8"
    );

    let userPrompt = `Create a generative art template: ${prompt}`;

    if (avoidRecent.length > 0) {
      userPrompt += `\n\nAvoid concepts similar to:\n${avoidRecent
        .map((a) => `- ${a}`)
        .join("\n")}`;
    }

    if (repairFeedback) {
      userPrompt += `\n\nIMPORTANT: Previous attempt failed quality gates. Apply these specific fixes:\n${repairFeedback}\n\nMake the exact changes suggested above. Update the DSL JSON with corrected values.`;
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      presence_penalty: 0.6,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Extract template from response (handle different response formats)
    if (parsed.template) {
      return parsed.template;
    } else if (parsed.id) {
      return parsed;
    } else {
      throw new Error("Invalid DSL response format");
    }
  }

  /**
   * Update templates manifest for auto-discovery
   * @param {Object} templateInfo - Template information
   */
  updateTemplatesManifest(templateInfo) {
    const manifestPath = path.join(this.outputDir, 'templates-manifest.json');
    let manifest = [];
    
    // Load existing manifest if it exists
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (e) {
        console.warn('Could not read existing manifest, creating new one');
        manifest = [];
      }
    }
    
    // Check if template already exists (by path)
    const existingIndex = manifest.findIndex(t => t.path === templateInfo.path);
    if (existingIndex >= 0) {
      // Update existing entry
      manifest[existingIndex] = templateInfo;
    } else {
      // Add new entry
      manifest.push(templateInfo);
    }
    
    // Sort by timestamp (newest first)
    manifest.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Save manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  /**
   * Generate repair feedback based on evaluation results
   * @param {Object} dsl - Original DSL
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Repair feedback
   */
  generateRepairFeedback(dsl, evaluation) {
    const { features, gates, renderTime } = evaluation;
    const feedback = [];

    // Render time issues
    if (!gates.renderTimeOK) {
      feedback.push(
        `Render time too slow (${renderTime.toFixed(
          0
        )}ms > 500ms). Reduce particle counts or loop iterations.`
      );
    }

    // Blank image
    if (!gates.notBlank) {
      feedback.push(
        `Image is too blank (${(features.blankRatio * 100).toFixed(
          1
        )}% non-background pixels). Increase stroke alpha or add more elements.`
      );
    }

    // Low contrast
    if (!gates.hasContrast) {
      const currentContrast = features.contrast.toFixed(3);
      feedback.push(
        `Low contrast (${currentContrast} < 0.12). Make specific DSL changes: ` +
        `(1) Use higher saturation colors in palette (aim for 60-100 saturation), ` +
        `(2) Increase strokeAlpha to 50-70, ` +
        `(3) Use wider stroke weights (widthJitter: [2, 6] or higher), ` +
        `(4) Ensure palette has high contrast between colors.`
      );
      
      // Specific suggestions based on current DSL
      if (dsl.palette && dsl.palette.length > 0) {
        feedback.push(`Current palette may be too desaturated. Replace with more vibrant colors.`);
      }
      if (dsl.layers) {
        dsl.layers.forEach((layer, i) => {
          if (layer.strokeAlpha && layer.strokeAlpha < 50) {
            feedback.push(`Layer ${i + 1} strokeAlpha (${layer.strokeAlpha}) is too low. Set to 50-70.`);
          }
        });
      }
    }

    // Pure noise
    if (!gates.notPureNoise) {
      if (features.edgeDensity > 0.4) {
        feedback.push(
          `Too much noise/chaos (edge density: ${features.edgeDensity.toFixed(
            3
          )}). Reduce grain or noise overlay.`
        );
      } else {
        feedback.push(
          `Too little structure (edge density: ${features.edgeDensity.toFixed(
            3
          )}). Add more defined patterns.`
        );
      }
    }

    // Brightness issues
    if (!gates.reasonableBrightness) {
      const currentBrightness = features.brightness.toFixed(3);
      if (features.brightness < 0.1) {
        feedback.push(
          `Too dark (brightness: ${currentBrightness} < 0.1). Make specific DSL changes: ` +
          `(1) Use lighter background color (canvas.bg should be brighter, e.g., #2a2a3e or lighter), ` +
          `(2) Increase strokeAlpha to 50-70, ` +
          `(3) Use brighter palette colors (avoid very dark colors).`
        );
        
        if (dsl.canvas && dsl.canvas.bg) {
          feedback.push(`Current background (${dsl.canvas.bg}) is too dark. Change to a lighter shade.`);
        }
      } else {
        feedback.push(
          `Too bright (brightness: ${currentBrightness} > 0.9). Make specific DSL changes: ` +
          `(1) Use darker background color (canvas.bg should be darker, e.g., #0a0a0f to #1a1a2e), ` +
          `(2) Reduce strokeAlpha to 25-40, ` +
          `(3) Use darker palette colors, ` +
          `(4) Ensure background is significantly darker than foreground colors.`
        );
        
        if (dsl.canvas && dsl.canvas.bg) {
          feedback.push(`Current background (${dsl.canvas.bg}) is too bright. Change to a darker shade like #0f0f1f or #1a1a2e.`);
        }
        if (dsl.layers) {
          dsl.layers.forEach((layer, i) => {
            if (layer.strokeAlpha && layer.strokeAlpha > 50) {
              feedback.push(`Layer ${i + 1} strokeAlpha (${layer.strokeAlpha}) is too high. Set to 25-40.`);
            }
          });
        }
      }
    }

    // Symmetry issues
    if (!gates.hasSymmetry) {
      const symmetryValue = isNaN(features.symmetry) || !isFinite(features.symmetry) 
        ? 0 
        : features.symmetry;
      feedback.push(
        `Symmetry too low (${symmetryValue.toFixed(
          3
        )} < 0.03). Add subtle horizontal mirroring, radial elements, or centered patterns to increase symmetry score while maintaining organic flow.`
      );
    }

    // Specific parameter suggestions
    if (dsl.layers) {
      dsl.layers.forEach((layer, i) => {
        if (layer.type === "flowField" && layer.count > 600) {
          feedback.push(
            `Reduce flowField count from ${layer.count} to ${Math.floor(
              layer.count * 0.7
            )}.`
          );
        }
        if (layer.type === "orbitals" && layer.count > 300) {
          feedback.push(
            `Reduce orbitals count from ${layer.count} to ${Math.floor(
              layer.count * 0.8
            )}.`
          );
        }
        if (layer.strokeAlpha && layer.strokeAlpha < 20) {
          feedback.push(
            `Increase strokeAlpha from ${layer.strokeAlpha} to ${Math.min(
              layer.strokeAlpha * 2,
              60
            )}.`
          );
        }
      });
    }

    return feedback.length > 0
      ? feedback.join(" ")
      : "General improvement needed - try different layer combinations or parameters.";
  }

  /**
   * Save successful template and metadata
   * @param {Object} dsl - DSL JSON
   * @param {string} templateCode - Generated template code
   * @param {Object} evaluation - Evaluation results
   */
  async saveTemplate(dsl, templateCode, evaluation) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `${dsl.id}-${timestamp}`;

    // Save template code
    const templatePath = path.join(this.outputDir, `${baseName}.js`);
    fs.writeFileSync(templatePath, templateCode, "utf8");

    // Save DSL JSON
    const dslPath = path.join(this.outputDir, `${baseName}.dsl.json`);
    fs.writeFileSync(dslPath, JSON.stringify(dsl, null, 2), "utf8");

    // Save metadata
    const metadata = {
      dsl: dsl,
      claims: dsl.claims,
      measured: evaluation.features,
      gates: evaluation.gates,
      renderTime: evaluation.renderTime,
      seed: evaluation.seed,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    const metaPath = path.join(this.outputDir, `${baseName}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf8");

    // Save screenshot
    const screenshotPath = path.join(this.outputDir, `${baseName}.png`);
    fs.writeFileSync(screenshotPath, evaluation.imageBuffer);

    // Update templates manifest for auto-discovery
    this.updateTemplatesManifest({
      path: `templates/generated/${baseName}.js`,
      name: dsl.id,
      description: dsl.description,
      timestamp: new Date().toISOString()
    });

    console.log(`\n📁 Files saved:`);
    console.log(`   Template: ${templatePath}`);
    console.log(`   DSL: ${dslPath}`);
    console.log(`   Metadata: ${metaPath}`);
    console.log(`   Screenshot: ${screenshotPath}`);

    // Print summary
    console.log(`\n📊 Template Summary:`);
    console.log(`   ID: ${dsl.id}`);
    console.log(`   Description: ${dsl.description}`);
    console.log(`   Render Time: ${evaluation.renderTime.toFixed(2)}ms`);
      console.log(
        `   Dominant Colors: ${evaluation.features.dominantColors?.length || 0}`
      );
    console.log(`   Symmetry: ${evaluation.features.symmetry.toFixed(3)}`);
    console.log(`   Contrast: ${evaluation.features.contrast.toFixed(3)}`);
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--name" && i + 1 < args.length) {
      options.name = args[i + 1];
      i++;
    } else if (arg === "--prompt" && i + 1 < args.length) {
      options.prompt = args[i + 1];
      i++;
    } else if (arg === "--avoid" && i + 1 < args.length) {
      options.avoidRecent = args[i + 1].split(",");
      i++;
    } else if (arg === "--help") {
      console.log(`
Usage: node create-template.js --name <name> --prompt <description> [options]

Options:
  --name <name>        Template identifier (kebab-case)
  --prompt <desc>      Description of the desired visual pattern
  --avoid <list>       Comma-separated list of recent concepts to avoid
  --help              Show this help message

Examples:
  node create-template.js --name "vortex-field" --prompt "Swirling flow with central attractor, teal/amber palette, low symmetry"
  node create-template.js --name "organic-waves" --prompt "Flowing organic patterns with high contrast, purple/green colors"
      `);
      process.exit(0);
    }
  }

  if (!options.name || !options.prompt) {
    console.error("Error: --name and --prompt are required");
    console.error("Use --help for usage information");
    process.exit(1);
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();

  const cli = new CreateTemplateCLI();
  cli
    .run(options)
    .then(() => {
      console.log("\n✅ Template generation completed successfully!");
    })
    .catch((error) => {
      console.error("\n❌ Template generation failed:", error.message);
      process.exit(1);
    });
}

module.exports = CreateTemplateCLI;
