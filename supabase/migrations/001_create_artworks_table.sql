-- Create artworks table for storing artwork metadata
CREATE TABLE IF NOT EXISTS artworks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  file TEXT,
  thumbnail TEXT,
  category TEXT DEFAULT 'generative',
  status TEXT DEFAULT 'published',
  display_mode TEXT DEFAULT 'image',
  template TEXT NOT NULL,
  colors JSONB DEFAULT '[]'::jsonb,
  movement TEXT,
  density INTEGER,
  mood TEXT,
  seed BIGINT,
  config JSONB,
  image_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster sorting
CREATE INDEX IF NOT EXISTS idx_artworks_date ON artworks(date DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);

-- Create index on template for filtering
CREATE INDEX IF NOT EXISTS idx_artworks_template ON artworks(template);

-- Enable Row Level Security (RLS)
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON artworks
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated insert (for backend scripts)
-- Note: This uses service_role key which bypasses RLS, but good to have for future
CREATE POLICY "Allow authenticated insert" ON artworks
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow authenticated update
CREATE POLICY "Allow authenticated update" ON artworks
  FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_artworks_updated_at
  BEFORE UPDATE ON artworks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

