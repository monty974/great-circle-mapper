import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for origin and destination
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit bounds when markers change
function FitBounds({ origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [origin, destination, map]);

  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e) => {
      onMapClick(e.latlng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

export default function Map({ origin, destination, path, onMapClick }) {
  const center = [20, 0]; // Center of the world
  const zoom = 2;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

      {origin && (
        <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
          <Popup>
            <strong>{origin.name || 'Origin'}</strong><br />
            Lat: {origin.lat.toFixed(4)}<br />
            Lon: {origin.lon.toFixed(4)}
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lon]} icon={destinationIcon}>
          <Popup>
            <strong>{destination.name || 'Destination'}</strong><br />
            Lat: {destination.lat.toFixed(4)}<br />
            Lon: {destination.lon.toFixed(4)}
          </Popup>
        </Marker>
      )}

      {path && path.length > 0 && (
        <Polyline
          positions={path}
          color="#667eea"
          weight={3}
          opacity={0.8}
        />
      )}

      {origin && destination && <FitBounds origin={origin} destination={destination} />}
    </MapContainer>
  );
}
