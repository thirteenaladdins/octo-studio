#!/usr/bin/env node

/**
 * Upload a specific artwork to the Supabase database
 * Usage: node scripts/uploadArtworkToDb.js [artworkId]
 * If no ID is provided, uploads the most recent artwork
 */

require("dotenv").config();
const StorageService = require("../services/storageService");
const fs = require("fs");
const path = require("path");

async function main() {
  const artworkId = process.argv[2] || null;
  
  console.log("=".repeat(60));
  console.log("Upload Artwork to Database");
  console.log("=".repeat(60));
  
  // Initialize storage service
  const storageService = new StorageService();
  
  // Check if Supabase is configured
  if (!storageService.supabase) {
    console.error("\n❌ Supabase is not configured!");
    console.error("   Please set SUPABASE_URL and SUPABASE_KEY environment variables");
    console.error("   in your .env file or environment.");
    process.exit(1);
  }
  
  // Load artworks from JSON file
  const dataPath = path.join(__dirname, "..", "src", "data", "artworks.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`\n❌ Artworks file not found: ${dataPath}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const artworks = data.artworks || [];
  
  if (artworks.length === 0) {
    console.error("\n❌ No artworks found in the file");
    process.exit(1);
  }
  
  // Find the artwork to upload
  let artwork;
  if (artworkId) {
    artwork = artworks.find(a => a.id === artworkId || a.id === String(artworkId).padStart(3, "0"));
    if (!artwork) {
      console.error(`\n❌ Artwork with ID "${artworkId}" not found`);
      process.exit(1);
    }
    console.log(`\n📋 Uploading artwork: ${artwork.id} - ${artwork.title}`);
  } else {
    // Get the most recent artwork
    artwork = artworks[artworks.length - 1];
    console.log(`\n📋 Uploading most recent artwork: ${artwork.id} - ${artwork.title}`);
  }
  
  // Convert to database row format
  const dbRow = storageService.artworkToDbRow(artwork);
  
  console.log("\n💾 Uploading to Supabase database...");
  try {
    const { data: inserted, error } = await storageService.supabase
      .from('artworks')
      .upsert(dbRow, { onConflict: 'id' });
    
    if (error) throw error;
    
    console.log(`\n✅ Successfully uploaded artwork ${artwork.id} to database!`);
    console.log(`   Title: ${artwork.title}`);
    console.log(`   Template: ${artwork.template}`);
    console.log(`   Date: ${artwork.date}`);
    
    // Also upload images if they exist locally
    if (artwork.imageUrl && artwork.imageUrl.startsWith("/")) {
      console.log("\n📸 Uploading images to storage...");
      const imagePath = artwork.imageUrl;
      const thumbnailPath = artwork.thumbnailUrl;
      
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const fileName = path.basename(imagePath);
        const imageUrl = await storageService.saveImage(fileName, imageBuffer);
        console.log(`   Full-size image: ${imageUrl}`);
        
        // Update artwork with new URL
        artwork.imageUrl = imageUrl;
      }
      
      if (fs.existsSync(thumbnailPath)) {
        const thumbnailBuffer = fs.readFileSync(thumbnailPath);
        const fileName = path.basename(thumbnailPath);
        const thumbnailUrl = await storageService.saveThumbnail(fileName, thumbnailBuffer);
        console.log(`   Thumbnail: ${thumbnailUrl}`);
        
        // Update artwork with new URL
        artwork.thumbnailUrl = thumbnailUrl;
      }
      
      // Update database with new image URLs
      if (artwork.imageUrl !== imagePath || artwork.thumbnailUrl !== thumbnailPath) {
        const updatedRow = storageService.artworkToDbRow(artwork);
        await storageService.supabase
          .from('artworks')
          .upsert(updatedRow, { onConflict: 'id' });
        console.log("   Image URLs updated in database");
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Upload complete!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Error uploading to database:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

