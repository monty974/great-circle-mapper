import { createClient } from '@supabase/supabase-js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabaseClient = getSupabase();

    // GET - Fetch all saved routes (most recent first)
    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('saved_routes')
        .select('*')
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

    // POST - Create a new saved route
    if (req.method === 'POST') {
      const { name, url, route_count } = req.body;

      if (!name || !url) {
        return res.status(400).json({ error: 'Missing required fields: name, url' });
      }

      console.log('Attempting to insert route:', { name, url, route_count });

      const { data, error } = await supabaseClient
        .from('saved_routes')
        .insert([{
          name,
          url,
          route_count: route_count || 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error (POST saved route):', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return res.status(500).json({
          error: 'Database error',
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }

      console.log('Route saved successfully:', data);

      return res.status(201).json(data);
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

      // User is authenticated, proceed with delete
      const { error } = await supabaseClient
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
