import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName } from '../utils/translations';

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
  tooltipAnchor: [0, -28],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [0, -28],
  shadowSize: [41, 41]
});

function MapController({ showNearest, nearestMosques }: { showNearest?: boolean, nearestMosques: any[] }) {
  const { userLocation } = useAppStore();
  const map = useMap();

  useEffect(() => {
    if (showNearest && userLocation && nearestMosques.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        ...nearestMosques.map(m => [m.latitude, m.longitude] as [number, number])
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (!showNearest && userLocation) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation, map, showNearest, nearestMosques]);

  return null;
}

function ZoomListener({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  
  // Set initial zoom
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  
  return null;
}

export default function MapView({ showNearest }: { showNearest?: boolean }) {
  const { mosques, userLocation, setSelectedMosque, language } = useAppStore();
  const [zoom, setZoom] = useState(12);

  // Default center (Casablanca)
  const center = userLocation 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [33.5731, -7.5898] as [number, number];

  const nearestMosques = useMemo(() => {
    if (!userLocation || mosques.length === 0) return [];
    
    const withDistance = mosques.map(mosque => ({
      ...mosque,
      distance: getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: mosque.latitude, longitude: mosque.longitude }
      )
    }));

    return withDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [mosques, userLocation]);

  const displayedMosques = showNearest && userLocation ? nearestMosques : mosques;

  return (
    <div className="w-full h-full z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        className="w-full h-full"
        zoomControl={false}
      >
        <ZoomListener onZoomChange={setZoom} />
        
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

        {showNearest && userLocation && nearestMosques.map((mosque) => (
          <Polyline 
            key={`line-${mosque.id}`}
            positions={[
              [userLocation.latitude, userLocation.longitude],
              [mosque.latitude, mosque.longitude]
            ]}
            color="#059669"
            weight={3}
            dashArray="5, 10"
            opacity={0.7}
          >
            <Tooltip permanent direction="center" className="bg-white/90 border-none shadow-sm rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {((mosque as any).distance / 1000).toFixed(1)} km
            </Tooltip>
          </Polyline>
        ))}

        {displayedMosques.map((mosque) => (
          <Marker
            key={mosque.id}
            position={[mosque.latitude, mosque.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                setSelectedMosque(mosque);
              },
            }}
          >
            {(zoom >= 14 || showNearest) && (
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={0.9} 
                permanent 
                className="bg-white/90 border-none shadow-md rounded px-2 py-1"
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="max-w-[100px] sm:max-w-[150px] truncate text-xs font-bold text-gray-800 text-center"
                    title={getLocalizedName(mosque, language)}
                  >
                    {getLocalizedName(mosque, language)}
                  </div>
                </div>
              </Tooltip>
            )}
          </Marker>
        ))}
        
        <MapController showNearest={showNearest} nearestMosques={nearestMosques} />
      </MapContainer>
    </div>
  );
}
