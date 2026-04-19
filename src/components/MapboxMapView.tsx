import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName, t } from '../utils/translations';
import { Mosque } from '../types';

// Fix Arabic text rendering BEFORE map initializes
if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
  mapboxgl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js',
    (error) => {
      if (error) console.warn('Error loading Mapbox RTL Text Plugin:', error);
    },
    true // Lazy load the plugin
  );
}

// Mapbox Token
const getMapboxToken = (manualToken: string | null) => {
  if (manualToken) {
    console.log('Mapbox token detection: Using Manual Fallback');
    return manualToken;
  }
  const token = (
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 
    (typeof process !== 'undefined' ? process.env.VITE_MAPBOX_ACCESS_TOKEN : '') ||
    ''
  ).trim();
  console.log('Mapbox token detection:', token ? 'Success (Env Var starts with ' + token.substring(0, 3) + ')' : 'Failed (None found)');
  return token;
};

interface MapboxMapViewProps {
  showNearest?: boolean;
}

export default function MapboxMapView({ showNearest }: MapboxMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  const { 
    mosques, userLocation, selectedMosque, setSelectedMosque, 
    language, routingToMosque, setRoutingToMosque, 
    routeProfile, selectedCommune, mapStyle,
    manualMapboxToken, setManualMapboxToken, setMapProvider
  } = useAppStore();

  const rawToken = useMemo(() => {
    return getMapboxToken(manualMapboxToken).trim();
  }, [manualMapboxToken]);

  mapboxgl.accessToken = rawToken;

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [pulseRadius, setPulseRadius] = useState(1);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [inputToken, setInputToken] = useState('');

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
    if (rawToken && rawToken.startsWith('sk.')) {
      setTokenError('Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*).');
      return;
    }

    if (!rawToken || rawToken.trim() === '') {
      setTokenError('Mapbox Access Token is missing. Please set VITE_MAPBOX_ACCESS_TOKEN in your secrets.');
      return;
    }

    if (!mapboxgl.supported()) {
      setTokenError('Your browser or device does not support WebGL, which is required for Mapbox GL JS.');
      return;
    }

    let map: mapboxgl.Map | null = null;
    mapboxgl.accessToken = rawToken;

    // Loading timeout
    const loadTimeout = setTimeout(() => {
      if (!isMapLoaded && !tokenError && mapContainerRef.current) {
        console.warn('Mapbox load timeout triggered');
        // We don't necessarily want to set an error yet as it might just be slow, 
        // but it's good for logging.
      }
    }, 10000);

    const initialCenter: [number, number] = isUserLocationValid 
      ? [userLocation.longitude, userLocation.latitude]
      : [-7.5898, 33.5731]; // Casablanca

    try {
      console.log('Initializing Mapbox with center:', initialCenter, 'and focus token:', rawToken.substring(0, 8));

      // Create map
      console.log('Attempting to create Mapbox map instance...');
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' :
               mapStyle === 'terrain' ? 'mapbox://styles/mapbox/outdoors-v12' :
               'mapbox://styles/mapbox/light-v11', // Cleaner style by default
        center: initialCenter,
        zoom: 12,
        pitch: 45,
      });

      // Handle initialization errors that don't throw immediately
      map.on('error', (e) => {
        const rawMsg = e.error?.message || e.error || String(e);
        const msg = String(rawMsg);
        console.error('Mapbox runtime error:', msg);
        
        // Show error in UI if it seems critical
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('token') || 
            lowerMsg.includes('unauthorized') || 
            lowerMsg.includes('failed to fetch style') ||
            lowerMsg.includes('403') ||
            lowerMsg.includes('401')) {
          setTokenError(`Mapbox Error: ${msg}`);
        }
      });

      map.on('load', () => {
        console.log('Mapbox load event SUCCESS');
        setIsMapLoaded(true);
        map?.resize();
        
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

        // Add Sky layer for atmospheric depth
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

      mapRef.current = map;
    } catch (err) {
      console.error('Mapbox Init Error:', err);
      setTokenError(err instanceof Error ? err.message : String(err));
    }

    return () => {
      try {
        if (map) map.remove();
      } catch (e) {
        console.warn('Mapbox removal cleanup error:', e);
      }
    };
  }, []);

  // Sync Map Style
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const style = mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' :
                  mapStyle === 'terrain' ? 'mapbox://styles/mapbox/outdoors-v12' :
                  'mapbox://styles/mapbox/light-v11';
    
    // If map is already loaded, we update style and wait for it to finish loading
    if (isMapLoaded) {
      setIsMapLoaded(false);
      map.setStyle(style);
      
      const onStyleLoad = () => {
        setIsMapLoaded(true);
        // Re-add 3D terrain on style change
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        map.off('style.load', onStyleLoad);
      };
      
      map.on('style.load', onStyleLoad);
    }
  }, [mapStyle]);

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

    const setupLayers = () => {
      if (!map.getSource('mosques')) {
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
            'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
            'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
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
            'circle-color': '#10b981',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });

        // Click Events
        map.on('click', 'clusters', handleClusterClick);
        map.on('click', 'unclustered-point', handlePointClick);
        map.on('mouseenter', 'clusters', handleEnter);
        map.on('mouseleave', 'clusters', handleLeave);
        map.on('mouseenter', 'unclustered-point', handleEnter);
        map.on('mouseleave', 'unclustered-point', handleLeave);
      } else {
        (map.getSource('mosques') as mapboxgl.GeoJSONSource).setData(geojson);
      }
    };

    const handleClusterClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource('mosques') as mapboxgl.GeoJSONSource;
      if (!source || clusterId === undefined) return;
      
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom: zoom
        });
      });
    };

    const handlePointClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
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
    };

    const handleEnter = () => map.getCanvas().style.cursor = 'pointer';
    const handleLeave = () => map.getCanvas().style.cursor = '';

    setupLayers();

    return () => {
      if (mapRef.current) {
        const m = mapRef.current;
        m.off('click', 'clusters', handleClusterClick);
        m.off('click', 'unclustered-point', handlePointClick);
        m.off('mouseenter', 'clusters', handleEnter);
        m.off('mouseleave', 'clusters', handleLeave);
        m.off('mouseenter', 'unclustered-point', handleEnter);
        m.off('mouseleave', 'unclustered-point', handleLeave);
      }
    };
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
    if (!mapRef.current || !isMapLoaded || !isUserLocationValid) return;

    const map = mapRef.current;
    
    // Determine target mosques to route to
    const targetMosques = routingToMosque 
      ? [routingToMosque] 
      : (showNearest && !selectedMosque ? nearestMosques : []);

    if (targetMosques.length === 0) {
      if (map.getSource('route')) {
         (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
           type: 'FeatureCollection',
           features: []
         });
      }
      return;
    }

    const fetchRoute = async () => {
      try {
        const profile = routeProfile === 'foot' ? 'foot' : 'driving';
        const baseUrl = profile === 'foot' 
          ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
          : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
        
        const routeFeatures: GeoJSON.Feature[] = [];
        let allCoordinates: [number, number][] = [];

        // Fetch routes for all target mosques
        for (let i = 0; i < targetMosques.length; i++) {
          const target = targetMosques[i];
          const response = await fetch(`${baseUrl}/${userLocation.longitude},${userLocation.latitude};${target.longitude},${target.latitude}?overview=full&geometries=geojson`);
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0) {
            const routeGeom = data.routes[0].geometry;
            routeFeatures.push({
              type: 'Feature',
              geometry: routeGeom,
              properties: {
                isMain: i === 0 // Make the first route visually primary if there are multiple
              }
            });
            allCoordinates = [...allCoordinates, ...routeGeom.coordinates];
          }
        }
        
        if (routeFeatures.length > 0) {
          const featureCollection: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: routeFeatures
          };

          if (!map.getSource('route')) {
            map.addSource('route', { type: 'geojson', data: featureCollection });
            map.addLayer({
              id: 'route-line-casing',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': ['case', ['boolean', ['get', 'isMain'], true], '#FFFFFF', '#5F6368'],
                'line-width': ['case', ['boolean', ['get', 'isMain'], true], 10, 8],
                'line-opacity': ['case', ['boolean', ['get', 'isMain'], true], 0.8, 0.4]
              }
            });
            map.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': ['case', ['boolean', ['get', 'isMain'], true], '#4285F4', '#80868B'],
                'line-width': ['case', ['boolean', ['get', 'isMain'], true], 6, 4],
                'line-dasharray': profile === 'foot' ? [0.5, 2] : []
              }
            });
          } else {
            (map.getSource('route') as mapboxgl.GeoJSONSource).setData(featureCollection);
          }

          // Fit Bounds
          if (allCoordinates.length > 0) {
            const bounds = allCoordinates.reduce((acc: mapboxgl.LngLatBounds, coord: [number, number]) => {
              return acc.extend(coord);
            }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));

            map.fitBounds(bounds, { padding: 50 });
          }
        }
      } catch (error) {
        console.error('Error fetching Mapbox route:', error);
      }
    };

    fetchRoute();

    return () => {
    };
  }, [routingToMosque, nearestMosques, showNearest, selectedMosque, userLocation, isUserLocationValid, isMapLoaded, routeProfile]);

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
    }
  }, [selectedMosque, routingToMosque, isMapLoaded]);

  return (
    <div className="w-full h-full relative bg-slate-100 min-h-[400px]">
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 h-full w-full z-0 border-4 border-dashed border-red-500/20 bg-slate-200 min-h-[400px]" 
      />
      
      {!isMapLoaded && !tokenError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white px-6 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Loading Mapbox</h2>
          <p className="text-[10px] text-slate-400 mt-1 mb-4">Downloading maps and assets...</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      )}
      
      {tokenError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm text-center">
          <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('mapbox_token_error', language)}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {tokenError.includes('sk.') 
                ? "You are using a Secret Token (sk.*). Mapbox GL JS requires a Public Token (pk.*) to render maps in the browser."
                : tokenError}
              <br /><br />
              <div className="bg-gray-50 p-2 rounded-lg font-mono text-[10px] text-gray-400 border border-gray-100 mb-2">
                Detected: {rawToken ? `${rawToken.substring(0, 4)}...${rawToken.substring(rawToken.length - 4)}` : 'None'}
              </div>
              <span className="text-[11px] block mt-2 opacity-80">
                Tip: Check if your token has **URL restrictions** in the Mapbox dashboard that might be blocking this preview URL.
              </span>
            </p>

            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 text-left">
                Manual Token Fallback
              </label>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Paste pk. token here..."
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => {
                    if (inputToken.startsWith('pk.')) {
                      setManualMapboxToken(inputToken);
                      setTokenError(null);
                    } else {
                      alert('Please enter a valid public token starting with pk.');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-[9px] text-blue-400 mt-2 text-left italic">
                This token will be saved locally in your browser.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setMapProvider('leaflet')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
              >
                {t('switch_to_leaflet', language)}
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
