import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

function getSupabase() {
  if (!supabase) {
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
      const { data, error } = await supabaseClient
        .from('airports')
        .select('*')
        .or(`iata.ilike.${code},icao.ilike.${code}`)
        .limit(1)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Airport not found' });
      }

      return res.status(200).json(data);
    }

    // If searching by name/code (autocomplete)
    if (search) {
      const { data, error } = await supabaseClient
        .from('airports')
        .select('iata, icao, name, city, country, latitude, longitude')
        .or(`iata.ilike.%${search}%,icao.ilike.%${search}%,name.ilike.%${search}%,city.ilike.%${search}%`)
        .order('name')
        .limit(20);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: error.message
        });
      }

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
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    return res.status(200).json(data || []);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
}
