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

    // If searching by specific airport code
    if (code) {
      const codeUpper = code.toUpperCase();

      // Try exact match on IATA first
      let { data, error } = await supabaseClient
        .from('airports')
        .select('*')
        .eq('iata', codeUpper)
        .limit(1)
        .maybeSingle();

      // If not found, try ICAO
      if (!data && !error) {
        const result = await supabaseClient
          .from('airports')
          .select('*')
          .eq('icao', codeUpper)
          .limit(1)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }

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

      // Fetch all airports and filter in JavaScript (simple but works)
      const { data, error } = await supabaseClient
        .from('airports')
        .select('iata, icao, name, city, country, latitude, longitude')
        .limit(1000);

      if (error) {
        console.error('Supabase search error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: error.message
        });
      }

      // Filter results in JavaScript
      const searchLower = searchTerm.toLowerCase();
      const results = (data || [])
        .filter(airport => {
          return (
            airport.iata?.toLowerCase().includes(searchLower) ||
            airport.icao?.toLowerCase().includes(searchLower) ||
            airport.name?.toLowerCase().includes(searchLower) ||
            airport.city?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 20);

      console.log('Search for', searchTerm, 'found', results.length, 'airports');
      return res.status(200).json(results);
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
      message: error.message,
      stack: error.stack
    });
  }
}
