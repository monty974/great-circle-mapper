export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set (first 20 chars): ' + process.env.SUPABASE_ANON_KEY?.substring(0, 20) : 'Missing',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'Set (first 20 chars): ' + process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) : 'Missing',
  };

  return res.status(200).json({
    message: 'Environment variable check',
    env,
    allEnvKeys: Object.keys(process.env).filter(key =>
      key.includes('SUPABASE') || key.includes('MAPBOX')
    )
  });
}
