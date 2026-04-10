import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import BottomNav from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import SearchScreen from './screens/SearchScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import { LocateFixed, MapPin, Layers, HelpCircle, X } from 'lucide-react';
import MapView from './components/MapView';
import { t } from './utils/translations';
import DirectionsPanel from './components/DirectionsPanel';
import PullToRefresh from './components/PullToRefresh';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const { activeTab, setUserLocation, language, routingToMosque, refreshLocation, mosques, mapStyle, setMapStyle, isEquipmentOpen } = useAppStore();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showNearest, setShowNearest] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(t("Location access denied or unavailable.", language));
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError(t("Geolocation is not supported by your browser.", language));
      setIsLocating(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-gray-100 overflow-hidden font-sans text-gray-900 flex justify-center"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Mobile container constraint for desktop viewing */}
      <div className="w-full max-w-md h-full bg-white relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'map' && (
            <PullToRefresh onRefresh={refreshLocation}>
              <MapView showNearest={showNearest} />
              
              {/* Floating Location Button */}
              {!routingToMosque && (
                <div className={`absolute top-safe-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-[1000] flex flex-col gap-3`}>
                  <button 
                    onClick={requestLocation}
                    className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:text-blue-600 transition-colors"
                    title={t("My Location", language)}
                  >
                    <LocateFixed size={24} className={isLocating ? "animate-pulse text-blue-500" : ""} />
                  </button>
                  <button 
                    onClick={() => setShowNearest(!showNearest)}
                    className={`p-3 rounded-full shadow-md transition-colors ${showNearest ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:text-blue-600'}`}
                    title={t("Nearest Mosques", language)}
                  >
                    <MapPin size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      const nextStyle: Record<string, 'street' | 'satellite' | 'terrain'> = {
                        'street': 'satellite',
                        'satellite': 'terrain',
                        'terrain': 'street'
                      };
                      setMapStyle(nextStyle[mapStyle]);
                    }}
                    className={cn(
                      "p-3 rounded-full shadow-md transition-all duration-300",
                      mapStyle === 'street' ? "bg-white text-gray-700 hover:text-blue-600" :
                      mapStyle === 'satellite' ? "bg-blue-600 text-white" :
                      "bg-emerald-600 text-white"
                    )}
                    title={t(
                      mapStyle === 'street' ? 'Street Mode' : 
                      mapStyle === 'satellite' ? 'Satellite Mode' : 
                      'Terrain Mode', 
                      language
                    )}
                  >
                    <Layers size={24} />
                  </button>
                  <button 
                    onClick={() => setShowLegend(!showLegend)}
                    className={`p-3 rounded-full shadow-md transition-colors ${showLegend ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:text-blue-600'}`}
                    title={t("Map Legend", language)}
                  >
                    <HelpCircle size={24} />
                  </button>
                </div>
              )}

              {/* Map Legend Overlay */}
              <AnimatePresence>
                {showLegend && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className={cn(
                      "absolute bottom-24 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 w-64",
                      language === 'ar' ? "left-4" : "right-4"
                    )}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">{t("Map Legend", language)}</h4>
                      <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-sm" />
                        <span className="text-xs font-bold text-gray-700">{t("User Location", language)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" className="w-4 h-6 object-contain" alt="" />
                        <span className="text-xs font-bold text-gray-700">{t("Mosque", language)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" className="w-4 h-6 object-contain" alt="" />
                        <span className="text-xs font-bold text-gray-700">{t("Destination", language)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-1 bg-blue-600 rounded-full" style={{ borderBottom: '2px dotted white' }} />
                          <span className="text-[10px] font-bold text-gray-500">{t("Walking Route", language)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-1 bg-blue-600 rounded-full" />
                          <span className="text-[10px] font-bold text-gray-500">{t("Driving Route", language)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {locationError && (
                <div className="absolute top-safe-20 left-4 right-4 z-[1000] p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl shadow-sm">
                  {locationError}
                </div>
              )}

              <BottomSheet />
              <DirectionsPanel />
            </PullToRefresh>
          )}

          {activeTab === 'search' && <SearchScreen />}
          
          {activeTab === 'favorites' && <FavoritesScreen />}

          {activeTab === 'settings' && <SettingsScreen />}

          <AnimatePresence>
            {isEquipmentOpen && <EquipmentScreen />}
          </AnimatePresence>
        </div>

        {!routingToMosque && <BottomNav />}
      </div>
    </div>
  );
}
