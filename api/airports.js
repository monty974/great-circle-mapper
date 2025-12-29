import { createClient } from '@supabase/supabase-js';

// Create Supabase client
// For Vercel serverless functions, use non-VITE prefixed env vars
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { search, code } = req.query;

  try {
    const supabaseClient = getSupabase();

    console.log('API called with:', { search, code });

    // If searching by specific airport code
    if (code) {
      const codeUpper = code.toUpperCase();

      const { data, error } = await supabaseClient
        .from('airports')
        .select('*')
        .or(`iata.eq.${codeUpper},icao.eq.${codeUpper}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Supabase error (code search):', error);
        return res.status(500).json({
          error: 'Database error',
          message: error.message
        });
      }

      if (!data) {
        return res.status(404).json({ error: 'Airport not found' });
      }

      return res.status(200).json(data);
    }

    // If searching by name/code (autocomplete)
    if (search) {
      const searchTerm = search.trim();

      if (searchTerm.length < 2) {
        return res.status(200).json([]);
      }

      // Try simpler approach: fetch matching airports using text pattern
      const pattern = `%${searchTerm}%`;

      const { data, error } = await supabaseClient
        .from('airports')
        .select('iata, icao, name, city, country, latitude, longitude')
        .or(`iata.ilike.${pattern},icao.ilike.${pattern},name.ilike.${pattern},city.ilike.${pattern}`)
        .limit(20);

      if (error) {
        console.error('Supabase search error:', error);

        // Fallback: try fetching without OR filter
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from('airports')
          .select('iata, icao, name, city, country, latitude, longitude')
          .ilike('name', pattern)
          .limit(20);

        if (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
          return res.status(500).json({
            error: 'Database error',
            message: fallbackError.message
          });
        }

        console.log('Fallback search found:', fallbackData?.length || 0, 'airports');
        return res.status(200).json(fallbackData || []);
      }

      console.log('Search found:', data?.length || 0, 'airports');
      return res.status(200).json(data || []);
    }

    // Return popular airports if no search term
    const { data, error } = await supabaseClient
      .from('airports')
      .select('iata, icao, name, city, country, latitude, longitude')
      .not('iata', 'is', null)
      .order('name')
      .limit(50);

    if (error) {
      console.error('Supabase error (popular airports):', error);
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    return res.status(200).json(data || []);

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message
    });
  }
}
