import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Heart, Info, Map, MapPin, Clipboard, Check, Share2, Compass } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { useState, useMemo, useEffect } from 'react';
import ProfileScreen from '../screens/ProfileScreen';
import { t, getLocalizedName } from '../utils/translations';
import { getDistance } from 'geolib';

export default function BottomSheet() {
  const { 
    mosques, selectedMosque, setSelectedMosque, favorites, toggleFavorite, 
    language, setRoutingToMosque, userLocation, routeInfo, routingToMosque, routeProfile,
    darkMode
  } = useAppStore();
  
  const [showProfile, setShowProfile] = useState(false);
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isRoutingToThis = routingToMosque?.id === selectedMosque?.id;

  // Fetch road distance when a mosque is selected
  useEffect(() => {
    if (!selectedMosque || !userLocation) {
      setRoadDistance(null);
      return;
    }

    let isMounted = true;
    const fetchDistance = async () => {
      try {
        const profile = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
        const baseUrl = `https://router.project-osrm.org/route/v1/${profile}`;
        
        const response = await fetch(`${baseUrl}/${userLocation.longitude},${userLocation.latitude};${selectedMosque.longitude},${selectedMosque.latitude}?overview=false&alternatives=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from routing server");
        }

        const data = await response.json();
        if (isMounted && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Find the route with the shortest distance among all alternatives
          const bestRoute = data.routes.reduce((prev: any, current: any) => 
            (prev.distance < current.distance) ? prev : current
          );
          setRoadDistance(bestRoute.distance);
        }
      } catch (error) {
        console.warn("Could not fetch road distance for bottom sheet, relying on straight-line fallback.");
      }
    };

    fetchDistance();
    return () => { isMounted = false; };
  }, [selectedMosque, userLocation, routeProfile]);

  const distance = useMemo(() => {
    if (!userLocation || !selectedMosque) return null;
    
    // If we are currently routing to this mosque, use the road distance from routeInfo
    if (isRoutingToThis && routeInfo) {
      return (routeInfo.distance / 1000).toFixed(1);
    }

    // If we have fetched the road distance, use it
    if (roadDistance !== null) {
      return (roadDistance / 1000).toFixed(1);
    }

    try {
      // Otherwise use straight line (as a fallback/initial value)
      return (getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: selectedMosque.latitude, longitude: selectedMosque.longitude }
      ) / 1000).toFixed(1);
    } catch (e) {
      return null;
    }
  }, [userLocation, selectedMosque, isRoutingToThis, routeInfo, roadDistance]);

  const nearbyMosques = useMemo(() => {
    if (!selectedMosque) return [];
    
    return mosques
      .filter(m => m.id !== selectedMosque.id)
      .map(m => {
        let distanceToSelected = Infinity;
        try {
          distanceToSelected = getDistance(
            { latitude: selectedMosque.latitude, longitude: selectedMosque.longitude },
            { latitude: m.latitude, longitude: m.longitude }
          );
        } catch (e) {}
        return {
          ...m,
          distanceToSelected
        };
      })
      .sort((a, b) => a.distanceToSelected - b.distanceToSelected)
      .slice(0, 3);
  }, [mosques, selectedMosque]);

  if (!selectedMosque) return null;

  const isFavorite = favorites.includes(selectedMosque.id);

  const handleCopyPosition = () => {
    const coords = `${selectedMosque.latitude}, ${selectedMosque.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleMapsRoute = () => {
    const travelMode = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
    if (userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedMosque.latitude},${selectedMosque.longitude}&travelmode=${travelMode}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedMosque.latitude},${selectedMosque.longitude}&travelmode=${travelMode}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedMosque.name,
          text: `${selectedMosque.name} - ${selectedMosque.address}`,
          url: `https://www.google.com/maps/search/?api=1&query=${selectedMosque.latitude},${selectedMosque.longitude}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {selectedMosque && !showProfile && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] max-w-md mx-auto pb-safe transition-colors duration-300"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
            </div>

            <div className="px-5 pb-6 pt-2 max-h-[80vh] overflow-y-auto scrollbar-hide">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="pr-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{selectedMosque.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t(selectedMosque.type, language)}</span>
                    {distance && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {distance} km {roadDistance !== null || (isRoutingToThis && routeInfo) ? `(${t('Road', language)})` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMosque(null)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0 mt-1"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Quick Actions (Horizontal Scroll) */}
              <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 scrollbar-hide -mx-5 px-5">
                <button 
                  onClick={() => {
                    setRoutingToMosque(selectedMosque);
                    setSelectedMosque(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm shrink-0"
                >
                  <Navigation size={18} />
                  {t('Directions', language)}
                </button>
                <button 
                  onClick={handleOpenGoogleMapsRoute}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-sm shrink-0"
                >
                  <Navigation size={18} />
                  {t('Google Maps', language)}
                </button>
                <button 
                  onClick={handleCopyPosition}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                  {copied ? <Check size={18} className="text-emerald-600 dark:text-emerald-400" /> : <Clipboard size={18} />}
                  {t(copied ? 'Copied' : 'Position', language)}
                </button>
                <button 
                  onClick={() => toggleFavorite(selectedMosque.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors shrink-0 border",
                    isFavorite 
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900" 
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Heart size={18} className={cn(isFavorite && "fill-current")} />
                  {t('Save', language)}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                >
                  <Share2 size={18} />
                  {t('Share', language)}
                </button>
              </div>

              {/* Image & Info Grid */}
              <div className="mt-2 flex gap-4">
                <img 
                  src={selectedMosque.image} 
                  alt={getLocalizedName(selectedMosque, language)} 
                  className="w-28 h-28 rounded-2xl object-cover shadow-sm shrink-0"
                />
                <div className="flex-1 flex flex-col justify-center gap-2 text-gray-900 dark:text-white">
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                    <div className="flex flex-col">
                      <span className="line-clamp-2 leading-snug font-medium">{t(selectedMosque.address, language)}</span>
                      {selectedMosque.commune && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedMosque.commune}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Services Preview */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMosque.services.slice(0, 3).map(service => (
                      <span key={service} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded-md border border-emerald-100/50 dark:border-emerald-800/50">
                        {t(service, language)}
                      </span>
                    ))}
                    {selectedMosque.services.length > 3 && (
                      <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium rounded-md border border-gray-200/50 dark:border-gray-700">
                        +{selectedMosque.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Details Button */}
              <button 
                onClick={() => setShowProfile(true)}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200/60 dark:border-gray-700 transition-all"
              >
                <Info size={18} />
                {t('View Full Details', language)}
              </button>

              {/* Nearby Mosques Header */}
              <div className="mt-6 flex items-center gap-2 px-1">
                <Compass size={14} className="text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('Nearby Mosques', language)}</h4>
              </div>

              {/* Nearby Mosques List */}
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
                {nearbyMosques.map(mosque => (
                  <button
                    key={mosque.id}
                    onClick={() => setSelectedMosque(mosque)}
                    className="flex flex-col gap-2 p-2.5 rounded-2xl min-w-[140px] max-w-[140px] text-left transition-all border shrink-0 group active:scale-95 bg-gray-50 dark:bg-gray-800 border-gray-200/50 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="relative">
                      <img 
                        src={mosque.image} 
                        alt={getLocalizedName(mosque, language)} 
                        className="w-full h-20 rounded-xl object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white text-xs line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{mosque.name}</h5>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        <MapPin size={10} className="shrink-0" />
                        <span>{mosque.commune}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <ProfileScreen 
            mosque={selectedMosque} 
            onClose={() => setShowProfile(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
