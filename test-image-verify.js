#!/usr/bin/env node

/**
 * Quick test to verify images are rendering (not black)
 */

const ScreenshotService = require("./services/screenshotService");
const fs = require("fs");
const path = require("path");

async function testImageGeneration() {
  console.log("🧪 Testing Image Generation with Fixed Module Inlining\n");
  
  const screenshotService = new ScreenshotService();
  
  // Test config with bright colors that should be visible
  const config = {
    seed: 42,
    width: 1024,
    height: 1024,
    gridSize: 5, // 25 circles
    speed: 0,
    shape: "circle",
    palette: ["#ff0000", "#00ff00", "#0000ff"], // Bright red, green, blue
    background: "#ffffff", // White background
    modules: {
      positioning: "grid",
      sizing: "constant",
      coloring: "palette",
      transform: "none",
      rendering: "shape"
    }
  };

  console.log("📸 Generating test image...");
  try {
    const imageBuffer = await screenshotService.captureFromConfig(
      "universalModular",
      config,
      "test-verify-fix",
      10, // Capture at frame 10
      1024
    );
    
    const fileSize = imageBuffer.length;
    console.log(`✅ Image generated successfully!`);
    console.log(`   File size: ${(fileSize / 1024).toFixed(2)} KB`);
    
    if (fileSize < 5000) {
      console.warn("   ⚠️  File size is very small - might be black/empty");
    } else {
      console.log("   ✓ File size looks good (has content)");
    }
    
    // Check if file exists and is readable
    const outputPath = path.join(__dirname, "output/thumbnails/test-verify-fix.png");
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`   📍 Saved to: ${outputPath}`);
      console.log(`   📊 File size on disk: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log("\n🎨 If you see colored circles on a white background, the fix worked!");
    console.log("   Open: output/thumbnails/test-verify-fix.png to verify");
    
  } catch (error) {
    console.error("❌ Error generating image:", error.message);
    console.error(error.stack);
  }
}

testImageGeneration().catch(console.error);

