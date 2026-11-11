import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const SLUG_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SLUG_LENGTH = 7;
const LIST_COLUMNS = 'id,name,url,slug,route_count,click_count,created_at';

function generateSlug() {
  const bytes = randomBytes(SLUG_LENGTH);
  let slug = '';
  for (const b of bytes) slug += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
  return slug;
}

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

function getSupabase() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel environment variables.');
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabaseClient = getSupabase();

    // GET - Fetch a single route by short slug or legacy long URL
    if (req.method === 'GET' && (req.query.slug || req.query.legacy_url)) {
      const { slug, legacy_url } = req.query;
      let query = supabaseClient.from('saved_routes').select('id,slug,name,data');
      query = slug ? query.eq('slug', slug) : query.eq('legacy_url', legacy_url);
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Supabase error (GET route by slug):', error);
        return res.status(500).json({ error: 'Database error', message: error.message });
      }
      if (!data) {
        return res.status(404).json({ error: 'Route not found' });
      }
      return res.status(200).json(data);
    }

    // GET - Fetch all saved routes (most recent first)
    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('saved_routes')
        .select(LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Supabase error (GET saved routes):', error);
        return res.status(500).json({
          error: 'Database error',
          message: error.message
        });
      }

      return res.status(200).json(data || []);
    }

    // POST - Create a new saved route with a short link
    if (req.method === 'POST') {
      const { name, data: routeData, base_url, route_count } = req.body;

      if (!name || !routeData || typeof routeData !== 'object' || !base_url || typeof base_url !== 'string') {
        return res.status(400).json({ error: 'Missing required fields: name, data, base_url' });
      }

      // Retry on the (very unlikely) slug collision
      let lastError;
      for (let attempt = 0; attempt < 5; attempt++) {
        const slug = generateSlug();
        const { data, error } = await supabaseClient
          .from('saved_routes')
          .insert([{
            name,
            slug,
            data: routeData,
            url: `${base_url}?r=${slug}`,
            route_count: route_count || 1
          }])
          .select(LIST_COLUMNS)
          .single();

        if (!error) {
          return res.status(201).json(data);
        }
        lastError = error;
        if (error.code !== '23505') break; // only retry unique violations
      }

      console.error('Supabase error (POST saved route):', lastError);
      return res.status(500).json({
        error: 'Database error',
        message: lastError.message,
        details: lastError.details,
        hint: lastError.hint,
        code: lastError.code
      });
    }

    // PATCH - Increment click count when a shared link is opened
    if (req.method === 'PATCH') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Missing route ID' });
      }

      const { error } = await supabaseClient.rpc('increment_click_count', { row_id: parseInt(id) });

      if (error) {
        console.error('Supabase error (PATCH click count):', error);
        return res.status(500).json({ error: 'Database error', message: error.message });
      }

      return res.status(200).json({ success: true });
    }

    // DELETE - Delete a saved route by ID (requires authentication)
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Missing route ID' });
      }

      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);

      // Verify the token with Supabase
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Create an authenticated Supabase client using the user's token
      // This ensures the request runs as 'authenticated' role for RLS
      const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      // User is authenticated, proceed with delete
      const { error } = await authenticatedClient
        .from('saved_routes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error (DELETE saved route):', error);
        return res.status(500).json({
          error: 'Database error',
          message: error.message
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message,
      stack: error.stack
    });
  }
}
