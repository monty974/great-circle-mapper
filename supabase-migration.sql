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

-- Drop table if exists (for clean reinstall - WARNING: deletes all data!)
-- DROP TABLE IF EXISTS saved_routes CASCADE;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow public read access" ON saved_routes;
DROP POLICY IF EXISTS "Allow public insert access" ON saved_routes;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON saved_routes;
DROP POLICY IF EXISTS "Allow public delete access" ON saved_routes;
DROP POLICY IF EXISTS "Anyone can view saved routes" ON saved_routes;
DROP POLICY IF EXISTS "Authenticated users can delete routes" ON saved_routes;
DROP POLICY IF EXISTS "Authenticated users can insert routes" ON saved_routes;
DROP POLICY IF EXISTS "Authenticated users can update routes" ON saved_routes;

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

-- Enable RLS
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Anyone can view saved routes (anon + authenticated)
CREATE POLICY "Anyone can view saved routes" ON saved_routes
  FOR SELECT TO anon, authenticated
  USING (true);

-- Anyone can insert saved routes (anon + authenticated)
CREATE POLICY "Anyone can insert routes" ON saved_routes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can delete routes
CREATE POLICY "Authenticated users can delete routes" ON saved_routes
  FOR DELETE TO authenticated
  USING (true);

-- Verify setup
SELECT 'Table created successfully!' as message;
SELECT COUNT(*) as current_row_count FROM saved_routes;
