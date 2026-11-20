-- ============================================
-- SHORT SHARE LINKS + CONVERT EXISTING LINKS
-- ============================================
-- Run this in the Supabase SQL Editor BEFORE deploying the new code.
-- It is safe to run more than once.
--
-- Shared links change from
--   https://site/?route=<very long base64>
-- to
--   https://site/?r=aB3xK9z
--
-- Existing rows are converted automatically: their route data is decoded
-- into the new `data` column, they get a slug, and their `url` is rewritten
-- to the short form. The original long URL is kept in `legacy_url`, so old
-- long links you've already shared keep working (and now redirect the
-- address bar to the short link).
-- ============================================

ALTER TABLE saved_routes ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE saved_routes ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE saved_routes ADD COLUMN IF NOT EXISTS legacy_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_routes_slug ON saved_routes(slug);

-- Convert existing long-link rows
DO $$
DECLARE
  r RECORD;
  b64 TEXT;
  decoded JSONB;
  new_slug TEXT;
BEGIN
  FOR r IN SELECT id, url FROM saved_routes WHERE slug IS NULL AND url LIKE '%?route=%' LOOP
    BEGIN
      b64 := substring(r.url from 'route=([^&#]+)');
      decoded := convert_from(decode(b64, 'base64'), 'UTF8')::jsonb;

      -- 7 random chars; retry in the unlikely event of a collision
      LOOP
        new_slug := substr(md5(random()::text || r.id::text), 1, 7);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM saved_routes WHERE slug = new_slug);
      END LOOP;

      UPDATE saved_routes
      SET legacy_url = r.url,
          data = decoded,
          slug = new_slug,
          url = regexp_replace(r.url, '\?route=.*$', '?r=' || new_slug)
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not convert row % (%): left unchanged', r.id, SQLERRM;
    END;
  END LOOP;
END $$;

SELECT COUNT(*) FILTER (WHERE slug IS NOT NULL) AS converted,
       COUNT(*) FILTER (WHERE slug IS NULL)     AS not_converted
FROM saved_routes;
