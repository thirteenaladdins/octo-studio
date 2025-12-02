require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for external access
app.use(cors());

// Initialize Supabase if credentials are available
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log('☁️  Server: Connected to Supabase database');
} else {
  console.log('💾 Server: Using local JSON file storage');
}

// Paths
const rootDir = __dirname;
const outputDir = path.join(rootDir, 'output');
const metadataPath = path.join(rootDir, 'src/data/artworks.json');
const legacyMetadataPath = path.join(outputDir, 'metadata.json');

// Middleware to ensure output directory exists
app.use((req, res, next) => {
  if (!fs.existsSync(outputDir)) {
    console.warn('Output directory does not exist yet.');
  }
  next();
});

// Helper to convert database row to artwork object
function dbRowToArtwork(row) {
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

// Helper to get metadata (async for Supabase)
async function getMetadata() {
  // Try Supabase database first if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data.map(row => dbRowToArtwork(row));
      }
    } catch (err) {
      console.error('Error reading from Supabase:', err.message);
      console.log('   Falling back to local JSON file');
    }
  }
  
  // Fallback to local JSON file
  if (fs.existsSync(metadataPath)) {
    try {
      const data = fs.readFileSync(metadataPath, 'utf8');
      const json = JSON.parse(data);
      return Array.isArray(json.artworks) ? json.artworks : [];
    } catch (err) {
      console.error('Error reading artworks.json:', err);
    }
  }
  
  // Legacy fallback
  if (fs.existsSync(legacyMetadataPath)) {
    try {
      const data = fs.readFileSync(legacyMetadataPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading legacy metadata.json:', err);
    }
  }
  
  return [];
}

// Endpoint: Get all artworks
app.get('/api/artworks', async (req, res) => {
  try {
    const artworks = await getMetadata();
    
    // Optional filtering params
    const limit = parseInt(req.query.limit) || 100;
    const sort = req.query.sort || 'desc'; // desc = newest first

    // Sort (if not already sorted by database)
    if (!supabase) {
      if (sort === 'desc') {
        artworks.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else {
        artworks.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    } else if (sort === 'asc') {
      // Reverse if ascending requested (database returns desc by default)
      artworks.reverse();
    }

    res.json({
      count: artworks.length,
      artworks: artworks.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get latest artwork
app.get('/api/artworks/latest', async (req, res) => {
  try {
    const artworks = await getMetadata();
    if (artworks.length === 0) {
      return res.status(404).json({ error: 'No artworks found' });
    }
    
    // Database already returns sorted by date desc, so first item is latest
    // For JSON fallback, sort if needed
    const latest = supabase ? artworks[0] : artworks.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    res.json(latest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get artwork by ID
app.get('/api/artworks/:id', async (req, res) => {
  try {
    // Try Supabase first if available
    if (supabase) {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      if (data) {
        return res.json(dbRowToArtwork(data));
      }
    }
    
    // Fallback to local JSON
    const artworks = await getMetadata();
    const artwork = artworks.find(a => a.id === req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files (images, thumbnails, and sketches)
// This exposes:
// - http://localhost:3000/images/001_ai_signal.png (full-size)
// - http://localhost:3000/thumbnails/001_ai_signal.png (thumbnail)
// - http://localhost:3000/sketches/001_ai_signal.js (sketch code)
app.use('/images', express.static(path.join(outputDir, 'images')));
app.use('/thumbnails', express.static(path.join(outputDir, 'thumbnails')));
app.use('/sketches', express.static(path.join(outputDir, 'sketches')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local API: http://localhost:${PORT}/api/artworks`);
  console.log(`Metadata source: ${fs.existsSync(metadataPath) ? metadataPath : legacyMetadataPath}`);
});
