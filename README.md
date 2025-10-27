# Octo Studio

AI-powered daily artwork generator using templates and OpenAI.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys:
   - `OPENAI_API_KEY` - Required for AI concept generation
   - `TWITTER_API_KEY`, `TWITTER_API_SECRET`, etc. - Optional for Twitter posting

2. Install dependencies:
```bash
npm install
```

## Usage

Generate a new artwork:
```bash
npm run generate
```

Generate without posting to Twitter (dry run):
```bash
npm run generate:dry
```

Export generated art to the gallery app:
```bash
npm run export
```

## Structure

- `templates/` - P5.js template definitions
- `services/` - Art generation services
- `schemas/` - JSON schemas for templates
- `output/` - Generated artworks (gitignored)

## Export Format

The export process creates files in the `output/` directory:
- `output/metadata.json` - Array of artwork metadata
- `output/sketches/` - P5.js sketch files
- `output/thumbnails/` - Screenshot images

These files can be copied to the gallery app's `imports/` directory.
