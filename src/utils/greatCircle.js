// Great Circle calculations using the Haversine formula

const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers

/**
 * Convert degrees to radians
 */
export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Calculate the great circle distance between two points
 * Uses the Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate the initial bearing from point 1 to point 2
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (toDegrees(θ) + 360) % 360;

  return bearing;
}

/**
 * Calculate an intermediate point along the great circle path
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @param {number} fraction - Fraction of the distance (0-1)
 * @returns {object} {lat, lon} of the intermediate point
 */
export function intermediatePoint(lat1, lon1, lat2, lon2, fraction) {
  const φ1 = toRadians(lat1);
  const λ1 = toRadians(lon1);
  const φ2 = toRadians(lat2);
  const λ2 = toRadians(lon2);

  const Δφ = φ2 - φ1;
  const Δλ = λ2 - λ1;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const A = Math.sin((1 - fraction) * δ) / Math.sin(δ);
  const B = Math.sin(fraction * δ) / Math.sin(δ);

  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);

  const φ3 = Math.atan2(z, Math.sqrt(x * x + y * y));
  const λ3 = Math.atan2(y, x);

  return {
    lat: toDegrees(φ3),
    lon: toDegrees(λ3)
  };
}

/**
 * Normalize longitude to -180 to 180 range
 * @param {number} lon - Longitude in degrees
 * @returns {number} Normalized longitude
 */
function normalizeLongitude(lon) {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

/**
 * Generate points along the great circle path
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @param {number} numPoints - Number of points to generate
 * @returns {Array} Array of [lat, lon] points
 */
export function generateGreatCirclePath(lat1, lon1, lat2, lon2, numPoints = 100) {
  const points = [];

  // Normalize input longitudes
  lon1 = normalizeLongitude(lon1);
  lon2 = normalizeLongitude(lon2);

  // Adjust lon2 if crossing dateline to ensure shortest path
  let adjustedLon2 = lon2;
  const lonDiff = lon2 - lon1;

  if (lonDiff > 180) {
    adjustedLon2 = lon2 - 360;
  } else if (lonDiff < -180) {
    adjustedLon2 = lon2 + 360;
  }

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const point = intermediatePoint(lat1, lon1, lat2, adjustedLon2, fraction);

    // Normalize the output longitude
    const normalizedLon = normalizeLongitude(point.lon);
    points.push([point.lat, normalizedLon]);
  }

  return points;
}

/**
 * Format distance in different units
 * @param {number} km - Distance in kilometers
 * @returns {object} Distance in km, miles, and nautical miles
 */
export function formatDistance(km) {
  return {
    km: km.toFixed(2),
    miles: (km * 0.621371).toFixed(2),
    nauticalMiles: (km * 0.539957).toFixed(2)
  };
}

/**
 * Format travel time
 * @param {number} km - Distance in kilometers
 * @param {number} speedKmh - Speed in km/h
 * @returns {string} Formatted time string
 */
export function formatTravelTime(km, speedKmh) {
  const hours = km / speedKmh;

  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  } else {
    const days = Math.floor(hours / 24);
    const h = Math.floor(hours % 24);
    return `${days}d ${h}h`;
  }
}

/**
 * Format bearing as compass direction
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (e.g., "NE", "SW")
 */
export function formatBearing(bearing) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return `${bearing.toFixed(1)}° (${directions[index]})`;
}
