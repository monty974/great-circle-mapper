import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapComponent({ routes = [], projection = 'globe' }) {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2
  });

  // Fit bounds when routes are added
  useEffect(() => {
    if (routes.length > 0 && mapRef.current) {
      const map = mapRef.current.getMap();

      // Collect all waypoints from all routes
      const allWaypoints = [];
      routes.forEach(route => {
        route.waypoints?.forEach(wp => {
          if (wp && wp.lat && wp.lon) {
            allWaypoints.push([parseFloat(wp.lon), parseFloat(wp.lat)]);
          }
        });
      });

      if (allWaypoints.length > 1) {
        // Calculate bounds
        const lons = allWaypoints.map(w => w[0]);
        const lats = allWaypoints.map(w => w[1]);

        const bounds = [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)]
        ];

        map.fitBounds(bounds, {
          padding: 100,
          duration: 1000
        });
      }
    }
  }, [routes]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
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

            const pathGeoJSON = {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: path.map(([lat, lon]) => [lon, lat])
              }
            };

            const lineLayer = {
              id: `route-${route.id}-path-${pathIndex}`,
              type: 'line',
              paint: {
                'line-color': route.color,
                'line-width': 3,
                'line-opacity': 0.8
              }
            };

            return (
              <Source
                key={`${route.id}-${pathIndex}`}
                id={`route-${route.id}-path-${pathIndex}`}
                type="geojson"
                data={pathGeoJSON}
              >
                <Layer {...lineLayer} />
              </Source>
            );
          })}
        </div>
      ))}
    </Map>
  );
}
