import { useState } from 'react';
import Map from './components/Map';
import AirportSearch from './components/AirportSearch';
import {
  calculateDistance,
  calculateBearing,
  generateGreatCirclePath,
  formatDistance,
  formatTravelTime,
  formatBearing
} from './utils/greatCircle';

function App() {
  const [origin, setOrigin] = useState({
    lat: '',
    lon: '',
    name: ''
  });

  const [destination, setDestination] = useState({
    lat: '',
    lon: '',
    name: ''
  });

  const [speed, setSpeed] = useState(900); // Default: commercial aircraft speed
  const [results, setResults] = useState(null);
  const [path, setPath] = useState(null);
  const [clickMode, setClickMode] = useState('origin'); // 'origin' or 'destination'
  const [projection, setProjection] = useState('globe'); // 'globe' or 'mercator'

  const handleCalculate = () => {
    const lat1 = parseFloat(origin.lat);
    const lon1 = parseFloat(origin.lon);
    const lat2 = parseFloat(destination.lat);
    const lon2 = parseFloat(destination.lon);
    const speedValue = parseFloat(speed);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) || isNaN(speedValue)) {
      alert('Please enter valid coordinates and speed');
      return;
    }

    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const bearing = calculateBearing(lat1, lon1, lat2, lon2);
    const distances = formatDistance(distance);
    const travelTime = formatTravelTime(distance, speedValue);

    setResults({
      distance: distances,
      bearing: formatBearing(bearing),
      travelTime
    });

    // Generate path for visualization
    const greatCirclePath = generateGreatCirclePath(lat1, lon1, lat2, lon2, 100);
    setPath(greatCirclePath);
  };

  const handleClear = () => {
    setOrigin({ lat: '', lon: '', name: '' });
    setDestination({ lat: '', lon: '', name: '' });
    setSpeed(900);
    setResults(null);
    setPath(null);
  };

  const handleMapClick = (latlng) => {
    if (clickMode === 'origin') {
      setOrigin({
        ...origin,
        lat: latlng.lat.toFixed(4),
        lon: latlng.lng.toFixed(4)
      });
      setClickMode('destination');
    } else {
      setDestination({
        ...destination,
        lat: latlng.lat.toFixed(4),
        lon: latlng.lng.toFixed(4)
      });
      setClickMode('origin');
    }
  };

  const getMapOrigin = () => {
    if (origin.lat && origin.lon) {
      return {
        lat: parseFloat(origin.lat),
        lon: parseFloat(origin.lon),
        name: origin.name
      };
    }
    return null;
  };

  const getMapDestination = () => {
    if (destination.lat && destination.lon) {
      return {
        lat: parseFloat(destination.lat),
        lon: parseFloat(destination.lon),
        name: destination.name
      };
    }
    return null;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Great Circle Calculator</h1>
        <p>Calculate the shortest path between two points on Earth</p>
      </header>

      <div className="main-content">
        <div className="input-panel">
          <div className="input-section">
            <h2>Origin Airport</h2>
            <AirportSearch
              label="Search Origin Airport"
              value={origin}
              onChange={setOrigin}
              placeholder="Enter airport code, name, or city..."
            />
          </div>

          <div className="input-section">
            <h2>Destination Airport</h2>
            <AirportSearch
              label="Search Destination Airport"
              value={destination}
              onChange={setDestination}
              placeholder="Enter airport code, name, or city..."
            />
          </div>

          <div className="input-section">
            <h2>Travel Parameters</h2>
            <div className="input-group">
              <label htmlFor="speed">Average Speed (km/h):</label>
              <input
                type="number"
                id="speed"
                placeholder="e.g., 900"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                step="1"
                min="1"
              />
            </div>
            <small>Typical speeds: Commercial aircraft ~900 km/h, Ship ~40 km/h</small>
          </div>

          <button className="btn-primary" onClick={handleCalculate}>
            Calculate Great Circle
          </button>
          <button className="btn-secondary" onClick={handleClear}>
            Clear
          </button>

          {results && (
            <div className="results">
              <h2>Results</h2>
              <div className="result-item">
                <span className="result-label">Distance:</span>
                <span className="result-value">{results.distance.km} km</span>
              </div>
              <div className="result-item">
                <span className="result-label">Distance (miles):</span>
                <span className="result-value">{results.distance.miles} mi</span>
              </div>
              <div className="result-item">
                <span className="result-label">Distance (nautical miles):</span>
                <span className="result-value">{results.distance.nauticalMiles} nm</span>
              </div>
              <div className="result-item">
                <span className="result-label">Travel Time:</span>
                <span className="result-value">{results.travelTime}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Initial Bearing:</span>
                <span className="result-value">{results.bearing}</span>
              </div>
            </div>
          )}
        </div>

        <div className="map-panel">
          <Map
            origin={getMapOrigin()}
            destination={getMapDestination()}
            path={path}
            onMapClick={handleMapClick}
            projection={projection}
          />
          <div className="map-instructions">
            Click on map to set {clickMode === 'origin' ? 'origin' : 'destination'} point
          </div>
          <div className="map-controls">
            <button
              className={`projection-toggle ${projection === 'globe' ? 'active' : ''}`}
              onClick={() => setProjection('globe')}
              title="3D Globe View"
            >
              🌍 Globe
            </button>
            <button
              className={`projection-toggle ${projection === 'mercator' ? 'active' : ''}`}
              onClick={() => setProjection('mercator')}
              title="Flat Map View"
            >
              🗺️ Flat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
