import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName, t } from '../utils/translations';
import { Mosque } from '../types';

// Mapbox Token
const rawToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
// Mapbox GL JS usually expects a Public Token (pk). 
// Secret tokens (sk) are intended for server-side use and may fail in the browser.
mapboxgl.accessToken = rawToken;

interface MapboxMapViewProps {
  showNearest?: boolean;
}

export default function MapboxMapView({ showNearest }: MapboxMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { 
    mosques, userLocation, selectedMosque, setSelectedMosque, 
    language, routingToMosque, setRoutingToMosque, 
    routeProfile, selectedCommune, mapStyle 
  } = useAppStore();

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [pulseRadius, setPulseRadius] = useState(1);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const { setMapProvider } = useAppStore();

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  const filteredByCommune = useMemo(() => {
    const validMosques = mosques.filter(m => 
      typeof m.latitude === 'number' && !isNaN(m.latitude) && m.latitude !== 0 &&
      typeof m.longitude === 'number' && !isNaN(m.longitude) && m.longitude !== 0
    );
    if (!selectedCommune) return validMosques;
    return validMosques.filter(m => m.commune === selectedCommune);
  }, [mosques, selectedCommune]);

  // Calculate nearest mosques for routing lines
  const nearestMosques = useMemo(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0 || !showNearest) return [];
    
    const withStraightDistance = filteredByCommune.map(mosque => ({
      ...mosque,
      straightDistance: getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: mosque.latitude, longitude: mosque.longitude }
      )
    }));

    return withStraightDistance
      .sort((a, b) => a.straightDistance - b.straightDistance)
      .slice(0, 3);
  }, [filteredByCommune, userLocation, isUserLocationValid, showNearest]);

  // Selected Marker Pulse Animation
  useEffect(() => {
    if (!selectedMosque) return;
    
    let frameId: number;
    let startTimestamp: number;
    
    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = (timestamp - startTimestamp) % 2000; // 2 second cycle
      const scale = 1 + (Math.sin(progress * Math.PI / 1000) * 0.5 + 0.5); // 1.0 to 2.0
      setPulseRadius(scale);
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [selectedMosque]);

  // Sync animation to map layer
  useEffect(() => {
    if (!selectedMosque || !mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;
    
    if (map.getLayer('selected-mosque-outer')) {
      map.setPaintProperty('selected-mosque-outer', 'circle-radius', [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 15 * pulseRadius,
        15, 25 * pulseRadius
      ]);
      map.setPaintProperty('selected-mosque-outer', 'circle-opacity', 0.4 / pulseRadius);
    }
  }, [pulseRadius, selectedMosque, isMapLoaded]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check for secret token which Mapbox GL JS rejects
    if (rawToken.startsWith('sk.')) {
      setTokenError('Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*).');
      return;
    }

    if (!rawToken) {
      setTokenError('Mapbox Access Token is missing.');
      return;
    }

    let map: mapboxgl.Map | null = null;

    try {
      const initialCenter: [number, number] = isUserLocationValid 
        ? [userLocation.longitude, userLocation.latitude]
        : [-7.5898, 33.5731]; // Casablanca

      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v11' :
               mapStyle === 'terrain' ? 'mapbox://styles/mapbox/outdoors-v11' :
               'mapbox://styles/mapbox/streets-v11',
        center: initialCenter,
        zoom: 12,
        antialias: false,
        pitch: 45,
        bearing: 0,
        trackResize: true,
        fadeDuration: 200,
        collectResourceTiming: false,
        localIdeographFontFamily: "'Arial', 'Inter', sans-serif",
        preserveDrawingBuffer: false,
      });

      map.on('load', () => {
        setIsMapLoaded(true);
        
        if (!map) return;

        // Add 3D Terrain source
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
        }
        
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Add Sky layer
        if (!map.getLayer('sky')) {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });
        }
      });

      map.on('error', (e) => {
        const msg = e.error?.message || e.error || String(e);
        console.error('Mapbox Error:', msg);
        if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('unauthorized')) {
          setTokenError(msg);
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Mapbox Init Error:', err);
      setTokenError(err instanceof Error ? err.message : String(err));
    }

    return () => {
      if (map) map.remove();
    };
  }, []);

  // Sync Map Style
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const style = mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v11' :
                  mapStyle === 'terrain' ? 'mapbox://styles/mapbox/outdoors-v11' :
                  'mapbox://styles/mapbox/streets-v11';
    mapRef.current.setStyle(style);
  }, [mapStyle, isMapLoaded]);

  // Update Data Source for Markers & Clustering
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;

    // Convert mosques to GeoJSON
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: filteredByCommune.map(m => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [m.longitude, m.latitude]
        },
        properties: {
          id: m.id,
          name: getLocalizedName(m, language),
          type: m.type
        }
      }))
    };

    if (map.getSource('mosques')) {
      (map.getSource('mosques') as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('mosques', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster Layer
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'mosques',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Cluster Count Text
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'mosques',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        }
      });

      // Unclustered Point Layer (Mosques)
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'mosques',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#10b981', // emerald-500
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Mosque Labels (visible when zoomed in)
      map.addLayer({
        id: 'mosque-labels',
        type: 'symbol',
        source: 'mosques',
        filter: ['!', ['has', 'point_count']],
        minzoom: 14,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Click Events
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties?.cluster_id;
        (map.getSource('mosques') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: zoom
            });
          }
        );
      });

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const id = feature.properties?.id;
        const mosque = mosques.find(m => m.id === id);
        if (mosque) {
          setSelectedMosque(mosque);
          setRoutingToMosque(null);
          
          map.flyTo({
            center: [mosque.longitude, mosque.latitude],
            zoom: 15,
            duration: 1500,
            essential: true
          });
        }
      });

      // Hover Effects
      map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
      map.on('mouseenter', 'unclustered-point', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'unclustered-point', () => map.getCanvas().style.cursor = '');
    }
  }, [filteredByCommune, isMapLoaded, language]);

  // Selected Mosque & User Location Highlights
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    // User Location Marker
    if (isUserLocationValid) {
      if (!map.getSource('user-location')) {
        map.addSource('user-location', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [userLocation.longitude, userLocation.latitude] },
            properties: {}
          }
        });
        map.addLayer({
          id: 'user-location-layer',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-color': '#4285F4',
            'circle-radius': 8,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff'
          }
        });
      } else {
        (map.getSource('user-location') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [userLocation.longitude, userLocation.latitude] },
          properties: {}
        });
      }
    }

    // Highlight Selected Mosque
    if (selectedMosque) {
      const selectedGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [selectedMosque.longitude, selectedMosque.latitude] },
          properties: {}
        }]
      };

      if (!map.getSource('selected-mosque')) {
        map.addSource('selected-mosque', { type: 'geojson', data: selectedGeoJSON });
        map.addLayer({
          id: 'selected-mosque-outer',
          type: 'circle',
          source: 'selected-mosque',
          paint: {
            'circle-color': '#ef4444',
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 15 * pulseRadius,
              15, 25 * pulseRadius
            ],
            'circle-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.4 / pulseRadius,
              15, 0.3 / pulseRadius
            ]
          }
        });
        map.addLayer({
          id: 'selected-mosque-inner',
          type: 'circle',
          source: 'selected-mosque',
          paint: {
            'circle-color': '#ef4444',
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });
      } else {
        (map.getSource('selected-mosque') as mapboxgl.GeoJSONSource).setData(selectedGeoJSON);
      }
    } else if (map.getSource('selected-mosque')) {
      (map.getSource('selected-mosque') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
    }

  }, [selectedMosque, userLocation, isUserLocationValid, isMapLoaded]);

  // Routing Implementation
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !routingToMosque || !isUserLocationValid) {
      if (mapRef.current?.getSource('route')) {
         (mapRef.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
           type: 'FeatureCollection',
           features: []
         });
      }
      return;
    }

    const map = mapRef.current;

    const fetchRoute = async () => {
      try {
        const profile = routeProfile === 'foot' ? 'foot' : 'driving';
        const baseUrl = profile === 'foot' 
          ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
          : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
        
        const response = await fetch(`${baseUrl}/${userLocation.longitude},${userLocation.latitude};${routingToMosque.longitude},${routingToMosque.latitude}?overview=full&geometries=geojson`);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0].geometry;
          
          if (!map.getSource('route')) {
            map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: route, properties: {} } });
            map.addLayer({
              id: 'route-line-casing',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#FFFFFF',
                'line-width': 10,
                'line-opacity': 0.8
              }
            });
            map.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#4285F4',
                'line-width': 6,
                'line-dasharray': profile === 'foot' ? [0.5, 2] : []
              }
            });
          } else {
            (map.getSource('route') as mapboxgl.GeoJSONSource).setData({ type: 'Feature', geometry: route, properties: {} });
          }

          // Fit Bounds
          const coordinates = route.coordinates;
          const bounds = coordinates.reduce((acc: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return acc.extend(coord);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          map.fitBounds(bounds, { padding: 50 });
        }
      } catch (error) {
        console.error('Error fetching Mapbox route:', error);
      }
    };

    fetchRoute();
  }, [routingToMosque, userLocation, isUserLocationValid, isMapLoaded, routeProfile]);

  // Controller Logic (Nearest & Selected)
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    if (selectedMosque && !routingToMosque) {
       map.flyTo({
         center: [selectedMosque.longitude, selectedMosque.latitude],
         zoom: 15,
         duration: 1500
       });
    } else if (showNearest && isUserLocationValid) {
       // Logic to find nearest mosques and fit bounds
       // (Simplified for now to just fly to user if no specific nearest logic is passed down)
       map.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 14 });
    }
  }, [selectedMosque, showNearest, isUserLocationValid, isMapLoaded]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="absolute inset-0" />
      
      {tokenError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm text-center">
          <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t(language, 'mapbox_token_error')}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {tokenError.includes('sk.') 
                ? "You are using a Secret Token (sk.*). Mapbox GL JS requires a Public Token (pk.*) to render maps in the browser."
                : tokenError}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => setMapProvider('leaflet')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
              >
                {t(language, 'switch_to_leaflet')}
              </button>
              <p className="text-[10px] text-slate-400">
                You can change your token in the app settings or .env file.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Visual Indicator for Selected Mosque in Mapbox */}
      {selectedMosque && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
             <span className="text-xs font-bold text-emerald-900 truncate max-w-[200px]">
               {getLocalizedName(selectedMosque, language)}
             </span>
          </div>
        </div>
      )}
    </div>
  );
}
