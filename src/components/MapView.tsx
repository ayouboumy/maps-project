import { useEffect, useState, useMemo, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName, t } from '../utils/translations';
import { ListOrdered, Navigation, Car, Footprints, Share2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// MultiStopRoute component for optimized routes
function MultiStopRoute({ stops, routeProfile = 'foot' }: { stops: [number, number][], routeProfile?: string }) {
  const [segments, setSegments] = useState<[number, number][][]>([]);
  
  useEffect(() => {
    if (stops.length < 2) return;
    
    let isMounted = true;
    const fetchFullTour = async () => {
      const allSegments: [number, number][][] = [];
      
      for (let i = 0; i < stops.length - 1; i++) {
        const start = stops[i];
        const end = stops[i+1];
        
        try {
          const profile = routeProfile === 'foot' ? 'foot' : 'driving';
          const baseUrl = profile === 'foot' 
            ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
            : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
          
          const response = await fetch(`${baseUrl}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
          const data = await response.json();
          
          if (isMounted && data.routes && data.routes.length > 0) {
            const bestRoute = data.routes[0];
            if (bestRoute.geometry) {
              const coords = bestRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
              allSegments.push(coords);
            }
          }
        } catch (e) {
          allSegments.push([start, end]);
        }
      }
      
      if (isMounted) setSegments(allSegments);
    };
    
    fetchFullTour();
    return () => { isMounted = false; };
  }, [stops, routeProfile]);

  const isDriving = routeProfile === 'driving';
  const color = isDriving ? '#4285F4' : '#1A73E8';
  const dashArray = isDriving ? undefined : "1, 14";

  return (
    <>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          <Polyline 
            positions={seg}
            color={isDriving ? '#174EA6' : '#FFFFFF'}
            weight={10}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
            dashArray={dashArray}
          />
          <Polyline 
            positions={seg}
            color={color}
            weight={6}
            opacity={1}
            lineCap="round"
            lineJoin="round"
            dashArray={dashArray}
          />
        </Fragment>
      ))}
    </>
  );
}

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const mosqueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const selectedMosqueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: 'animate-bounce-subtle'
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const selectedDestinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: 'animate-bounce-subtle'
});

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="width: 18px; height: 18px; background-color: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function MapController({ showNearest, nearestMosques, routingToMosque, selectedMosque }: { showNearest?: boolean, nearestMosques: any[], routingToMosque: any, selectedMosque: any }) {
  const { userLocation } = useAppStore();
  const map = useMap();

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  // Invalidate size on mount and when location changes to ensure correct rendering on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (routingToMosque && isUserLocationValid) {
      if (typeof routingToMosque.latitude === 'number' && typeof routingToMosque.longitude === 'number') {
        const bounds = L.latLngBounds([
          [userLocation.latitude, userLocation.longitude],
          [routingToMosque.latitude, routingToMosque.longitude]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (selectedMosque) {
      if (typeof selectedMosque.latitude === 'number' && typeof selectedMosque.longitude === 'number') {
        map.flyTo([selectedMosque.latitude, selectedMosque.longitude], 15, { duration: 1.5 });
      }
    } else if (showNearest && isUserLocationValid && nearestMosques.length > 0) {
      const validNearest = nearestMosques.filter(m => 
        typeof m.latitude === 'number' && !isNaN(m.latitude) &&
        typeof m.longitude === 'number' && !isNaN(m.longitude)
      );
      if (validNearest.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.latitude, userLocation.longitude],
          ...validNearest.map(m => [m.latitude, m.longitude] as [number, number])
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (!showNearest && isUserLocationValid && !routingToMosque) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation, isUserLocationValid, map, showNearest, nearestMosques, routingToMosque, selectedMosque]);

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

function RouteLine({ start, end, straightDistance, isMainRoute, routeProfile = 'foot', key }: { start: [number, number], end: [number, number], straightDistance: number, isMainRoute?: boolean, routeProfile?: string, key?: string }) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);
  const [routeDistance, setRouteDistance] = useState<number>(straightDistance);
  const { setRouteInfo, language, routeInfo } = useAppStore();

  const formatDurationInner = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h ${remainingMinutes} min`;
  };

  useEffect(() => {
    if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) {
      return;
    }
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const profile = routeProfile === 'foot' ? 'foot' : 'driving';
        const baseUrl = profile === 'foot' 
          ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
          : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
        
        const response = await fetch(`${baseUrl}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`);
        const data = await response.json();
        if (isMounted && data.routes && data.routes.length > 0) {
          // Find the route with the absolute shortest distance among all alternatives
          const bestRoute = data.routes.reduce((prev: any, current: any) => 
            (prev.distance < current.distance) ? prev : current
          );

          if (bestRoute.geometry) {
            const coords = bestRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
            setPositions(coords);
            if (bestRoute.distance) {
              setRouteDistance(bestRoute.distance);
              if (isMainRoute) {
                setRouteInfo({
                  distance: bestRoute.distance,
                  duration: bestRoute.duration
                });
              }
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

  const validPositions = positions.filter(p => p && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1]));
  if (validPositions.length < 2) return null;

  return (
    <>
      {/* Outer stroke (Casing/Halo) */}
      <Polyline 
        positions={validPositions}
        color={outerColor}
        weight={outerWeight}
        opacity={isMainRoute ? 1 : 0.8}
        lineCap="round"
        lineJoin="round"
        dashArray={dashArray}
      />
      {/* Inner colored stroke */}
      <Polyline 
        positions={validPositions}
        color={innerColor}
        weight={innerWeight}
        opacity={1}
        lineCap="round"
        lineJoin="round"
        dashArray={dashArray}
      >
        {isMainRoute && routeDistance > 0 && (
          <Tooltip 
            permanent 
            direction="top"
            className={cn(
              "border-none shadow-lg rounded-xl px-3 py-1.5 font-bold text-sm z-[1000] scale-110",
              isDriving ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
            )}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span>{formatDurationInner(routeInfo?.duration || Math.round(routeDistance / (isDriving ? 10 : 1.4)))}</span>
              <span className="opacity-75 text-xs">•</span>
              <span className="text-xs">{(routeDistance / 1000).toFixed(1)} km</span>
            </div>
          </Tooltip>
        )}
      </Polyline>
    </>
  );
}

export default function MapView({ showNearest }: { showNearest?: boolean }) {
  const { 
    mosques, userLocation, selectedMosque, setSelectedMosque, 
    language, routingToMosque, setRoutingToMosque, routeProfile, 
    selectedCommune, mapStyle, setMapStyle, optimizedRouteIds, 
    setOptimizedRouteIds, darkMode, routeInfo 
  } = useAppStore();
  const [zoom, setZoom] = useState(12);

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h ${remainingMinutes} min`;
  };

  // Simple Nearest Neighbor TSP Solver
  const handleOptimizeRoute = () => {
    if (!isUserLocationValid || nearestMosques.length === 0) return;
    
    const unvisited = [...nearestMosques];
    const tour: any[] = [];
    let currentPos = { latitude: userLocation.latitude, longitude: userLocation.longitude };
    
    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const d = getDistance(currentPos, { latitude: unvisited[i].latitude, longitude: unvisited[i].longitude });
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }
      
      const next = unvisited.splice(nearestIdx, 1)[0];
      tour.push(next.id);
      currentPos = { latitude: next.latitude, longitude: next.longitude };
    }
    
    setOptimizedRouteIds(tour);
    setRoutingToMosque(null);
  };

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  // Default center (Casablanca)
  const center = isUserLocationValid 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [33.5731, -7.5898] as [number, number];

  const filteredByCommune = useMemo(() => {
    const validMosques = mosques.filter(m => 
      typeof m.latitude === 'number' && !isNaN(m.latitude) && m.latitude !== 0 &&
      typeof m.longitude === 'number' && !isNaN(m.longitude) && m.longitude !== 0
    );
    if (!selectedCommune) return validMosques;
    return validMosques.filter(m => m.commune === selectedCommune);
  }, [mosques, selectedCommune]);

  const [roadDistances, setRoadDistances] = useState<Record<number, number>>({});
  const [roadDurations, setRoadDurations] = useState<Record<number, number>>({});

  const nearestMosques = useMemo(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0) return [];
    
    // First, get top 15 by straight line to limit API calls
    const withStraightDistance = filteredByCommune.map(mosque => {
      try {
        return {
          ...mosque,
          straightDistance: getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: mosque.latitude, longitude: mosque.longitude }
          )
        };
      } catch (e) {
        return { ...mosque, straightDistance: Infinity };
      }
    });

    const topCandidates = withStraightDistance
      .sort((a, b) => a.straightDistance - b.straightDistance)
      .slice(0, 15);

    // If we have road distances, use them for sorting. Otherwise, if we have durations, use them.
    const withRoadMetrics = topCandidates.map(m => ({
      ...m,
      distance: roadDistances[m.id] !== undefined ? roadDistances[m.id] : m.straightDistance,
      duration: roadDurations[m.id] !== undefined ? roadDurations[m.id] : Infinity
    }));

    return withRoadMetrics
      .sort((a, b) => {
        // If we have durations for both, sort by duration (fastest route)
        if (a.duration !== Infinity && b.duration !== Infinity) {
          return a.duration - b.duration;
        }
        // Otherwise sort by distance (road distance if available, else straight line)
        return a.distance - b.distance;
      })
      .slice(0, 3);
  }, [filteredByCommune, userLocation, roadDistances, roadDurations]);

  // Fetch road distances for top candidates
  useEffect(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0) return;

    const fetchRoadDistances = async () => {
      try {
        // Get top 15 by straight line
        const top15 = [...filteredByCommune]
          .map(m => {
            let d = Infinity;
            try {
              d = getDistance(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: m.latitude, longitude: m.longitude }
              );
            } catch (e) {}
            return {
              id: m.id,
              lat: m.latitude,
              lng: m.longitude,
              d
            };
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, 15);

        if (top15.length === 0) return;

        // We only need to check the top 5 to find the true top 3 nearest
        const top5 = top15.slice(0, 5);
        const distances: Record<number, number> = {};
        const durations: Record<number, number> = {};

        // Fetch individual routes for the top 5 candidates to get accurate distances for the selected profile
        // This is better than the table API because the public table API only supports driving
        const promises = top5.map(async (m) => {
          try {
            const profile = (routeProfile || 'foot') === 'foot' ? 'foot' : 'driving';
            const baseUrl = profile === 'foot' 
              ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
              : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
            
            const response = await fetch(`${baseUrl}/${userLocation.longitude},${userLocation.latitude};${m.lng},${m.lat}?overview=false&alternatives=true`);
            if (!response.ok) return null;
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              // Find the route with the shortest distance among all alternatives
              const bestRoute = data.routes.reduce((prev: any, current: any) => 
                (prev.distance < current.distance) ? prev : current
              );
              return { id: m.id, distance: bestRoute.distance, duration: bestRoute.duration };
            }
          } catch (e) {
            console.error(`Error fetching route for mosque ${m.id}:`, e);
          }
          return null;
        });

        const results = await Promise.all(promises);
        
        results.forEach(res => {
          if (res) {
            distances[res.id] = res.distance;
            durations[res.id] = res.duration;
          }
        });

        setRoadDistances(distances);
        setRoadDurations(durations);
      } catch (error) {
        console.error("Error fetching road distances:", error);
      }
    };

    fetchRoadDistances();
  }, [userLocation, filteredByCommune, routeProfile]);

  const displayedMosques = showNearest && isUserLocationValid ? nearestMosques : filteredByCommune;

  return (
    <div className="w-full h-full">
      <MapContainer 
        center={center} 
        zoom={12} 
        className="w-full h-full"
        zoomControl={false}
      >
        <ZoomListener onZoomChange={setZoom} />
        
        {mapStyle === 'street' && (
          <TileLayer
            attribution={darkMode 
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={darkMode 
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />
        )}
        {mapStyle === 'satellite' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        {mapStyle === 'terrain' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        
        {isUserLocationValid && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
          />
        )}

        {routingToMosque && isUserLocationValid && (
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

        {optimizedRouteIds && isUserLocationValid && (
          <MultiStopRoute 
            stops={[
              [userLocation.latitude, userLocation.longitude],
              ...optimizedRouteIds.map(id => {
                const m = mosques.find(msq => msq.id === id);
                return [m!.latitude, m!.longitude] as [number, number];
              })
            ]}
            routeProfile={routeProfile}
          />
        )}

        {showNearest && isUserLocationValid && !routingToMosque && !optimizedRouteIds && nearestMosques.map((mosque) => {
          if (typeof mosque.latitude !== 'number' || typeof mosque.longitude !== 'number') return null;
          return (
            <RouteLine 
              key={`route-${mosque.id}-${routeProfile}`}
              start={[userLocation.latitude, userLocation.longitude]}
              end={[mosque.latitude, mosque.longitude]}
              straightDistance={(mosque as any).distance || 0}
              routeProfile={routeProfile}
            />
          );
        })}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {displayedMosques
            .filter(m => !routingToMosque || m.id !== routingToMosque.id)
            .map((mosque) => (
              <Marker
                key={mosque.id}
                position={[mosque.latitude, mosque.longitude]}
                icon={(!routingToMosque && selectedMosque?.id === mosque.id) ? selectedMosqueIcon : mosqueIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedMosque(mosque);
                    setRoutingToMosque(null);
                  },
                }}
              >
                {(zoom >= 14 || showNearest) && (
                  <Tooltip 
                    direction="top" 
                    offset={[0, -10]} 
                    opacity={0.9} 
                    permanent 
                    className={cn(
                      "border-none shadow-md rounded px-2 py-1 transition-colors duration-300",
                      darkMode ? "!bg-gray-900 !text-white" : "!bg-white/90 !text-gray-800"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn(
                          "max-w-[100px] sm:max-w-[150px] truncate text-xs font-bold text-center transition-colors",
                          darkMode ? "text-white !text-white" : "text-gray-800"
                        )}
                        title={getLocalizedName(mosque, language)}
                      >
                        {getLocalizedName(mosque, language)}
                      </div>
                      {showNearest && roadDistances[mosque.id] !== undefined && (
                        <div className={cn(
                          "text-[10px] font-semibold mt-0.5 px-1.5 rounded flex items-center gap-1",
                          darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-600"
                        )}>
                          {roadDurations[mosque.id] !== undefined && (
                            <span>{formatDuration(roadDurations[mosque.id])} • </span>
                          )}
                          <span>{(roadDistances[mosque.id] / 1000).toFixed(1)} km</span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                )}
              </Marker>
            ))}
        </MarkerClusterGroup>

        {routingToMosque && (
          <Marker
            position={[routingToMosque.latitude, routingToMosque.longitude]}
            icon={(selectedMosque?.id === routingToMosque.id) ? selectedDestinationIcon : destinationIcon}
            eventHandlers={{
              click: () => {
                setSelectedMosque(routingToMosque);
              },
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={0.9} 
              permanent 
              className={cn(
                "border-none shadow-md rounded px-2 py-1 ring-2 ring-red-500 transition-colors duration-300",
                darkMode ? "bg-gray-800" : "bg-white/90"
              )}
            >
              <div className="flex flex-col items-center">
                <div 
                  className="max-w-[100px] sm:max-w-[150px] truncate text-xs font-bold text-center text-red-600"
                  title={getLocalizedName(routingToMosque, language)}
                >
                  {getLocalizedName(routingToMosque, language)}
                </div>
                {(routeInfo || roadDistances[routingToMosque.id] !== undefined) && (
                  <div className={cn(
                    "text-[10px] font-semibold mt-0.5 px-1.5 rounded flex items-center gap-1",
                    darkMode ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600"
                  )}>
                    {routeInfo ? (
                      <>
                        <span>{formatDuration(routeInfo.duration)} • </span>
                        <span>{(routeInfo.distance / 1000).toFixed(1)} km</span>
                      </>
                    ) : (
                      <>
                        {roadDurations[routingToMosque.id] !== undefined && (
                          <span>{formatDuration(roadDurations[routingToMosque.id])} • </span>
                        )}
                        <span>{(roadDistances[routingToMosque.id] / 1000).toFixed(1)} km</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Tooltip>
          </Marker>
        )}
        
        <MapController showNearest={showNearest} nearestMosques={nearestMosques} routingToMosque={routingToMosque} selectedMosque={selectedMosque} />
      </MapContainer>

      {/* Map Overlays for Multi-stop Routing */}
      <AnimatePresence>
        {(showNearest && !routingToMosque && nearestMosques.length > 1 && !optimizedRouteIds) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-max max-w-[90vw]"
          >
            <button
              onClick={handleOptimizeRoute}
              className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:bg-blue-700 transition-colors border-2 border-white/20 backdrop-blur-sm"
            >
              <ListOrdered size={20} />
              <span>{t('Optimize Route', language)}</span>
            </button>
          </motion.div>
        )}

        {optimizedRouteIds && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-max max-w-[90vw] flex flex-col gap-2 items-center"
          >
            <div className="bg-white/90 backdrop-blur-md border border-blue-100 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="flex -space-x-2">
                {optimizedRouteIds.slice(0, 3).map((id, i) => (
                  <div key={id} className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white z-[3-i]">
                    {i + 1}
                  </div>
                ))}
                {optimizedRouteIds.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                    +{optimizedRouteIds.length - 3}
                  </div>
                )}
              </div>
              <div className="text-sm font-bold text-gray-800">
                {optimizedRouteIds.length} {t('Mosques', language)}
              </div>
              <button
                onClick={() => setOptimizedRouteIds(null)}
                className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                title={t('Clear Optimized Route', language)}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <button
              onClick={() => {
                // Here we could open external maps with multiple waypoints if supported
                const waypoints = optimizedRouteIds.map(id => {
                  const m = mosques.find(msq => msq.id === id);
                  return `${m?.latitude},${m?.longitude}`;
                }).join('/');
                window.open(`https://www.google.com/maps/dir/${userLocation?.latitude},${userLocation?.longitude}/${waypoints}`, '_blank');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:bg-green-700 transition-colors border-2 border-white/20"
            >
              <Navigation size={20} />
              <span>{t('Start Tour', language)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
