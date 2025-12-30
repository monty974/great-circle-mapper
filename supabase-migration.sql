-- ============================================
-- SAVED ROUTES TABLE SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Paste this entire script and click "Run"
-- ============================================

-- Drop existing policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Allow public read access" ON saved_routes;
DROP POLICY IF EXISTS "Allow public insert access" ON saved_routes;
DROP POLICY IF EXISTS "Allow public delete access" ON saved_routes;

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

-- Create policies to allow all operations (public access)
-- Since this is a public route sharing feature, we allow anyone to read/write
CREATE POLICY "Allow public read access" ON saved_routes
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON saved_routes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON saved_routes
  FOR DELETE USING (true);

-- Verify setup
SELECT 'Table created successfully!' as message;
SELECT COUNT(*) as current_row_count FROM saved_routes;
