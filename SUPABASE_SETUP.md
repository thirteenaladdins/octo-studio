# Supabase Database Setup Guide

This guide explains how to set up the Supabase database table for storing artwork metadata.

## Step 1: Run the Migration

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/001_create_artworks_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

   This will create:
   - The `artworks` table with all necessary columns
   - Indexes for faster queries
   - Row Level Security (RLS) policies for public read access
   - A trigger to automatically update the `updated_at` timestamp

## Step 2: Verify the Table

1. **Check Table Structure**
   - Go to "Table Editor" in the left sidebar
   - You should see the `artworks` table
   - Click on it to view the structure

2. **Verify RLS Policies**
   - Go to "Authentication" → "Policies"
   - You should see policies for the `artworks` table:
     - "Allow public read access" (SELECT)
     - "Allow authenticated insert" (INSERT)
     - "Allow authenticated update" (UPDATE)

## Step 3: Test the Setup

Once the table is created, your code will automatically:
- **Save new artworks** to the database when generated
- **Read artworks** from the database when serving the API
- **Fall back to JSON file** if database is unavailable

## Table Schema

The `artworks` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Artwork ID (e.g., "001", "012") |
| `title` | TEXT | Artwork title |
| `description` | TEXT | Artistic description |
| `date` | DATE | Creation date |
| `tags` | JSONB | Array of tags |
| `file` | TEXT | Base filename |
| `thumbnail` | TEXT | Legacy thumbnail field |
| `category` | TEXT | Category (default: "generative") |
| `status` | TEXT | Status (default: "published") |
| `display_mode` | TEXT | Display mode (default: "image") |
| `template` | TEXT | Template name |
| `colors` | JSONB | Array of hex colors |
| `movement` | TEXT | Movement description |
| `density` | INTEGER | Density value |
| `mood` | TEXT | Mood description |
| `seed` | BIGINT | Random seed |
| `config` | JSONB | Full configuration object |
| `image_url` | TEXT | Full-size image URL (2400x2400) |
| `thumbnail_url` | TEXT | Thumbnail URL (400x400) |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated timestamp |

## Migration from JSON to Database

If you have existing artworks in your JSON file, you can migrate them:

1. **Option 1: Automatic Migration**
   - The code will automatically save new artworks to the database
   - Existing artworks will remain in JSON until they're regenerated or manually migrated

2. **Option 2: Manual Migration Script**
   - Create a script to read from `src/data/artworks.json`
   - Insert each artwork into the database using the StorageService

## Troubleshooting

**"relation 'artworks' does not exist"**
- Make sure you ran the migration SQL script
- Check that you're connected to the correct Supabase project

**"new row violates row-level security policy"**
- Check that the RLS policies are created correctly
- Verify you're using the correct API key (anon key for reads, service_role for writes)

**"Failed to save to Supabase database"**
- Check your `SUPABASE_URL` and `SUPABASE_KEY` environment variables
- Verify the table exists and has the correct structure
- Check the Supabase logs for detailed error messages

## Benefits of Database Storage

1. **Faster Queries** - Indexed queries are much faster than parsing JSON
2. **Scalability** - Can handle thousands of artworks efficiently
3. **Query Flexibility** - Can filter, sort, and search easily
4. **Real-time Updates** - Changes are immediately available
5. **Backup & Recovery** - Supabase handles backups automatically

## Next Steps

After setting up the database:
1. Test by generating a new artwork - it should save to the database
2. Check the Supabase dashboard to see the new row
3. Test the API endpoints - they should read from the database
4. The JSON file will still be updated as a backup

