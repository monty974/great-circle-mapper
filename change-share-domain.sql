-- Point all saved short links at the canonical domain.
-- legacy_url is left alone so old long links keep matching.
UPDATE saved_routes
SET url = regexp_replace(url, '^https?://[^/]+', 'https://gcmap.jetmap.au')
WHERE slug IS NOT NULL;

SELECT id, url FROM saved_routes ORDER BY id ASC;
