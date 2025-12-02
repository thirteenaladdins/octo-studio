#!/usr/bin/env node

/**
 * Comprehensive test to debug the black image issue
 * Tests both absolute rendering and modular runtime
 */

require("dotenv").config();
const ScreenshotService = require("./services/screenshotService");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function testComprehensive() {
  console.log("🧪 Comprehensive Rendering Test\n");
  console.log("=" .repeat(60));

  const screenshotService = new ScreenshotService();

  // Test 1: Absolute simple rendering (should definitely work)
  console.log("\n1️⃣  Testing absolute simple rendering...");
  const simpleHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
</head>
<body>
  <script>
    new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(1024, 1024);
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.background(0, 0, 100); // White
      };
      
      p5.draw = () => {
        // Draw bright red circle
        p5.fill(0, 100, 100, 100); // Bright red in HSB
        p5.noStroke();
        p5.ellipse(512, 512, 200, 200);
        p5.noLoop();
      };
    });
  </script>
</body>
</html>`;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1024 });
    await page.setContent(simpleHTML);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: "output/thumbnails/test-absolute-simple.png" });
    await browser.close();
    console.log("   ✅ Saved: output/thumbnails/test-absolute-simple.png");
    console.log("   📍 URL: http://localhost:8000/output/thumbnails/test-absolute-simple.png");
  } catch (e) {
    console.error("   ❌ Failed:", e.message);
  }

  // Test 2: Modular runtime with minimal config
  console.log("\n2️⃣  Testing modular runtime (minimal config)...");
  const config1 = {
    seed: 42,
    width: 1024,
    height: 1024,
    gridSize: 3, // Just 9 circles
    speed: 0,
    shape: "circle",
    palette: ["#ff0000"], // Bright red
    background: "#ffffff", // White
    modules: {
      positioning: "grid",
      sizing: "constant",
      coloring: "palette",
      transform: "none",
      rendering: "shape"
    }
  };

  try {
    await screenshotService.captureFromConfig(
      "universalModular",
      config1,
      "test-modular-minimal",
      5,
      1024
    );
    console.log("   ✅ Saved: output/thumbnails/test-modular-minimal.png");
    console.log("   📍 URL: http://localhost:8000/output/thumbnails/test-modular-minimal.png");
  } catch (e) {
    console.error("   ❌ Failed:", e.message);
  }

  // Test 3: Modular runtime with explicit HSB colors (no hex conversion)
  console.log("\n3️⃣  Testing modular runtime (HSB colors, no hex)...");
  
  // Generate HTML manually to test with HSB values directly
  const config2 = {
    seed: 42,
    width: 1024,
    height: 1024,
    gridSize: 5,
    speed: 0,
    shape: "circle",
    palette: ["#ff0000"],
    background: "#ffffff",
    modules: {
      positioning: "grid",
      sizing: "constant",
      coloring: "time", // Use time-based which doesn't need hex conversion
      transform: "none",
      rendering: "shape"
    }
  };

  try {
    await screenshotService.captureFromConfig(
      "universalModular",
      config2,
      "test-modular-time-color",
      5,
      1024
    );
    console.log("   ✅ Saved: output/thumbnails/test-modular-time-color.png");
    console.log("   📍 URL: http://localhost:8000/output/thumbnails/test-modular-time-color.png");
  } catch (e) {
    console.error("   ❌ Failed:", e.message);
  }

  // Test 4: Generate debug HTML for manual inspection
  console.log("\n4️⃣  Generating debug HTML for manual inspection...");
  const debugHTML = screenshotService.generateHTMLFromConfig(
    "universalModular",
    config1,
    5,
    1024
  );
  
  // Add console logging
  const debugScript = `
    <script>
      console.log('=== DEBUG INFO ===');
      console.log('Config:', ${JSON.stringify(config1)});
    </script>
  `;
  
  const htmlWithDebug = debugHTML.replace('</head>', debugScript + '</head>');
  fs.writeFileSync("debug-comprehensive.html", htmlWithDebug);
  console.log("   ✅ Saved: debug-comprehensive.html");
  console.log("   📍 Open in browser and check console for errors");

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Summary:");
  console.log("   1. test-absolute-simple.png - Simple p5.js circle (baseline)");
  console.log("   2. test-modular-minimal.png - Modular runtime with palette colors");
  console.log("   3. test-modular-time-color.png - Modular runtime with time-based colors");
  console.log("   4. debug-comprehensive.html - HTML for manual browser inspection");
  console.log("\n💡 If test-absolute-simple.png shows a red circle:");
  console.log("   → Puppeteer works, issue is in modular runtime");
  console.log("\n💡 If test-absolute-simple.png is also black:");
  console.log("   → Issue is with Puppeteer/screenshot setup");
  console.log("\n✅ All test files generated!");
}

testComprehensive().catch(console.error);

