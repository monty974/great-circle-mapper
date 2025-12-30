import { useState, useEffect } from 'react';
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

const ROUTE_COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Encode routes to URL-safe string
function encodeRoutesToURL(routes, speed, projection, mapStyle, viewState) {
  const data = {
    routes: routes.map(r => ({
      id: r.id,
      name: r.name,
      waypoints: r.waypoints.filter(w => w).map(w => ({
        lat: w.lat,
        lon: w.lon,
        code: w.code,
        name: w.name
      }))
    })),
    speed,
    projection,
    mapStyle,
    viewState: {
      longitude: viewState.longitude,
      latitude: viewState.latitude,
      zoom: viewState.zoom
    }
  };
  return btoa(JSON.stringify(data));
}

// Decode routes from URL-safe string
function decodeRoutesFromURL(encoded) {
  try {
    const data = JSON.parse(atob(encoded));
    return data;
  } catch (e) {
    console.error('Failed to decode route data:', e);
    return null;
  }
}

function App() {
  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: 'Route 1',
      waypoints: [null, null], // Start with origin and destination
      color: ROUTE_COLORS[0],
      results: null,
      paths: []
    }
  ]);

  const [speed, setSpeed] = useState(900);
  const [projection, setProjection] = useState('globe');
  const [mapStyle, setMapStyle] = useState('streets-v12');
  const [activeRouteId, setActiveRouteId] = useState(1);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2
  });

  const activeRoute = routes.find(r => r.id === activeRouteId);

  const addWaypoint = (routeId) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId) {
        const newWaypoints = [...route.waypoints];
        newWaypoints.splice(newWaypoints.length - 1, 0, null); // Insert before last (destination)
        return { ...route, waypoints: newWaypoints };
      }
      return route;
    }));
  };

  const removeWaypoint = (routeId, index) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId && route.waypoints.length > 2) {
        const newWaypoints = route.waypoints.filter((_, i) => i !== index);
        return { ...route, waypoints: newWaypoints };
      }
      return route;
    }));
  };

  const updateWaypoint = (routeId, index, airport) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId) {
        const newWaypoints = [...route.waypoints];
        newWaypoints[index] = airport;
        return { ...route, waypoints: newWaypoints };
      }
      return route;
    }));
  };

  const addRoute = () => {
    const newId = Math.max(...routes.map(r => r.id)) + 1;
    const colorIndex = routes.length % ROUTE_COLORS.length;

    setRoutes([...routes, {
      id: newId,
      name: `Route ${newId}`,
      waypoints: [null, null],
      color: ROUTE_COLORS[colorIndex],
      results: null,
      paths: []
    }]);
    setActiveRouteId(newId);
  };

  const removeRoute = (routeId) => {
    if (routes.length === 1) return;

    const newRoutes = routes.filter(r => r.id !== routeId);
    setRoutes(newRoutes);

    if (activeRouteId === routeId) {
      setActiveRouteId(newRoutes[0].id);
    }
  };

  const calculateRoute = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    const validWaypoints = route.waypoints.filter(w => w && w.lat && w.lon);

    if (validWaypoints.length < 2) {
      alert('Please select at least origin and destination airports');
      return;
    }

    const speedValue = parseFloat(speed);
    let totalDistance = 0;
    const paths = [];
    const segments = [];

    // Calculate each leg
    for (let i = 0; i < validWaypoints.length - 1; i++) {
      const from = validWaypoints[i];
      const to = validWaypoints[i + 1];

      const distance = calculateDistance(
        parseFloat(from.lat),
        parseFloat(from.lon),
        parseFloat(to.lat),
        parseFloat(to.lon)
      );

      const bearing = calculateBearing(
        parseFloat(from.lat),
        parseFloat(from.lon),
        parseFloat(to.lat),
        parseFloat(to.lon)
      );

      const path = generateGreatCirclePath(
        parseFloat(from.lat),
        parseFloat(from.lon),
        parseFloat(to.lat),
        parseFloat(to.lon),
        100
      );

      totalDistance += distance;
      paths.push(path);

      segments.push({
        from: from.code || from.name,
        to: to.code || to.name,
        distance: formatDistance(distance),
        bearing: formatBearing(bearing)
      });
    }

    const distances = formatDistance(totalDistance);
    const travelTime = formatTravelTime(totalDistance, speedValue);

    setRoutes(routes.map(r => {
      if (r.id === routeId) {
        return {
          ...r,
          results: {
            distance: distances,
            travelTime,
            segments,
            totalDistance
          },
          paths
        };
      }
      return r;
    }));
  };

  const calculateAllRoutes = () => {
    // Calculate all routes that have at least 2 valid waypoints
    const speedValue = parseFloat(speed);

    setRoutes(routes.map(route => {
      const validWaypoints = route.waypoints.filter(w => w && w.lat && w.lon);

      if (validWaypoints.length < 2) {
        return route; // Skip routes without enough waypoints
      }

      let totalDistance = 0;
      const paths = [];
      const segments = [];

      // Calculate each leg
      for (let i = 0; i < validWaypoints.length - 1; i++) {
        const from = validWaypoints[i];
        const to = validWaypoints[i + 1];

        const distance = calculateDistance(
          parseFloat(from.lat),
          parseFloat(from.lon),
          parseFloat(to.lat),
          parseFloat(to.lon)
        );

        const bearing = calculateBearing(
          parseFloat(from.lat),
          parseFloat(from.lon),
          parseFloat(to.lat),
          parseFloat(to.lon)
        );

        const path = generateGreatCirclePath(
          parseFloat(from.lat),
          parseFloat(from.lon),
          parseFloat(to.lat),
          parseFloat(to.lon),
          100
        );

        totalDistance += distance;
        paths.push(path);

        segments.push({
          from: from.code || from.name,
          to: to.code || to.name,
          distance: formatDistance(distance),
          bearing: formatBearing(bearing)
        });
      }

      const distances = formatDistance(totalDistance);
      const travelTime = formatTravelTime(totalDistance, speedValue);

      return {
        ...route,
        results: {
          distance: distances,
          travelTime,
          segments,
          totalDistance
        },
        paths
      };
    }));
  };

  const handleShare = () => {
    const encoded = encodeRoutesToURL(routes, speed, projection, mapStyle, viewState);
    const url = `${window.location.origin}${window.location.pathname}?route=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      // Fallback: show URL in prompt
      prompt('Copy this link to share:', url);
    });
  };

  // Load routes from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('route');

    if (encoded) {
      const data = decodeRoutesFromURL(encoded);

      if (data) {
        // Reconstruct routes with proper structure and auto-calculate
        const speedValue = parseFloat(data.speed || 900);

        const loadedRoutes = data.routes.map((r, index) => {
          const validWaypoints = r.waypoints.filter(w => w && w.lat && w.lon);

          if (validWaypoints.length < 2) {
            return {
              id: r.id,
              name: r.name,
              waypoints: r.waypoints,
              color: ROUTE_COLORS[index % ROUTE_COLORS.length],
              results: null,
              paths: []
            };
          }

          // Calculate route immediately
          let totalDistance = 0;
          const paths = [];
          const segments = [];

          for (let i = 0; i < validWaypoints.length - 1; i++) {
            const from = validWaypoints[i];
            const to = validWaypoints[i + 1];

            const distance = calculateDistance(
              parseFloat(from.lat),
              parseFloat(from.lon),
              parseFloat(to.lat),
              parseFloat(to.lon)
            );

            const bearing = calculateBearing(
              parseFloat(from.lat),
              parseFloat(from.lon),
              parseFloat(to.lat),
              parseFloat(to.lon)
            );

            const path = generateGreatCirclePath(
              parseFloat(from.lat),
              parseFloat(from.lon),
              parseFloat(to.lat),
              parseFloat(to.lon),
              100
            );

            totalDistance += distance;
            paths.push(path);

            segments.push({
              from: from.code || from.name,
              to: to.code || to.name,
              distance: formatDistance(distance),
              bearing: formatBearing(bearing)
            });
          }

          const distances = formatDistance(totalDistance);
          const travelTime = formatTravelTime(totalDistance, speedValue);

          return {
            id: r.id,
            name: r.name,
            waypoints: r.waypoints,
            color: ROUTE_COLORS[index % ROUTE_COLORS.length],
            results: {
              distance: distances,
              travelTime,
              segments,
              totalDistance
            },
            paths
          };
        });

        setRoutes(loadedRoutes);
        setSpeed(speedValue);
        setActiveRouteId(loadedRoutes[0]?.id || 1);

        // Restore projection and map style if provided
        if (data.projection) {
          setProjection(data.projection);
        }
        if (data.mapStyle) {
          setMapStyle(data.mapStyle);
        }
        // Restore view state (zoom, center) if provided
        if (data.viewState) {
          setViewState({
            longitude: data.viewState.longitude || 0,
            latitude: data.viewState.latitude || 20,
            zoom: data.viewState.zoom || 2
          });
        }
      }
    }
  }, []); // Empty dependency array - only run on mount

  const handleClear = () => {
    setRoutes(routes.map(route => ({
      ...route,
      waypoints: route.waypoints.map(() => null),
      results: null,
      paths: []
    })));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Great Circle Calculator</h1>
        <p>Compare multi-leg flight routes</p>
      </header>

      <div className="main-content">
        <div className="input-panel">
          {/* Route Tabs */}
          <div className="route-tabs">
            {routes.map(route => (
              <div
                key={route.id}
                className={`route-tab ${activeRouteId === route.id ? 'active' : ''}`}
                onClick={() => setActiveRouteId(route.id)}
                style={{
                  borderBottomColor: activeRouteId === route.id ? route.color : 'transparent'
                }}
              >
                <span className="route-dot" style={{ backgroundColor: route.color }}></span>
                {route.name}
                {routes.length > 1 && (
                  <button
                    className="remove-route-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRoute(route.id);
                    }}
                    title="Remove route"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button className="add-route-btn" onClick={addRoute} title="Add route">
              + Add Route
            </button>
          </div>

          {/* Waypoints for Active Route */}
          {activeRoute && (
            <>
              {activeRoute.waypoints.map((waypoint, index) => (
                <div key={index} className="waypoint-section">
                  <div className="waypoint-header">
                    <h2>
                      {index === 0 ? 'Origin' :
                       index === activeRoute.waypoints.length - 1 ? 'Destination' :
                       `Stop ${index}`}
                    </h2>
                    {index > 0 && index < activeRoute.waypoints.length - 1 && (
                      <button
                        className="remove-waypoint-btn"
                        onClick={() => removeWaypoint(activeRoute.id, index)}
                        title="Remove stop"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <AirportSearch
                    label={`Search Airport`}
                    value={waypoint}
                    onChange={(airport) => updateWaypoint(activeRoute.id, index, airport)}
                    placeholder="Enter airport code, name, or city..."
                  />
                </div>
              ))}

              <button
                className="btn-secondary add-waypoint-btn"
                onClick={() => addWaypoint(activeRoute.id)}
              >
                + Add Stop
              </button>

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

              <button
                className="btn-primary"
                onClick={calculateAllRoutes}
              >
                {routes.length > 1 ? 'Calculate All Routes' : 'Calculate Route'}
              </button>
              <button className="btn-secondary" onClick={handleClear}>
                Clear All
              </button>
              <button
                className="btn-secondary"
                onClick={handleShare}
                disabled={!routes.some(r => r.waypoints.some(w => w))}
                title="Copy shareable link to clipboard"
              >
                📋 Share Link
              </button>

              {/* Results for All Routes */}
              {routes.filter(r => r.results).map(route => (
                <div key={route.id} className="results" style={{ borderLeftColor: route.color }}>
                  <h2>
                    <span className="route-dot" style={{ backgroundColor: route.color }}></span>
                    {route.name} Results
                  </h2>
                  <div className="result-item">
                    <span className="result-label">Total Distance:</span>
                    <span className="result-value">{route.results.distance.km} km</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Distance (miles):</span>
                    <span className="result-value">{route.results.distance.miles} mi</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Distance (nautical miles):</span>
                    <span className="result-value">{route.results.distance.nauticalMiles} nm</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Travel Time:</span>
                    <span className="result-value">{route.results.travelTime}</span>
                  </div>

                  {route.results.segments && route.results.segments.length > 0 && (
                    <div className="segments">
                      <h3>Segments</h3>
                      {route.results.segments.map((seg, idx) => (
                        <div key={idx} className="segment-item">
                          <strong>{seg.from} → {seg.to}</strong>
                          <div className="segment-details">
                            {seg.distance.km} km • {seg.bearing}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Comparison Table */}
          {routes.filter(r => r.results).length > 1 && (
            <div className="comparison">
              <h2>Route Comparison</h2>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Distance</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.filter(r => r.results).map(route => (
                    <tr key={route.id}>
                      <td>
                        <span className="route-dot" style={{ backgroundColor: route.color }}></span>
                        {route.name}
                      </td>
                      <td>{route.results.distance.km} km</td>
                      <td>{route.results.travelTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="map-panel">
          <Map
            routes={routes.filter(r => r.paths.length > 0)}
            projection={projection}
            mapStyle={mapStyle}
            viewState={viewState}
            onViewStateChange={setViewState}
          />
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
          <div className="map-controls" style={{ bottom: '70px' }}>
            <button
              className={`projection-toggle ${mapStyle === 'streets-v12' ? 'active' : ''}`}
              onClick={() => setMapStyle('streets-v12')}
              title="Street Map"
            >
              Streets
            </button>
            <button
              className={`projection-toggle ${mapStyle === 'satellite-streets-v12' ? 'active' : ''}`}
              onClick={() => setMapStyle('satellite-streets-v12')}
              title="Satellite with Streets"
            >
              Satellite
            </button>
            <button
              className={`projection-toggle ${mapStyle === 'mapbox://styles/nicklg/cmjs2o2qr009o01sg2042gza4' ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/nicklg/cmjs2o2qr009o01sg2042gza4')}
              title="Blue Sea & Yellow Land"
            >
              Plain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
