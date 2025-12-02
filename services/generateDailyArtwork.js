#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAIService = require("./openaiService");
const ArtGenerator = require("./artGenerator");
const ScreenshotService = require("./screenshotService");
const StorageService = require("./storageService");
const TwitterService = require("./twitterService");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "src", "data", "artworks.json");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

// Atomic write for safety
const writeJsonAtomically = (filePath, data) => {
  const tmpPath = `${filePath}.tmp`;
  writeJson(tmpPath, data);
  fs.renameSync(tmpPath, filePath);
};

const padId = (value) => String(value).padStart(3, "0");

const calculateDate = () => {
  const now = new Date();
  const offset = process.argv.includes("--tomorrow") ? 1 : 0;
  now.setDate(now.getDate() + offset);
  return now.toISOString().slice(0, 10);
};

// Parse command-line arguments
function parseArgs() {
  const args = {
    dryRun: process.argv.includes("--dry-run"),
    tomorrow: process.argv.includes("--tomorrow"),
    id: null,
    template: null,
  };

  const idIndex = process.argv.indexOf("--id");
  if (idIndex !== -1 && process.argv[idIndex + 1]) {
    args.id = process.argv[idIndex + 1];
  }

  const templateIndex = process.argv.indexOf("--template");
  if (templateIndex !== -1 && process.argv[templateIndex + 1]) {
    args.template = process.argv[templateIndex + 1];
  }

  return args;
}

