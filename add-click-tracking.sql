-- Add click tracking to saved_routes
-- Run this in Supabase SQL Editor

-- Add click_count column (defaults to 0)
ALTER TABLE saved_routes ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create a function to safely increment click count
CREATE OR REPLACE FUNCTION increment_click_count(row_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE saved_routes SET click_count = click_count + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anon to call this function
GRANT EXECUTE ON FUNCTION increment_click_count(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION increment_click_count(BIGINT) TO authenticated;
