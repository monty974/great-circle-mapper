-- Create saved_routes table for storing shared route links
CREATE TABLE IF NOT EXISTS saved_routes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  route_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_saved_routes_created_at ON saved_routes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public access)
-- Since this is a public route sharing feature, we allow anyone to read/write
CREATE POLICY "Allow public read access" ON saved_routes
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON saved_routes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON saved_routes
  FOR DELETE USING (true);
