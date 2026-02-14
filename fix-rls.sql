-- Fix RLS policies for saved_routes
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow public read access" ON saved_routes;
DROP POLICY IF EXISTS "Allow public insert access" ON saved_routes;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON saved_routes;
DROP POLICY IF EXISTS "Allow public delete access" ON saved_routes;
DROP POLICY IF EXISTS "Anyone can view saved routes" ON saved_routes;
DROP POLICY IF EXISTS "Authenticated users can delete routes" ON saved_routes;
DROP POLICY IF EXISTS "Authenticated users can insert routes" ON saved_routes;
DROP POLICY IF EXISTS "Authenticated users can update routes" ON saved_routes;

-- Enable RLS
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can view routes
CREATE POLICY "Anyone can view saved routes" ON saved_routes
  FOR SELECT TO anon, authenticated
  USING (true);

-- Anyone (anon + authenticated) can insert routes
CREATE POLICY "Anyone can insert routes" ON saved_routes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can delete routes
CREATE POLICY "Authenticated users can delete routes" ON saved_routes
  FOR DELETE TO authenticated
  USING (true);
