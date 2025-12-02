const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

/**
 * Storage Service
 * Handles saving sketches, full-size images, and thumbnails.
 * Automatically switches between local file storage and Supabase Cloud Storage
 * based on environment variables.
 */
class StorageService {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.join(__dirname, '..');
    this.outputDir = path.join(this.rootDir, 'output');
    this.sketchesDir = path.join(this.outputDir, 'sketches');
    this.imagesDir = path.join(this.outputDir, 'images'); // Full-size images
    this.thumbnailsDir = path.join(this.outputDir, 'thumbnails'); // Small previews
    this.metadataPath = path.join(this.rootDir, 'src/data/artworks.json');
    this.legacyMetadataPath = path.join(this.outputDir, 'metadata.json');

    // Initialize Supabase if credentials exist
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      this.bucket = 'artworks';
      console.log('☁️  StorageService: Initialized with Supabase Cloud Storage');
    } else {
      console.log('💾 StorageService: Initialized with Local File Storage');
    }

    // Ensure local directories exist regardless (for temp files/fallback)
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    if (!fs.existsSync(this.sketchesDir)) fs.mkdirSync(this.sketchesDir, { recursive: true });
    if (!fs.existsSync(this.imagesDir)) fs.mkdirSync(this.imagesDir, { recursive: true });
    if (!fs.existsSync(this.thumbnailsDir)) fs.mkdirSync(this.thumbnailsDir, { recursive: true });
    
    // Ensure data directory
    const dataDir = path.dirname(this.metadataPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  }

  /**
   * Save the P5.js sketch code
   * @param {string} fileName - e.g., "001_ai_signal.js"
   * @param {string} content - The JS code
   * @returns {Promise<string>} - The path or URL where it was saved
   */
  async saveSketch(fileName, content) {
    // Always save locally first as backup/cache
    const localPath = path.join(this.sketchesDir, fileName);
    fs.writeFileSync(localPath, content, 'utf8');

    // Upload to Supabase if available
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .upload(`sketches/${fileName}`, content, {
            contentType: 'application/javascript',
            upsert: true
          });
          
        if (error) throw error;
        
        const { data: publicUrl } = this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(`sketches/${fileName}`);
          
        return publicUrl.publicUrl;
      } catch (error) {
        console.warn(`⚠️  Supabase Upload Failed for sketch: ${error.message}`);
        return localPath; // Fallback to local path
      }
    }

    return localPath; 
  }

  /**
   * Save the full-size image
   * @param {string} fileName - e.g., "001_ai_signal.png"
   * @param {Buffer} buffer - The image buffer
   * @returns {Promise<string>} - The path or URL where it was saved
   */
  async saveImage(fileName, buffer) {
    // Always save locally first
    const localPath = path.join(this.imagesDir, fileName);
    fs.writeFileSync(localPath, buffer);

    // Upload to Supabase if available
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .upload(`images/${fileName}`, buffer, { 
            contentType: 'image/png',
            upsert: true 
          });
          
        if (error) throw error;
        
        const { data: publicUrl } = this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(`images/${fileName}`);
          
        return publicUrl.publicUrl;
      } catch (error) {
        console.warn(`⚠️  Supabase Upload Failed for image: ${error.message}`);
        return localPath;
      }
    }

    return localPath;
  }

  /**
   * Save the thumbnail image (generated from full-size)
   * @param {string} fileName - e.g., "001_ai_signal.png"
   * @param {Buffer} buffer - The full-size image buffer
   * @param {number} size - Thumbnail size (default: 400)
   * @returns {Promise<string>} - The path or URL where it was saved
   */
  async saveThumbnail(fileName, buffer, size = 400) {
    // Generate thumbnail from full-size image
    const thumbnailBuffer = await sharp(buffer)
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    // Always save locally first
    const localPath = path.join(this.thumbnailsDir, fileName);
    fs.writeFileSync(localPath, thumbnailBuffer);

    // Upload to Supabase if available
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .upload(`thumbnails/${fileName}`, thumbnailBuffer, { 
            contentType: 'image/png',
            upsert: true 
          });
          
        if (error) throw error;
        
        const { data: publicUrl } = this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(`thumbnails/${fileName}`);
          
        return publicUrl.publicUrl;
      } catch (error) {
        console.warn(`⚠️  Supabase Upload Failed for thumbnail: ${error.message}`);
        return localPath;
      }
    }

    return localPath;
  }

  /**
   * Convert database row to artwork object (snake_case to camelCase)
   */
  dbRowToArtwork(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      tags: row.tags || [],
      file: row.file,
      thumbnail: row.thumbnail,
      category: row.category,
      status: row.status,
      displayMode: row.display_mode,
      template: row.template,
      colors: row.colors || [],
      movement: row.movement,
      density: row.density,
      mood: row.mood,
      seed: row.seed,
      config: row.config || {},
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
    };
  }

  /**
   * Convert artwork object to database row (camelCase to snake_case)
   */
  artworkToDbRow(artwork) {
    return {
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      date: artwork.date,
      tags: artwork.tags || [],
      file: artwork.file,
      thumbnail: artwork.thumbnail,
      category: artwork.category || 'generative',
      status: artwork.status || 'published',
      display_mode: artwork.displayMode || 'image',
      template: artwork.template,
      colors: artwork.colors || [],
      movement: artwork.movement,
      density: artwork.density,
      mood: artwork.mood,
      seed: artwork.seed,
      config: artwork.config || {},
      image_url: artwork.imageUrl,
      thumbnail_url: artwork.thumbnailUrl,
    };
  }

  /**
   * Load existing metadata
   * @returns {Promise<Array>}
   */
  async loadMetadata() {
    // Try Supabase database first if available
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('artworks')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log(`📊 Loaded ${data.length} artworks from Supabase database`);
          return data.map(row => this.dbRowToArtwork(row));
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load from Supabase database: ${error.message}`);
        console.warn('   Falling back to local JSON file');
      }
    }
    
    // Fallback to local JSON file
    if (fs.existsSync(this.metadataPath)) {
      const json = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
      return Array.isArray(json.artworks) ? json.artworks : [];
    }
    
    // Legacy fallback
    if (fs.existsSync(this.legacyMetadataPath)) {
      return JSON.parse(fs.readFileSync(this.legacyMetadataPath, 'utf8'));
    }
    
    return [];
  }

  /**
   * Save updated metadata
   * @param {Array} artworks 
   */
  async saveMetadata(artworks) {
    // Save to local JSON file (backup/fallback)
    const data = {
      artworks,
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalArtworks: artworks.length,
        publishedArtworks: artworks.filter(a => a.status === 'published').length,
        draftArtworks: artworks.filter(a => a.status === 'draft').length
      }
    };
    
    fs.writeFileSync(this.metadataPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    
    // Save to Supabase database if available
    if (this.supabase && artworks.length > 0) {
      try {
        // Get the newest artwork (last in array, assuming sorted by date)
        const newArtwork = artworks[artworks.length - 1];
        const dbRow = this.artworkToDbRow(newArtwork);
        
        // Use upsert to insert or update
        const { data: inserted, error } = await this.supabase
          .from('artworks')
          .upsert(dbRow, { onConflict: 'id' });
        
        if (error) throw error;
        
        console.log(`💾 Saved artwork ${newArtwork.id} to Supabase database`);
      } catch (error) {
        console.warn(`⚠️  Failed to save to Supabase database: ${error.message}`);
        console.warn('   Metadata saved to local JSON file only');
      }
    }
  }
  
  /**
   * Check if artwork exists
   * @param {string} fileName 
   */
  async artworkExists(fileName) {
    // Check local
    const localPath = path.join(this.sketchesDir, fileName);
    if (fs.existsSync(localPath)) return true;
    
    // Check cloud
    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list('sketches', { search: fileName });
        
      return data && data.length > 0;
    }
    
    return false;
  }
}

module.exports = StorageService;