async function main() {
  const args = parseArgs();
  const isDryRun = args.dryRun;

  console.log("=".repeat(60));
  console.log("AI-Powered Daily Artwork Generator");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No Twitter posting");
  }

  if (args.id) {
    console.log(`🔄 REPLAY MODE - Targeting ID: ${args.id}`);
  }

  if (args.template) {
    console.log(`🎯 TEMPLATE OVERRIDE - Using: ${args.template}`);
  }

  try {
    // 1. Initialize services
    console.log("\n📦 Initializing services...");

    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
    const artGenerator = new ArtGenerator(); // Still needed for generateTags()
    const screenshotService = new ScreenshotService();
    const storageService = new StorageService();

    let twitterService = null;
    if (!isDryRun) {
      twitterService = new TwitterService({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      });
    }

    // 2. Load artworks data (from database or JSON)
    console.log("\n📖 Loading artworks data...");
    const artworks = await storageService.loadMetadata();
    
    // Also load from JSON for backward compatibility and metadata tracking
    let data = { artworks: [], metadata: {} };
    if (fs.existsSync(dataPath)) {
      data = readJson(dataPath);
    }

    // 3. Generate next artwork ID (or use override)
    let paddedId, sketchFileName;

    if (args.id) {
      // Replay mode: use specified ID
      paddedId = padId(args.id);
      sketchFileName = `${paddedId}_ai_signal`;
      console.log(`\n🔄 Replay mode: Using ID ${paddedId}`);
    } else {
      // Normal mode: generate next ID
      const numericIds = artworks
        .map((artwork) => Number.parseInt(artwork.id, 10))
        .filter(Number.isFinite);

      const nextNumericId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
      paddedId = padId(nextNumericId);
      sketchFileName = `${paddedId}_ai_signal`;
    }

    // Check if artwork already exists (check artworks.json instead of JS file)
    const existingArtwork = artworks.find((a) => a.id === paddedId);
    if (existingArtwork) {
      console.log(`\n⚠️  Artwork ${paddedId} already exists in artworks.json`);
      return;
    }

    // 4. Generate art concept using OpenAI
    console.log("\n🎨 Generating art concept with AI...");
    // Build avoidance list from recent artworks to encourage novelty
    const avoidanceWindow = 20; // Look back 20 artworks
    const recent = artworks.slice(-avoidanceWindow);

    // Build traditional avoidance list (template, colors, movement, etc.)
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

    // Build title word store to avoid repetitive words
    const TitleWordStore = require("./titleWordStore");
    const titleWordStore = new TitleWordStore();
    const wordStore = titleWordStore.buildWordStore(artworks, avoidanceWindow);

    if (wordStore.overusedWords.length > 0) {
      console.log(
        `   Detected ${
          wordStore.overusedWords.length
        } overused title words: ${wordStore.overusedWords
          .slice(0, 5)
          .join(", ")}...`
      );
    }

    const seed = Date.now();
    let concept = await openaiService.generateArtConcept({
      avoid,
      seed,
      wordStore,
    });

    // Override template if specified
    if (args.template) {
      console.log(
        `\n🎯 Overriding template from "${concept.template}" to "${args.template}"`
      );
      concept.template = args.template;
    }

    console.log(`\n✨ Concept generated:`);
    console.log(`   Title: ${concept.title}`);
    console.log(`   Template: ${concept.template}`);
    console.log(`   Mood: ${concept.mood}`);
    console.log(`   Description: ${concept.description}`);

    // 5. Generate config for parameter-based rendering
    console.log("\n🔨 Generating config for parameter-based rendering...");
    const {
      generateRandomConfig,
    } = require("./templateConfigService");
    const normalizedSeed = seed % 2147483647;

    // Generate the config that will be used for parameter-based rendering
    // This config will be stored in artworks.json and used for screenshot capture
    const config = generateRandomConfig(concept.template, normalizedSeed);
    config.template = concept.template;

    console.log(`   Config generated:`, JSON.stringify(config, null, 2));
    console.log(`   Seed: ${normalizedSeed}`);

    // 5.5. Store metadata for reproducibility
    const metaDir = path.join(rootDir, "artworks");
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    const metaPath = path.join(metaDir, `${sketchFileName}.meta.json`);
    const metadata = {
      id: paddedId,
      seed: normalizedSeed,
      timestamp: new Date().toISOString(),
      concept,
      config,
      model: "gpt-4o-mini",
      temperature: 0.95,
      presencePenalty: 0.8,
    };
    writeJson(metaPath, metadata);
    console.log(`   Metadata saved to: ${metaPath}`);

    // 6. Generate tags
    const tags = artGenerator.generateTags(concept);

    // 7. Create artwork entry with parameter-based config
    // Note: imageUrl and thumbnailUrl will be added after upload
    const artworkDate = calculateDate();
    const newArtwork = {
      id: paddedId,
      title: `Signal ${paddedId}: ${concept.title}`,
      description: concept.description,
      date: artworkDate,
      tags: tags,
      file: sketchFileName,
      thumbnail: `${sketchFileName}_thumb`, // Legacy field for compatibility
      category: "generative",
      status: "published",
      // Use static screenshot for new parameter-based artworks
      displayMode: "image",
      // Store concept metadata
      template: concept.template,
      colors: concept.colors,
      movement: concept.movement,
      density: concept.density,
      mood: concept.mood,
      // Store full config and seed for parameter-based rendering
      seed: normalizedSeed,
      config: config,
      // Image URLs will be added after upload
      imageUrl: null,
      thumbnailUrl: null,
    };

    artworks.push(newArtwork);

    // 8. Update metadata (save to both database and JSON)
    if (data.metadata) {
      const totalArtworks = artworks.length;
      const publishedArtworks = artworks.filter(
        (artwork) => artwork.status === "published"
      ).length;
      const draftArtworks = artworks.filter(
        (artwork) => artwork.status === "draft"
      ).length;

      data.metadata = {
        ...data.metadata,
        lastUpdated: new Date().toISOString().slice(0, 10),
        totalArtworks,
        publishedArtworks,
        draftArtworks,
      };
    }

    // Save to JSON file (backup)
    writeJsonAtomically(dataPath, { ...data, artworks });
    
    // Save to database via StorageService
    await storageService.saveMetadata(artworks);
    console.log(`   Metadata updated`);

    // 9. Capture full-size screenshot from config using runtime template
    console.log("\n📸 Capturing full-size screenshot from config...");
    const fullSizeBuffer = await screenshotService.captureFromConfig(
      concept.template,
      config,
      sketchFileName,
      180, // Capture at frame 180 (~3 seconds at 60fps) for consistency
      2400 // Full-size resolution: 2400x2400
    );
    
    console.log(
      `   Full-size screenshot captured (${(fullSizeBuffer.length / 1024).toFixed(2)} KB)`
    );

    // Upload full-size image to Storage
    console.log("☁️  Uploading full-size image to storage...");
    const imageUrl = await storageService.saveImage(`${sketchFileName}.png`, fullSizeBuffer);
    console.log(`   Full-size image stored at: ${imageUrl}`);

    // Generate and upload thumbnail
    console.log("🖼️  Generating thumbnail...");
    const thumbnailUrl = await storageService.saveThumbnail(`${sketchFileName}.png`, fullSizeBuffer, 400);
    console.log(`   Thumbnail stored at: ${thumbnailUrl}`);

    // Update artwork with image URLs
    newArtwork.imageUrl = imageUrl;
    newArtwork.thumbnailUrl = thumbnailUrl;
    
    // Update the artworks array with the new URLs
    artworks[artworks.length - 1] = newArtwork;
    writeJsonAtomically(dataPath, { ...data, artworks });
    
    // Update database with image URLs via StorageService
    await storageService.saveMetadata(artworks);
    console.log("   Metadata updated with image URLs");

    // 10. Post to Twitter (using full-size image)
    let tweetUrl = null;
    if (!isDryRun && twitterService) {
      try {
        console.log("\n🐦 Posting to Twitter...");
        tweetUrl = await twitterService.postArtwork({
          imageBuffer: fullSizeBuffer,
          title: newArtwork.title,
          portfolioUrl: process.env.PORTFOLIO_URL || "https://your-portfolio.com",
          artworkId: paddedId,
          hashtags: concept.hashtags || [],
        });
        console.log(`   Posted: ${tweetUrl}`);
      } catch (error) {
        console.warn(`\n⚠️  Twitter posting failed: ${error.message}`);
        console.warn("   Artwork was still created and saved successfully");
      }
    } else if (isDryRun) {
      console.log("\n🐦 Skipping Twitter post (dry run)");
    } else if (!twitterService) {
      console.log("\n🐦 Skipping Twitter post (no credentials)");
    }

    // 11. Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Daily artwork generated successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ID: ${paddedId}`);
    console.log(`   Title: ${newArtwork.title}`);
    console.log(`   Template: ${concept.template}`);
    console.log(`   Display Mode: ${newArtwork.displayMode} (parameter-based)`);
    console.log(`   Config: stored in artworks.json`);
    console.log(`   Seed: ${normalizedSeed}`);
    console.log(`   Screenshot: ${sketchFileName}.png`);
    if (tweetUrl) {
      console.log(`   Tweet: ${tweetUrl}`);
    }
    console.log("=".repeat(60));

    // 12. Cleanup old screenshots
    screenshotService.cleanupOldScreenshots(7);
  } catch (error) {
    console.error("\n❌ Error generating daily artwork:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
