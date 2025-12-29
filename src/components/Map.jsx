import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Layer style for the great circle path
const lineLayer = {
  id: 'great-circle-route',
  type: 'line',
  paint: {
    'line-color': '#667eea',
    'line-width': 3,
    'line-opacity': 0.8
  }
};

export default function MapComponent({ origin, destination, path, onMapClick, projection = 'globe' }) {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2
  });

  // Fit bounds when both origin and destination are set
  useEffect(() => {
    if (origin && destination && mapRef.current) {
      const map = mapRef.current.getMap();

      const bounds = [
        [Math.min(origin.lon, destination.lon), Math.min(origin.lat, destination.lat)],
        [Math.max(origin.lon, destination.lon), Math.max(origin.lat, destination.lat)]
      ];

      map.fitBounds(bounds, {
        padding: 100,
        duration: 1000
      });
    }
  }, [origin, destination]);

  const handleMapClick = (event) => {
    if (onMapClick) {
      onMapClick({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng
      });
    }
  };

  // Convert path to GeoJSON for the line layer
  const pathGeoJSON = path && path.length > 0 ? {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: path.map(([lat, lon]) => [lon, lat])
    }
  } : null;

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      onClick={handleMapClick}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      projection={projection}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Origin Marker (Green) */}
      {origin && (
        <Marker
          longitude={origin.lon}
          latitude={origin.lat}
          anchor="bottom"
        >
          <div style={{
            backgroundColor: '#10b981',
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
              A
            </div>
          </div>
        </Marker>
      )}

      {/* Destination Marker (Red) */}
      {destination && (
        <Marker
          longitude={destination.lon}
          latitude={destination.lat}
          anchor="bottom"
        >
          <div style={{
            backgroundColor: '#ef4444',
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
              B
            </div>
          </div>
        </Marker>
      )}

      {/* Great Circle Path */}
      {pathGeoJSON && (
        <Source id="route" type="geojson" data={pathGeoJSON}>
          <Layer {...lineLayer} />
        </Source>
      )}
    </Map>
  );
}
