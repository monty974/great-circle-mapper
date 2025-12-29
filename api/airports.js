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
      const searchTerm = search.trim().toUpperCase();

      if (searchTerm.length < 2) {
        return res.status(200).json([]);
      }

      // Search across multiple fields using separate queries and combine
      const promises = [
        // Search IATA codes
        supabaseClient
          .from('airports')
          .select('iata, icao, name, city, country, latitude, longitude')
          .ilike('iata', `${searchTerm}%`)
          .limit(10),

        // Search ICAO codes
        supabaseClient
          .from('airports')
          .select('iata, icao, name, city, country, latitude, longitude')
          .ilike('icao', `${searchTerm}%`)
          .limit(10),

        // Search airport names
        supabaseClient
          .from('airports')
          .select('iata, icao, name, city, country, latitude, longitude')
          .ilike('name', `%${searchTerm}%`)
          .limit(10),

        // Search city names
        supabaseClient
          .from('airports')
          .select('iata, icao, name, city, country, latitude, longitude')
          .ilike('city', `%${searchTerm}%`)
          .limit(10),
      ];

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Supabase search errors:', errors);
        return res.status(500).json({
          error: 'Database error',
          message: errors[0].error.message
        });
      }

      // Combine and deduplicate results
      const allData = results.flatMap(r => r.data || []);
      const uniqueAirports = Array.from(
        new Map(
          allData.map(airport => [
            airport.iata || airport.icao,
            airport
          ])
        ).values()
      );

      // Sort: prioritize exact matches, then by name
      const sorted = uniqueAirports.sort((a, b) => {
        const aCode = (a.iata || a.icao || '').toUpperCase();
        const bCode = (b.iata || b.icao || '').toUpperCase();

        // Exact match on IATA/ICAO comes first
        if (aCode === searchTerm && bCode !== searchTerm) return -1;
        if (bCode === searchTerm && aCode !== searchTerm) return 1;

        // Starts with search term comes next
        if (aCode.startsWith(searchTerm) && !bCode.startsWith(searchTerm)) return -1;
        if (bCode.startsWith(searchTerm) && !aCode.startsWith(searchTerm)) return 1;

        // Otherwise sort by name
        return (a.name || '').localeCompare(b.name || '');
      });

      const limited = sorted.slice(0, 20);

      console.log('Search for', searchTerm, 'found', limited.length, 'airports');
      return res.status(200).json(limited);
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
