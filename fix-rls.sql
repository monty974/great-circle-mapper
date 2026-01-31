-- Quick fix for RLS blocking inserts
-- Run this in Supabase SQL Editor

-- Disable RLS on saved_routes table to allow all operations
ALTER TABLE saved_routes DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'saved_routes';

-- Should show rowsecurity = false
