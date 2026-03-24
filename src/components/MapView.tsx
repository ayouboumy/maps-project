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

function RouteLine({ start, end, straightDistance }: { start: [number, number], end: [number, number], straightDistance: number }) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);
  const [routeDistance, setRouteDistance] = useState<number>(straightDistance);

  useEffect(() => {
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (isMounted && data.routes && data.routes[0] && data.routes[0].geometry) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setPositions(coords);
          if (data.routes[0].distance) {
            setRouteDistance(data.routes[0].distance);
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };
    fetchRoute();
    return () => { isMounted = false; };
  }, [start[0], start[1], end[0], end[1]]);

  return (
    <Polyline 
      positions={positions}
      color="#059669"
      weight={4}
      opacity={0.8}
      dashArray={positions.length === 2 ? "5, 10" : undefined}
    >
      <Tooltip permanent direction="center" className="bg-white/90 border-none shadow-sm rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
        {(routeDistance / 1000).toFixed(1)} km
      </Tooltip>
    </Polyline>
  );
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
          <RouteLine 
            key={`route-${mosque.id}`}
            start={[userLocation.latitude, userLocation.longitude]}
            end={[mosque.latitude, mosque.longitude]}
            straightDistance={(mosque as any).distance}
          />
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
