#!/usr/bin/env node

/**
 * Generate Artwork 080 using Pipeline System
 * Creates "Signal 080: Ripples of Serenity" using the pipeline system
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const ScreenshotService = require("../services/screenshotService");
const { createInitialState } = require("../src/pipeline/state");
const { executePipeline } = require("../src/pipeline/pipeline");
const { buildPipeline } = require("../src/pipeline/builder");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "output", "images");
const thumbnailsDir = path.join(rootDir, "output", "thumbnails");
const artworksDir = path.join(rootDir, "artworks");

// Ensure directories exist
[outputDir, thumbnailsDir, artworksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Artwork 080 configuration
const artworkConfig = {
  id: "080",
  title: "Signal 080: Ripples of Serenity",
  description: "A captivating canvas where soft undulating lines create a serene interaction of color and movement, inviting calm reflection.",
  date: "2025-11-23",
  tags: [
    "generative",
    "ai-generated",
    "grid-pattern",
    "harmonious",
    "tranquility",
    "line"
  ],
  file: "080_ai_signal",
  thumbnail: "080_ai_signal_thumb",
  category: "generative",
  status: "published",
  displayMode: "image",
  template: "gridPattern",
  colors: ["#2980b9", "#f39c12", "#e74c3c", "#2ecc71"],
  movement: "gentle oscillations that shift in rhythmic patterns",
  density: 65,
  mood: "harmonious tranquility",
  seed: 851642383,
  config: {
    seed: 5,
    gridSize: 55,
    speed: 0.003,
    fade: 0.609,
    jitter: 0.08,
    shape: "rect",
    background: "#1f1f24",
    palette: ["#06d6a0", "#ffd166", "#ef476f", "#118ab2"],
    template: "gridPattern"
  }
};

async function generateArtwork080() {
  console.log("🎨 Generating Artwork 080: Signal 080: Ripples of Serenity\n");
  console.log("=".repeat(60));

  try {
    const screenshotService = new ScreenshotService();

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `080_ai_signal_${timestamp}`;
    const uniqueThumbnailName = `080_ai_signal_thumb_${timestamp}`;

    // Use timestamp-based seed for variation, or use config seed if specified
    // Combine base seed with timestamp to ensure variation
    const baseSeed = artworkConfig.config.seed || 5;
    const uniqueSeed = (baseSeed + timestamp) % 2147483647;

    // Map gridPattern config to pipeline modules - matching legacy gridPatternRuntime
    // Legacy runtime uses:
    // - positioning: grid (exact grid positions, no jitter)
    // - sizing: noise (cellSize * 0.6 * noiseVal) - pre-calculated but will be overridden
    // - coloring: time (time-based hue rotation, not palette) - pre-calculated but will be overridden
    // - transformation: runtimeNoiseAdjust (recalculates noise using p5.noise() during rendering to match legacy exactly)
    // - rendering: shape (renders shapes)

    const pipelineConfig = {
      seed: uniqueSeed,
      width: 2400,
      height: 2400,
      gridSize: artworkConfig.config.gridSize,
      speed: artworkConfig.config.speed,
      fade: artworkConfig.config.fade,
      shape: artworkConfig.config.shape,
      background: artworkConfig.config.background,
      palette: artworkConfig.config.palette, // Keep for reference but use time coloring
      _captureFrame: 1, // Frame to capture at (static render)
      modules: {
        positioning: "grid",
        sizing: "noise",
        coloring: "time", // Use time-based coloring like legacy
        transformation: "runtimeNoiseAdjust", // Recalculate noise using p5.noise() to match legacy exactly
        rendering: "shape"
      }
    };

    console.log("\n📋 Pipeline Configuration:");
    console.log(`   Seed: ${pipelineConfig.seed} (base: ${baseSeed}, timestamp: ${timestamp})`);
    console.log(`   Unique Filename: ${uniqueFileName}`);
    console.log(`   Grid Size: ${pipelineConfig.gridSize}`);
    console.log(`   Speed: ${pipelineConfig.speed}`);
    console.log(`   Fade: ${pipelineConfig.fade}`);
    console.log(`   Shape: ${pipelineConfig.shape}`);
    console.log(`   Background: ${pipelineConfig.background}`);
    console.log(`   Palette: ${pipelineConfig.palette.join(", ")}`);

    console.log("\n🔧 Pipeline Modules:");
    Object.entries(pipelineConfig.modules).forEach(([key, value]) => {
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
      pipeline = buildPipeline(pipelineConfig.modules);
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
    const initialState = createInitialState(pipelineConfig);
    console.log(
      `   ✅ State created (${initialState.width}x${initialState.height})`
    );

    // Execute pipeline
    console.log("\n⚙️  Executing pipeline...");
    const finalState = executePipeline(pipeline, initialState);
    console.log(`   ✅ Pipeline executed`);
    console.log(`   📊 Elements created: ${finalState.elements.length}`);

    // Embed state in config for pipeline runtime
    const captureFrame = 1; // Static render at frame 1
    const configWithState = {
      ...pipelineConfig,
      _pipelineState: finalState, // Embed the final state
      _captureFrame: captureFrame, // Frame number for time-based calculations
    };

    // Render artwork using ScreenshotService with pipeline runtime
    console.log("\n📸 Rendering artwork...");
    const imageBuffer = await screenshotService.captureFromConfig(
      "pipeline", // Use pipeline template
      configWithState,
      uniqueFileName, // Use unique filename with timestamp
      captureFrame, // Capture at frame 1 (static)
      pipelineConfig.width
    );

    // ScreenshotService saves to thumbnails directory, copy to images directory
    const thumbnailSourcePath = path.join(thumbnailsDir, `${uniqueFileName}.png`);
    const outputPath = path.join(outputDir, `${uniqueFileName}.png`);
    
    // Copy to images directory
    if (fs.existsSync(thumbnailSourcePath)) {
      fs.copyFileSync(thumbnailSourcePath, outputPath);
      console.log(`   ✅ Full-size image saved: ${outputPath}`);
    } else {
      // If file doesn't exist where expected, save buffer directly
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`   ✅ Full-size image saved: ${outputPath}`);
    }

    // Save thumbnail path reference
    const thumbnailPath = path.join(thumbnailsDir, `${uniqueThumbnailName}.png`);
    if (fs.existsSync(thumbnailSourcePath) && thumbnailPath !== thumbnailSourcePath) {
      fs.copyFileSync(thumbnailSourcePath, thumbnailPath);
    } else if (fs.existsSync(thumbnailSourcePath)) {
      // If same path, just reference it
      console.log(`   ✅ Thumbnail: ${thumbnailSourcePath}`);
    }

    // Create metadata file
    const metadata = {
      ...artworkConfig,
      file: uniqueFileName,
      thumbnail: uniqueThumbnailName,
      config: {
        ...artworkConfig.config,
        seed: uniqueSeed, // Store the unique seed used
        modules: pipelineConfig.modules,
        width: pipelineConfig.width,
        height: pipelineConfig.height
      },
      pipeline: pipeline.map((fn) => fn.name || "anonymous"),
      imagePath: outputPath,
      thumbnailPath: thumbnailPath || thumbnailSourcePath,
      generatedAt: new Date().toISOString(),
      timestamp: timestamp
    };

    const metaPath = path.join(artworksDir, `${uniqueFileName}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    console.log(`   ✅ Metadata saved: ${metaPath}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Artwork 080 generated successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Image: ${outputPath}`);
    console.log(`   - Thumbnail: ${thumbnailPath}`);
    console.log(`   - Metadata: ${metaPath}`);
    console.log(`   - Elements: ${finalState.elements.length}`);
    console.log(`\n💡 Pipeline modules:`);
    pipeline.forEach((fn, i) => {
      console.log(`   ${i + 1}. ${fn.name || "anonymous"}`);
    });

    return metadata;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateArtwork080();

