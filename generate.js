#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAIService = require("./services/openaiService");
const ArtGenerator = require("./services/artGenerator");
const ScreenshotService = require("./services/screenshotService");
const TwitterService = require("./services/twitterService");

const rootDir = __dirname;
const outputDir = path.join(rootDir, "output");
const sketchesDir = path.join(outputDir, "sketches");
const thumbnailsDir = path.join(outputDir, "thumbnails");
const metadataPath = path.join(outputDir, "metadata.json");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const padId = (value) => String(value).padStart(3, "0");

const calculateDate = () => {
  const now = new Date();
  const offset = process.argv.includes("--tomorrow") ? 1 : 0;
  now.setDate(now.getDate() + offset);
  return now.toISOString().slice(0, 10);
};

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("=".repeat(60));
  console.log("AI-Powered Daily Artwork Generator");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No Twitter posting");
  }

  try {
    // 1. Initialize services
    console.log("\n📦 Initializing services...");

    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
    const artGenerator = new ArtGenerator();
    const screenshotService = new ScreenshotService();

    let twitterService = null;
    if (!isDryRun) {
      twitterService = new TwitterService({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      });
    }

    // 2. Ensure output directories exist
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(sketchesDir))
      fs.mkdirSync(sketchesDir, { recursive: true });
    if (!fs.existsSync(thumbnailsDir))
      fs.mkdirSync(thumbnailsDir, { recursive: true });

    // Load existing metadata
    console.log("\n📖 Loading existing metadata...");
    let artworks = [];
    if (fs.existsSync(metadataPath)) {
      const metadata = readJson(metadataPath);
      artworks = Array.isArray(metadata) ? metadata : [];
    }

    // 3. Generate next artwork ID
    const numericIds = artworks
      .map((artwork) => Number.parseInt(artwork.id, 10))
      .filter(Number.isFinite);

    const nextNumericId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
    const paddedId = padId(nextNumericId);
    const sketchFileName = `${paddedId}_ai_signal`;
    const sketchPath = path.join(sketchesDir, `${sketchFileName}.js`);

    const thumbPath = path.join(thumbnailsDir, `${sketchFileName}.png`);

    // Check if artwork already exists
    if (fs.existsSync(sketchPath)) {
      console.log(`\n⚠️  Artwork already exists: ${sketchPath}`);
      return;
    }

    // 4. Generate art concept using OpenAI
    console.log("\n🎨 Generating art concept with AI...");
    // Build avoidance list from last few artworks to encourage novelty
    const recent = artworks.slice(-5);
    const avoid = recent.map((a) =>
      [
        a.template,
        (a.colors || []).join(","),
        a.movement,
        a.density,
        a.mood,
        a.title,
      ]
        .filter(Boolean)
        .join("|")
    );
    const seed = Date.now();
    const concept = await openaiService.generateArtConcept({ avoid, seed });

    console.log(`\n✨ Concept generated:`);
    console.log(`   Title: ${concept.title}`);
    console.log(`   Template: ${concept.template}`);
    console.log(`   Mood: ${concept.mood}`);
    console.log(`   Description: ${concept.description}`);

    // 5. Generate P5.js sketch code
    console.log("\n🔨 Generating P5.js sketch...");
    const sketchCode = artGenerator.generateSketch(concept, paddedId);

    // Write sketch file
    fs.writeFileSync(sketchPath, sketchCode, "utf8");
    console.log(`   Sketch saved to: ${sketchPath}`);

    // 6. Generate tags
    const tags = artGenerator.generateTags(concept);

    // 7. Create artwork entry
    const artworkDate = calculateDate();
    const newArtwork = {
      id: paddedId,
      title: `Signal ${paddedId}: ${concept.title}`,
      description: concept.description,
      date: artworkDate,
      tags: tags,
      file: sketchFileName,
      thumbnail: `${sketchFileName}_thumb`,
      category: "generative",
      status: "published",
      // Prefer static snapshot rendering on the website for newly generated artworks
      displayMode: "image",
      // Store concept metadata to reduce repetition
      template: concept.template,
      colors: concept.colors,
      movement: concept.movement,
      density: concept.density,
      mood: concept.mood,
    };

    artworks.push(newArtwork);

    // 8. Save updated metadata
    console.log("\n📝 Saving metadata...");
    writeJson(metadataPath, artworks);
    console.log(`   Metadata saved to ${metadataPath}`);

    // 9. Capture screenshot
    console.log("\n📸 Capturing screenshot...");
    const imageBuffer = await screenshotService.captureSketch(
      sketchPath,
      sketchFileName,
      thumbnailsDir
    );
    console.log(
      `   Screenshot captured (${(imageBuffer.length / 1024).toFixed(2)} KB)`
    );

    // 10. Post to Twitter
    let tweetUrl = null;
    if (!isDryRun && twitterService) {
      console.log("\n🐦 Posting to Twitter...");
      tweetUrl = await twitterService.postArtwork({
        imageBuffer,
        title: newArtwork.title,
        portfolioUrl: process.env.PORTFOLIO_URL || "https://your-portfolio.com",
        artworkId: paddedId,
        hashtags: concept.hashtags || [],
      });
      console.log(`   Posted: ${tweetUrl}`);
    } else if (isDryRun) {
      console.log("\n🐦 Skipping Twitter post (dry run)");
    }

    // 11. Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Daily artwork generated successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ID: ${paddedId}`);
    console.log(`   Title: ${newArtwork.title}`);
    console.log(`   Template: ${concept.template}`);
    console.log(`   Sketch: ${sketchPath}`);
    if (tweetUrl) {
      console.log(`   Tweet: ${tweetUrl}`);
    }
    console.log("=".repeat(60));

    // 12. Cleanup old screenshots (optional, comment out if not needed)
    // screenshotService.cleanupOldScreenshots(7);
  } catch (error) {
    console.error("\n❌ Error generating daily artwork:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
