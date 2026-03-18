import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController() {
  const { userLocation, mosques, setSelectedMosque } = useAppStore();
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 13);
      
      // Find nearest mosque
      if (mosques.length > 0) {
        let nearest = mosques[0];
        let minDistance = getDistance(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: nearest.latitude, longitude: nearest.longitude }
        );

        for (let i = 1; i < mosques.length; i++) {
          const dist = getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: mosques[i].latitude, longitude: mosques[i].longitude }
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearest = mosques[i];
          }
        }
        
        // Optionally highlight or select nearest
        // setSelectedMosque(nearest);
      }
    }
  }, [userLocation, map, mosques]);

  return null;
}

export default function MapView() {
  const { mosques, userLocation, setSelectedMosque } = useAppStore();

  // Default center (Casablanca)
  const center = userLocation 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [33.5731, -7.5898] as [number, number];

  return (
    <div className="w-full h-full z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
          />
        )}

        {mosques.map((mosque) => (
          <Marker
            key={mosque.id}
            position={[mosque.latitude, mosque.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                setSelectedMosque(mosque);
              },
            }}
          />
        ))}
        
        <MapController />
      </MapContainer>
    </div>
  );
}
