import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [0, -28],
  shadowSize: [41, 41]
});

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="width: 18px; height: 18px; background-color: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function MapController({ showNearest, nearestMosques, routingToMosque, selectedMosque, displayedMosques }: { showNearest?: boolean, nearestMosques: any[], routingToMosque: any, selectedMosque: any, displayedMosques: any[] }) {
  const { userLocation } = useAppStore();
  const map = useMap();

  // Handle routing and selected mosque
  useEffect(() => {
    if (routingToMosque && userLocation) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [routingToMosque.latitude, routingToMosque.longitude]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (selectedMosque) {
      map.flyTo([selectedMosque.latitude, selectedMosque.longitude], 15, { duration: 1.5 });
    } else if (showNearest && userLocation && nearestMosques.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        ...nearestMosques.map(m => [m.latitude, m.longitude] as [number, number])
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routingToMosque, selectedMosque, showNearest, nearestMosques, userLocation, map]);

  // Handle displayed mosques changes (e.g., after import or commune filter)
  useEffect(() => {
    if (!routingToMosque && !selectedMosque && !showNearest && displayedMosques && displayedMosques.length > 0) {
      const bounds = L.latLngBounds(displayedMosques.map(m => [m.latitude, m.longitude] as [number, number]));
      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [displayedMosques, map]); // Only re-run when displayedMosques changes

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

function RouteLine({ start, end, straightDistance, isMainRoute, routeProfile = 'foot' }: { start: [number, number], end: [number, number], straightDistance: number, key?: string, isMainRoute?: boolean, routeProfile?: string }) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);
  const [routeDistance, setRouteDistance] = useState<number>(straightDistance);
  const { setRouteInfo } = useAppStore();

  useEffect(() => {
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/${routeProfile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (isMounted && data.routes && data.routes[0] && data.routes[0].geometry) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setPositions(coords);
          if (data.routes[0].distance) {
            setRouteDistance(data.routes[0].distance);
            if (isMainRoute) {
              setRouteInfo({
                distance: data.routes[0].distance,
                duration: data.routes[0].duration
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };
    fetchRoute();
    return () => { isMounted = false; };
  }, [start[0], start[1], end[0], end[1], isMainRoute, setRouteInfo, routeProfile]);

  // Clean up route info when unmounting if it's the main route
  useEffect(() => {
    return () => {
      if (isMainRoute) {
        setRouteInfo(null);
      }
    };
  }, [isMainRoute, setRouteInfo]);

  const isDriving = routeProfile === 'driving';
  
  // Google Maps Colors
  const mainInnerColor = isDriving ? '#4285F4' : '#1A73E8'; // Google Blue
  const mainOuterColor = isDriving ? '#174EA6' : '#FFFFFF'; // Dark blue casing for driving, white halo for walking
  
  const altInnerColor = '#80868B'; // Gray
  const altOuterColor = '#5F6368'; // Dark Gray

  const innerColor = isMainRoute ? mainInnerColor : altInnerColor;
  const outerColor = isMainRoute ? mainOuterColor : altOuterColor;

  const innerWeight = isDriving ? 6 : 6;
  const outerWeight = isDriving ? 10 : 10;

  const dashArray = isDriving ? undefined : (isMainRoute ? "1, 14" : "5, 12");

  return (
    <>
      {/* Outer stroke (Casing/Halo) */}
      <Polyline 
        positions={positions}
        color={outerColor}
        weight={outerWeight}
        opacity={isMainRoute ? 1 : 0.8}
        lineCap="round"
        lineJoin="round"
        dashArray={dashArray}
      />
      {/* Inner colored stroke */}
      <Polyline 
        positions={positions}
        color={innerColor}
        weight={innerWeight}
        opacity={1}
        lineCap="round"
        lineJoin="round"
        dashArray={dashArray}
      >
        {!isMainRoute && (
          <Tooltip permanent direction="center" className="bg-white/90 border-none shadow-sm rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
            {(routeDistance / 1000).toFixed(1)} km
          </Tooltip>
        )}
      </Polyline>
    </>
  );
}

export default function MapView({ showNearest }: { showNearest?: boolean }) {
  const { mosques, userLocation, selectedMosque, setSelectedMosque, language, routingToMosque, setRoutingToMosque, routeProfile, selectedCommune } = useAppStore();
  const [zoom, setZoom] = useState(12);

  // Default center (Casablanca)
  const center = userLocation 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [33.5731, -7.5898] as [number, number];

  const filteredByCommune = useMemo(() => {
    if (!selectedCommune) return mosques;
    return mosques.filter(m => m.commune === selectedCommune);
  }, [mosques, selectedCommune]);

  const nearestMosques = useMemo(() => {
    if (!userLocation || filteredByCommune.length === 0) return [];
    
    const withDistance = filteredByCommune.map(mosque => ({
      ...mosque,
      distance: getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: mosque.latitude, longitude: mosque.longitude }
      )
    }));

    return withDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [filteredByCommune, userLocation]);

  const displayedMosques = showNearest && userLocation ? nearestMosques : filteredByCommune;

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
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
          />
        )}

        {routingToMosque && userLocation && (
          <RouteLine 
            key={`route-single-${routingToMosque.id}-${routeProfile}`}
            start={[userLocation.latitude, userLocation.longitude]}
            end={[routingToMosque.latitude, routingToMosque.longitude]}
            straightDistance={getDistance(
              { latitude: userLocation.latitude, longitude: userLocation.longitude },
              { latitude: routingToMosque.latitude, longitude: routingToMosque.longitude }
            )}
            isMainRoute={true}
            routeProfile={routeProfile}
          />
        )}

        {showNearest && userLocation && !routingToMosque && nearestMosques.map((mosque) => (
          <RouteLine 
            key={`route-${mosque.id}-${routeProfile}`}
            start={[userLocation.latitude, userLocation.longitude]}
            end={[mosque.latitude, mosque.longitude]}
            straightDistance={(mosque as any).distance}
            routeProfile={routeProfile}
          />
        ))}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
          {displayedMosques.map((mosque) => {
            const isDestination = routingToMosque && routingToMosque.id === mosque.id;
            return (
              <Marker
                key={mosque.id}
                position={[mosque.latitude, mosque.longitude]}
                icon={isDestination ? destinationIcon : customIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedMosque(mosque);
                    setRoutingToMosque(null); // Clear routing when selecting a new mosque
                  },
                }}
              >
                {(zoom >= 14 || showNearest || isDestination) && (
                  <Tooltip 
                    direction="top" 
                    offset={[0, -10]} 
                    opacity={0.9} 
                    permanent 
                    className={`bg-white/90 border-none shadow-md rounded px-2 py-1 ${isDestination ? 'ring-2 ring-red-500' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div 
                        className={`max-w-[100px] sm:max-w-[150px] truncate text-xs font-bold text-center ${isDestination ? 'text-red-600' : 'text-gray-800'}`}
                        title={mosque.name}
                      >
                        {mosque.name}
                      </div>
                    </div>
                  </Tooltip>
                )}
              </Marker>
            );
          })}
        </MarkerClusterGroup>
        
        <MapController showNearest={showNearest} nearestMosques={nearestMosques} routingToMosque={routingToMosque} selectedMosque={selectedMosque} displayedMosques={displayedMosques} />
      </MapContainer>
    </div>
  );
}
