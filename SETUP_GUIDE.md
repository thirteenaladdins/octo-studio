# Art Generation Studio - Setup Guide

This is the **art generation** repository that creates artworks using templates and AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Generate artwork:**
   ```bash
   npm run generate        # Generate and post to Twitter
   npm run generate:dry    # Generate without Twitter (testing)
   ```

4. **Export to gallery app:**
   ```bash
   npm run export
   ```

5. **Import in gallery app:**
   ```bash
   cd ../literate-octo-enigma
   npm run import:art
   ```

## Project Structure

```
art-generation-studio/
├── templates/           # P5.js template definitions
├── services/            # Generation services (AI, screenshots, Twitter)
├── schemas/            # JSON schemas for templates
├── output/             # Generated artworks (gitignored)
│   ├── sketches/      # P5.js files
│   ├── thumbnails/    # Screenshot images
│   └── metadata.json   # Artwork metadata
├── generate.js         # Main generation script
├── export.js           # Export script
└── package.json

```

## Workflow

1. **Develop templates** - Edit files in `templates/`
2. **Generate art** - Run `npm run generate`
3. **Export** - Run `npm run export` (copies to gallery imports/)
4. **Import** - In gallery app, run `npm run import:art`
5. **Deploy** - Gallery app displays the art

## Separate Repositories

- **This repo** (`art-generation-studio`) - Creates artworks
- **Gallery app** (`literate-octo-enigma`) - Displays artworks

The two repos are independent - you can develop templates here without affecting the gallery.
