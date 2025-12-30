import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Split a path into segments when it crosses the dateline
// Interpolates points at ±180° to create seamless visual connection
function splitPathAtDateline(path) {
  if (!path || path.length === 0) return [];

  const segments = [];
  let currentSegment = [path[0]];

  for (let i = 1; i < path.length; i++) {
    const [prevLat, prevLon] = path[i - 1];
    const [currLat, currLon] = path[i];

    // Check if we crossed the dateline (longitude jump > 180°)
    const lonDiff = currLon - prevLon;

    if (Math.abs(lonDiff) > 180) {
      // Calculate interpolated latitude at the dateline
      // Distance from current point to the boundary / total crossing distance
      let crossingFraction;
      if (lonDiff < 0) {
        // Crossing from positive to negative (e.g., 178 to -172)
        // Go: 178 → 180 → -180 → -172
        crossingFraction = (180 - prevLon) / (360 - Math.abs(lonDiff));
      } else {
        // Crossing from negative to positive (e.g., -172 to 178)
        // Go: -172 → -180 → 180 → 178
        crossingFraction = (prevLon + 180) / (360 - Math.abs(lonDiff));
      }

      const crossingLat = prevLat + (currLat - prevLat) * crossingFraction;

      // Determine which side of dateline we're crossing to/from
      if (lonDiff < 0) {
        // Crossing from positive to negative (east to west in value)
        currentSegment.push([crossingLat, 180]);
        segments.push(currentSegment);
        currentSegment = [[crossingLat, -180], [currLat, currLon]];
      } else {
        // Crossing from negative to positive (west to east in value)
        currentSegment.push([crossingLat, -180]);
        segments.push(currentSegment);
        currentSegment = [[crossingLat, 180], [currLat, currLon]];
      }
    } else {
      currentSegment.push([currLat, currLon]);
    }
  }

  // Add the last segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

export default function MapComponent({ routes = [], projection = 'globe', mapStyle = 'streets-v12' }) {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2
  });

  // Fit bounds when routes are calculated
  useEffect(() => {
    if (routes.length > 0 && mapRef.current) {
      // Check if any routes have been calculated (have results)
      const calculatedRoutes = routes.filter(r => r.results && r.paths && r.paths.length > 0);

      if (calculatedRoutes.length === 0) return;

      const map = mapRef.current.getMap();

      // Collect all waypoints from calculated routes only
      const allWaypoints = [];
      calculatedRoutes.forEach(route => {
        route.waypoints?.forEach(wp => {
          if (wp && wp.lat && wp.lon) {
            allWaypoints.push([parseFloat(wp.lon), parseFloat(wp.lat)]);
          }
        });
      });

      if (allWaypoints.length > 1) {
        // Calculate bounds
        let lons = allWaypoints.map(w => w[0]);
        const lats = allWaypoints.map(w => w[1]);

        // Check if route crosses dateline
        const lonSpan = Math.max(...lons) - Math.min(...lons);

        if (lonSpan > 180) {
          // Route crosses dateline - convert negative longitudes to 180-360 range
          lons = lons.map(lon => lon < 0 ? lon + 360 : lon);

          // Calculate center longitude in 0-360 range
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          const centerLon = (minLon + maxLon) / 2;

          // Convert back to -180 to 180 range
          const normalizedCenterLon = centerLon > 180 ? centerLon - 360 : centerLon;

          // Calculate latitude center
          const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

          // Use flyTo for dateline-crossing routes instead of fitBounds
          map.flyTo({
            center: [normalizedCenterLon, centerLat],
            zoom: 3,
            duration: 1000
          });
        } else {
          // Normal bounds calculation for routes that don't cross dateline
          const bounds = [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)]
          ];

          map.fitBounds(bounds, {
            padding: 100,
            duration: 1000,
            maxZoom: 5
          });
        }
      }
    }
  }, [routes]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={mapStyle.startsWith('mapbox://styles/') ? mapStyle : `mapbox://styles/mapbox/${mapStyle}`}
      projection={projection}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Render all routes */}
      {routes.map((route, routeIndex) => (
        <div key={route.id}>
          {/* Render markers for this route's waypoints */}
          {route.waypoints?.filter(w => w && w.lat && w.lon).map((waypoint, wpIndex, arr) => {
            const isFirst = wpIndex === 0;
            const isLast = wpIndex === arr.length - 1;
            const color = isFirst ? '#10b981' : isLast ? '#ef4444' : route.color;
            const label = isFirst ? 'A' : isLast ? 'B' : String(wpIndex);

            return (
              <Marker
                key={`${route.id}-${wpIndex}`}
                longitude={parseFloat(waypoint.lon)}
                latitude={parseFloat(waypoint.lat)}
                anchor="bottom"
              >
                <div style={{
                  backgroundColor: color,
                  width: '30px',
                  height: '30px',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {label}
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Render paths for this route */}
          {route.paths?.map((path, pathIndex) => {
            if (!path || path.length === 0) return null;

            // Split path into segments at dateline crossings
            const segments = splitPathAtDateline(path);

            return segments.map((segment, segmentIndex) => {
              const pathGeoJSON = {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: segment.map(([lat, lon]) => [lon, lat])
                }
              };

              const lineLayer = {
                id: `route-${route.id}-path-${pathIndex}-seg-${segmentIndex}`,
                type: 'line',
                paint: {
                  'line-color': route.color,
                  'line-width': 3,
                  'line-opacity': 0.8
                }
              };

              return (
                <Source
                  key={`${route.id}-${pathIndex}-${segmentIndex}`}
                  id={`route-${route.id}-path-${pathIndex}-seg-${segmentIndex}`}
                  type="geojson"
                  data={pathGeoJSON}
                >
                  <Layer {...lineLayer} />
                </Source>
              );
            });
          })}
        </div>
      ))}
    </Map>
  );
}
