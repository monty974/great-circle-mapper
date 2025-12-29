import pkg from 'pg';
const { Pool } = pkg;

// Create a connection pool
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
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
    const dbPool = getPool();

    // If searching by specific airport code
    if (code) {
      const result = await dbPool.query(
        `SELECT * FROM airports
         WHERE UPPER(iata_code) = UPPER($1) OR UPPER(icao_code) = UPPER($1)
         LIMIT 1`,
        [code]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Airport not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // If searching by name/code (autocomplete)
    if (search) {
      const searchTerm = `%${search}%`;
      const result = await dbPool.query(
        `SELECT
          iata_code,
          icao_code,
          name,
          city,
          country,
          latitude,
          longitude
         FROM airports
         WHERE
          UPPER(iata_code) LIKE UPPER($1) OR
          UPPER(icao_code) LIKE UPPER($1) OR
          UPPER(name) LIKE UPPER($1) OR
          UPPER(city) LIKE UPPER($1)
         ORDER BY
          CASE
            WHEN UPPER(iata_code) = UPPER($2) THEN 1
            WHEN UPPER(icao_code) = UPPER($2) THEN 2
            WHEN UPPER(iata_code) LIKE UPPER($1) THEN 3
            WHEN UPPER(name) LIKE UPPER($1) THEN 4
            ELSE 5
          END
         LIMIT 20`,
        [searchTerm, search]
      );

      return res.status(200).json(result.rows);
    }

    // Return popular airports if no search term
    const result = await dbPool.query(
      `SELECT
        iata_code,
        icao_code,
        name,
        city,
        country,
        latitude,
        longitude
       FROM airports
       WHERE iata_code IS NOT NULL
       ORDER BY name
       LIMIT 50`
    );

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
}
