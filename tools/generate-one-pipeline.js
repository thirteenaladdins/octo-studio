#!/usr/bin/env node

/**
 * Generate One Artwork (Pipeline System)
 * Generates a single artwork using the function-based pipeline system
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const ScreenshotService = require("../services/screenshotService");
const {
  createRandomGenome,
  generateRandomPalette,
} = require("../scripts/evolution/genetics");
const { createInitialState } = require("../src/pipeline/state");
const { executePipeline } = require("../src/pipeline/pipeline");
const { buildPipeline } = require("../src/pipeline/builder");

const rootDir = path.join(__dirname, "..");
const feedbackPath = path.join(rootDir, "feedback", "artworks.json");

// Ensure feedback directory exists
const feedbackDir = path.join(rootDir, "feedback");
if (!fs.existsSync(feedbackDir)) {
  fs.mkdirSync(feedbackDir, { recursive: true });
}

// Ensure output directory exists
const outputDir = path.join(rootDir, "output", "images");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateRandomModularConfig(seed) {
  // Create random module combination from genetics
  const genome = createRandomGenome();

  // Generate random palette
  const palette = generateRandomPalette();

  // Random parameters
  const rng = (() => {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  })();

  // Map genetics modules to pipeline modules
  // Map genetics module names to pipeline module names
  const positioningMap = {
    grid: "grid",
    offsetGrid: "offsetGrid",
    spiral: "spiral",
    flowGrid: "flowGrid",
    random: "random",
  };

  const sizingMap = {
    noise: "noise",
    constant: "constant",
    distance: "distance",
    pulse: "pulse",
  };

  const coloringMap = {
    time: "time",
    palette: "palette",
    gradient: "gradient",
    noise: "noise", // Maps to noiseColor module in registry
    index: "index",
  };

  const transformationMap = {
    none: "none",
    jitter: "jitter",
    noiseOffset: "noiseOffset",
  };

  const pipelineModules = {
    // Map positioning (required)
    positioning: positioningMap[genome.positioning] || "grid",

    // Map sizing
    sizing: sizingMap[genome.sizing] || "constant",

    // Map coloring
    coloring: coloringMap[genome.coloring] || "palette",

    // Map transformation (can be null if 'none')
    transformation:
      genome.transform === "none"
        ? null
        : transformationMap[genome.transform] || "wave",

    // Rendering: genetics has shape, flowCurve, circle, rect, triangle, line, cross
    // Pipeline has 'shape'. The actual shape comes from config.shape
    rendering: "shape",
  };

  // Map rendering module selection to config.shape
  // If genetics selected a specific shape (circle, rect, triangle, etc.), use it
  const shapeMap = {
    circle: "circle",
    rect: "rect",
    rectangle: "rect",
    square: "rect",
    triangle: "triangle",
    line: "line",
    cross: "cross",
    shape: "circle", // Default for 'shape'
    flowCurve: "circle", // Default for 'flowCurve' (could be enhanced later)
  };
  const selectedShape = shapeMap[genome.rendering] || "circle";

  // Generate config for modular system
  const config = {
    seed: seed % 2147483647,
    width: 2400,
    height: 2400,
    gridSize: Math.floor(rng() * 15 + 10), // 10-25
    speed: rng() * 0.02 + 0.005, // 0.005-0.025
    shape: selectedShape, // Use shape from genetics rendering selection
    palette: palette,
    background: `#${Math.floor(rng() * 0xffffff)
      .toString(16)
      .padStart(6, "0")}`,
    modules: pipelineModules,
    // Store original genome for reference
    _genome: genome,
  };

  return config;
}

async function generateOne() {
  console.log("🎨 Generating One Artwork (Pipeline System)\n");
  console.log("=".repeat(60));

  try {
    const screenshotService = new ScreenshotService();

    // Generate seed
    const seed = Date.now();
    console.log(`\n🌱 Seed: ${seed}`);

    // Generate modular config
    console.log("\n🧬 Generating modular configuration...");
    const config = generateRandomModularConfig(seed);

    console.log("\n📋 Configuration:");
    console.log(`   Grid Size: ${config.gridSize}`);
    console.log(`   Speed: ${config.speed.toFixed(3)}`);
    console.log(`   Shape: ${config.shape}`);
    console.log(`   Background: ${config.background}`);
    console.log(`   Palette: ${config.palette.join(", ")}`);

    // Show genetics genome selection
    if (config._genome) {
      console.log("\n🧬 Genetics Genome Selection:");
      Object.entries(config._genome).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }

    console.log("\n🔧 Pipeline Modules:");
    Object.entries(config.modules).forEach(([key, value]) => {
      if (value !== null) {
        console.log(`   ${key}: ${value}`);
      } else {
        console.log(`   ${key}: (skipped)`);
      }
    });

    // Build pipeline from modules
    console.log("\n🔨 Building pipeline...");
    let pipeline;
    try {
      pipeline = buildPipeline(config.modules);
      console.log(`   ✅ Pipeline built with ${pipeline.length} module(s)`);
      pipeline.forEach((fn, i) => {
        console.log(`      ${i + 1}. ${fn.name || "anonymous"}`);
      });
    } catch (error) {
      console.error(`   ❌ Pipeline build failed: ${error.message}`);
      throw error;
    }

    // Create initial state
    console.log("\n📦 Creating initial state...");
    const initialState = createInitialState(config);
    console.log(
      `   ✅ State created (${initialState.width}x${initialState.height})`
    );

    // Execute pipeline
    console.log("\n⚙️  Executing pipeline...");
    const finalState = executePipeline(pipeline, initialState);
    console.log(`   ✅ Pipeline executed`);
    console.log(`   📊 Elements created: ${finalState.elements.length}`);

    // Generate unique ID
    const timestamp = Date.now();
    const artworkId = `pipeline_${timestamp}`;
    const fileName = artworkId;

    // Embed state in config for pipeline runtime
    const configWithState = {
      ...config,
      _pipelineState: finalState, // Embed the final state
    };

    // Render artwork using ScreenshotService with pipeline runtime
    console.log("\n📸 Rendering artwork...");
    const imageBuffer = await screenshotService.captureFromConfig(
      "pipeline", // Use pipeline template
      configWithState,
      fileName,
      1, // Capture at frame 1 (static)
      config.width
    );

    // Save image locally
    const outputPath = path.join(outputDir, `${fileName}.png`);
    console.log(`   ✅ Saved: ${outputPath}`);

    // Create artwork entry with full config
    const artwork = {
      id: artworkId,
      timestamp: new Date().toISOString(),
      title: `Pipeline ${artworkId.split("_")[1]}`,
      description: `Pipeline artwork with ${config.modules.positioning} positioning, ${config.modules.coloring} coloring`,
      template: "pipeline",
      seed: config.seed,
      config: config, // Full config including modules
      pipeline: pipeline.map((fn) => fn.name || "anonymous"), // Store pipeline function names
      imagePath: outputPath,
      // Feedback fields (initially empty)
      rating: null,
      comment: null,
      likedAspects: [],
      ratedAt: null,
    };

    // Load existing feedback
    let feedbackData = { artworks: [] };
    if (fs.existsSync(feedbackPath)) {
      feedbackData = JSON.parse(fs.readFileSync(feedbackPath, "utf8"));
    }

    // Add new artwork
    feedbackData.artworks.push(artwork);

    // Save feedback
    fs.writeFileSync(feedbackPath, JSON.stringify(feedbackData, null, 2));
    console.log(`\n✅ Artwork saved to: ${feedbackPath}`);
    console.log(`\n📊 Next steps:`);
    console.log(`   1. View the image: ${outputPath}`);
    console.log(`   2. Rate it: node tools/rate-artwork.js ${artworkId}`);
    console.log(`   3. Or edit feedback/artworks.json directly`);
    console.log(`\n💡 Pipeline executed:`);
    pipeline.forEach((fn, i) => {
      console.log(`   ${i + 1}. ${fn.name || "anonymous"}`);
    });

    return artwork;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateOne();
