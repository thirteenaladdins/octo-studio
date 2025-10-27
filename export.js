#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const outputDir = path.join(rootDir, "output");
const galleryApp = path.join(rootDir, "..", "literate-octo-enigma");
const importsDir = path.join(galleryApp, "imports");

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  console.log("\n==============================================");
  console.log("Export Art to Gallery App");
  console.log("==============================================\n");

  if (!fs.existsSync(outputDir)) {
    console.error(
      "Error: output directory does not exist. Run 'npm run generate' first."
    );
    process.exit(1);
  }

  if (!fs.existsSync(galleryApp)) {
    console.error(`Error: Gallery app not found at ${galleryApp}`);
    console.log("Make sure the gallery app is in the same parent directory.");
    process.exit(1);
  }

  // Ensure imports directories exist
  const importSketchesDir = path.join(importsDir, "sketches");
  const importThumbsDir = path.join(importsDir, "thumbnails");

  ensureDirectory(importsDir);
  ensureDirectory(importSketchesDir);
  ensureDirectory(importThumbsDir);

  // Copy files
  const outputSketches = path.join(outputDir, "sketches");
  const outputThumbs = path.join(outputDir, "thumbnails");
  const outputMetadata = path.join(outputDir, "metadata.json");
  const importMetadata = path.join(importsDir, "metadata.json");

  // Copy sketches
  if (fs.existsSync(outputSketches)) {
    const sketches = fs
      .readdirSync(outputSketches)
      .filter((f) => f.endsWith(".js"));
    let count = 0;
    for (const file of sketches) {
      const src = path.join(outputSketches, file);
      const dest = path.join(importSketchesDir, file);
      fs.copyFileSync(src, dest);
      count++;
    }
    console.log(`✓ Copied ${count} sketch file(s)`);
  }

  // Copy thumbnails
  if (fs.existsSync(outputThumbs)) {
    const thumbs = fs
      .readdirSync(outputThumbs)
      .filter((f) => f.endsWith(".png"));
    let count = 0;
    for (const file of thumbs) {
      const src = path.join(outputThumbs, file);
      const dest = path.join(importThumbsDir, file);
      fs.copyFileSync(src, dest);
      count++;
    }
    console.log(`✓ Copied ${count} thumbnail file(s)`);
  }

  // Copy metadata
  if (fs.existsSync(outputMetadata)) {
    fs.copyFileSync(outputMetadata, importMetadata);
    const metadata = JSON.parse(fs.readFileSync(outputMetadata, "utf8"));
    console.log(`✓ Copied metadata for ${metadata.length} artwork(s)`);
  } else {
    console.log("⚠ No metadata.json found in output/");
  }

  console.log("\n==============================================");
  console.log("✅ Export complete!");
  console.log("==============================================\n");
  console.log(`Files copied to: ${importsDir}`);
  console.log(
    "\nNext step: Run 'npm run import:art' in the gallery app to import."
  );
  console.log("");
}

main();
