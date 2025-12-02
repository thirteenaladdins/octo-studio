# Octo Studio API Usage Guide

Complete guide for fetching artworks in your other project.

## Two Options

You have **two ways** to fetch artworks:

1. **REST API Endpoints** (Recommended) - Simple HTTP requests
2. **Direct Database Queries** - Using Supabase client for more control

---

## Option 1: REST API (Recommended)

### Base URL
- **Local:** `http://localhost:3000`
- **Production:** `https://your-project.vercel.app` (after Vercel deployment)

### Endpoints

#### Get Latest Artwork
```javascript
const response = await fetch('https://your-api.vercel.app/api/artworks/latest');
const artwork = await response.json();

console.log(artwork.title);
console.log(artwork.imageUrl);      // Full-size (2400x2400)
console.log(artwork.thumbnailUrl);  // Thumbnail (400x400)
```

#### Get All Artworks
```javascript
const response = await fetch('https://your-api.vercel.app/api/artworks?limit=10&sort=desc');
const data = await response.json();

console.log(data.count);        // Total number
console.log(data.artworks);     // Array of artworks
```

#### Get Artwork by ID
```javascript
const response = await fetch('https://your-api.vercel.app/api/artworks/012');
const artwork = await response.json();
```

### Response Structure

```typescript
interface Artwork {
  id: string;                    // "012"
  title: string;                 // "Signal 012: Drifting Colorscapes"
  description: string;           // "A visual journey..."
  date: string;                  // "2025-11-26"
  tags: string[];                // ["generative", "ai-generated", ...]
  imageUrl: string | null;       // Full-size URL (2400x2400)
  thumbnailUrl: string | null;   // Thumbnail URL (400x400)
  template: string;              // "simpleModular", "flowField", etc.
  colors: string[];              // ["#FF9A8B", "#FFD29D", ...]
  movement: string;              // "particles gently drift..."
  density: number;               // 72
  mood: string;                  // "whimsical, soothing"
  seed: number;                  // 1108687354
  config: object;                 // Full config object
  // ... other fields
}
```

**Pros:**
- ✅ Simple HTTP requests
- ✅ No database credentials needed
- ✅ Cached and optimized
- ✅ Works from any language/framework

---

## Option 2: Direct Database Queries (Supabase Client)

If you want more control, you can query Supabase directly.

### Setup

**Install Supabase client:**
```bash
npm install @supabase/supabase-js
```

**Initialize:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wepwkddoljsgkhelrplp.supabase.co',
  'your_anon_key_here'  // Public key, safe to use in frontend
);
```

### Queries

#### Get Latest Artwork
```javascript
const { data, error } = await supabase
  .from('artworks')
  .select('*')
  .order('date', { ascending: false })
  .limit(1)
  .single();

if (error) {
  console.error('Error:', error);
} else {
  console.log(data.title);
  console.log(data.image_url);      // Note: snake_case in DB
  console.log(data.thumbnail_url);
}
```

#### Get All Artworks
```javascript
const { data, error } = await supabase
  .from('artworks')
  .select('*')
  .order('date', { ascending: false })
  .limit(10);
```

#### Get Artwork by ID
```javascript
const { data, error } = await supabase
  .from('artworks')
  .select('*')
  .eq('id', '012')
  .single();
```

#### Filter by Template
```javascript
const { data } = await supabase
  .from('artworks')
  .select('*')
  .eq('template', 'flowField')
  .order('date', { ascending: false });
```

#### Filter by Status
```javascript
const { data } = await supabase
  .from('artworks')
  .select('*')
  .eq('status', 'published')
  .order('date', { ascending: false });
```

### Database Field Names

**Important:** Database uses **snake_case**, but API returns **camelCase**.

| Database (snake_case) | API (camelCase) |
|------------------------|-----------------|
| `image_url` | `imageUrl` |
| `thumbnail_url` | `thumbnailUrl` |
| `display_mode` | `displayMode` |
| `created_at` | (not in API) |
| `updated_at` | (not in API) |

### Field Conversion Helper

If querying directly, you'll need to convert:

```javascript
function dbRowToArtwork(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    tags: row.tags || [],
    imageUrl: row.image_url,        // Convert snake_case
    thumbnailUrl: row.thumbnail_url, // Convert snake_case
    displayMode: row.display_mode,
    template: row.template,
    colors: row.colors || [],
    movement: row.movement,
    density: row.density,
    mood: row.mood,
    seed: row.seed,
    config: row.config || {},
  };
}

// Usage
const { data } = await supabase.from('artworks').select('*').limit(1);
const artwork = dbRowToArtwork(data[0]);
```

**Pros:**
- ✅ More query flexibility (filtering, sorting)
- ✅ Real-time subscriptions possible
- ✅ Direct database access

**Cons:**
- ❌ Need Supabase credentials
- ❌ Field name conversion needed
- ❌ More setup required

---

## Recommendation

**Use the REST API** (`/api/artworks/latest`) unless you need:
- Complex filtering
- Real-time updates
- Custom queries

The API handles all the complexity and gives you clean, consistent data.

---

## Complete Example: React Hook

```javascript
import { useState, useEffect } from 'react';

function useLatestArtwork() {
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const response = await fetch('https://your-api.vercel.app/api/artworks/latest');
        
        if (!response.ok) {
          throw new Error('Failed to fetch artwork');
        }
        
        const data = await response.json();
        setArtwork(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLatest();
  }, []);

  return { artwork, loading, error };
}

// Usage in component
function MyComponent() {
  const { artwork, loading, error } = useLatestArtwork();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!artwork) return <div>No artwork found</div>;

  return (
    <div>
      <h1>{artwork.title}</h1>
      <img src={artwork.thumbnailUrl} alt={artwork.title} />
      <p>{artwork.description}</p>
    </div>
  );
}
```

---

## Complete Example: Direct Supabase Query

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wepwkddoljsgkhelrplp.supabase.co',
  'your_anon_key'
);

async function getLatestArtwork() {
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  // Convert to camelCase
  return {
    ...data,
    imageUrl: data.image_url,
    thumbnailUrl: data.thumbnail_url,
    displayMode: data.display_mode,
  };
}
```

---

## Which Should You Use?

**Use REST API if:**
- You want simplicity
- You're building a frontend
- You don't need complex queries
- You want consistent field names

**Use Direct Database if:**
- You need complex filtering
- You want real-time subscriptions
- You're building a backend service
- You need maximum flexibility

For most use cases, **the REST API is the better choice**.

