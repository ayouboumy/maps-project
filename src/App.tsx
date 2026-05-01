import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import BottomNav from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import SearchScreen from './screens/SearchScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import { LocateFixed, MapPin, Layers, HelpCircle, X, Network, Settings2, Palette, Camera, Loader2 } from 'lucide-react';
import MapView from './components/MapView';
import { t } from './utils/translations';
import DirectionsPanel from './components/DirectionsPanel';
import PullToRefresh from './components/PullToRefresh';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import AiSmartOverlay from './components/AiSmartOverlay';
import domtoimage from 'dom-to-image-more';

export default function App() {
  const { 
    activeTab, setUserLocation, language, routingToMosque, 
    refreshLocation, mosques, mapStyle, setMapStyle, 
    isEquipmentOpen, darkMode, clusterByCommune, setClusterByCommune,
    colorByPrayerType, setColorByPrayerType, mapInstance
  } = useAppStore();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showNearest, setShowNearest] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isMapToolsOpen, setIsMapToolsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportMap = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('map-export-container');
      if (!element) throw new Error("Map container not found");
      
      // 1. Force map to recalculate its dimensions and center
      if (mapInstance) {
        mapInstance.invalidateSize();
      }

      // 2. Wait for tiles to settle completely
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dataUrl = await domtoimage.toPng(element, {
        bgcolor: darkMode ? '#030712' : '#ffffff',
        cacheBust: true,
        filter: (node: any) => {
          // Hide UI elements in the snapshot
          if (node.tagName === 'BUTTON') return false;
          // Hide map controls and specific panels
          if (node.classList && (
            node.classList.contains('z-[1000]') || 
            node.classList.contains('top-safe-4') ||
            node.classList.contains('leaflet-control-container')
          )) {
            return false;
          }
          return true;
        },
        height: element.offsetHeight * 2,
        width: element.offsetWidth * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: element.offsetWidth + 'px',
          height: element.offsetHeight + 'px'
        }
      });
      
      const link = document.createElement('a');
      link.download = `mosque-analysis-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting map:", error);
      alert(t("Failed to export map image. Please try again.", language));
    } finally {
      setIsExporting(false);
      setIsMapToolsOpen(false);
    }
  };

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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div 
      className={cn(
        "fixed inset-0 font-sans flex justify-center overflow-hidden h-[100dvh] transition-colors duration-300",
        darkMode ? "bg-gray-950 text-gray-100 dark" : "bg-gray-100 text-gray-900"
      )}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Mobile container constraint for desktop viewing */}
      <div className={cn(
        "w-full max-w-md h-full relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300",
        darkMode ? "bg-gray-900 dark" : "bg-white"
      )}>
        
        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'map' && (
            <PullToRefresh onRefresh={refreshLocation}>
              <MapView showNearest={showNearest} />
              <AiSmartOverlay />
              
              {/* Floating Location & Tools Buttons */}
              {!routingToMosque && (
                <div className={`absolute top-safe-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-[1000] flex flex-col gap-3 items-end transition-all`}>
                  {/* Primary Tools Toggle */}
                  <button 
                    onClick={() => setIsMapToolsOpen(!isMapToolsOpen)}
                    className={cn(
                      "p-3 rounded-full shadow-md transition-colors",
                      isMapToolsOpen
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    )}
                    title={t("Map Tools", language)}
                  >
                    {isMapToolsOpen ? <X size={24} /> : <Settings2 size={24} />}
                  </button>

                  {/* Expanded Tools Menu */}
                  <AnimatePresence>
                    {isMapToolsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.9 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.9 }}
                        className="flex flex-col gap-3"
                      >
                        <button 
                          onClick={requestLocation}
                          className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title={t("My Location", language)}
                        >
                          <LocateFixed size={20} className={isLocating ? "animate-pulse text-blue-500" : ""} />
                        </button>
                        <button 
                          onClick={() => setShowNearest(!showNearest)}
                          className={cn(
                            "p-3 rounded-full shadow-md transition-colors",
                            showNearest 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                          )}
                          title={t("Nearest Mosques", language)}
                        >
                          <MapPin size={20} />
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
                            mapStyle === 'street' ? "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" :
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
                          <Layers size={20} />
                        </button>
                        <button 
                          onClick={() => { setClusterByCommune(!clusterByCommune); }}
                          className={cn(
                            "p-3 rounded-full shadow-md transition-colors",
                            clusterByCommune 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                          )}
                          title={t("Cluster by Commune", language)}
                        >
                          <Network size={20} />
                        </button>
                        <button 
                          onClick={() => setColorByPrayerType(!colorByPrayerType)}
                          className={cn(
                            "p-3 rounded-full shadow-md transition-colors",
                            colorByPrayerType 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400'
                          )}
                          title={t("Color by Prayer Type", language)}
                        >
                          <Palette size={20} />
                        </button>
                        <button 
                          onClick={() => setShowLegend(!showLegend)}
                          className={cn(
                            "p-3 rounded-full shadow-md transition-colors",
                            showLegend 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                          )}
                          title={t("Map Legend", language)}
                        >
                          <HelpCircle size={20} />
                        </button>
                        <button 
                          onClick={handleExportMap}
                          disabled={isExporting}
                          className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-md text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                          title={t("Export Map Image", language)}
                        >
                          {isExporting ? <Loader2 size={20} className="animate-spin text-green-500" /> : <Camera size={20} />}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                      "absolute bottom-24 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-64 transition-colors duration-300",
                      language === 'ar' ? "left-4" : "right-4"
                    )}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t("Map Legend", language)}</h4>
                      <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("User Location", language)}</span>
                      </div>
                      
                      {!colorByPrayerType ? (
                        <div className="flex items-center gap-3">
                          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" className="w-4 h-6 object-contain" alt="" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("Mosque", language)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" className="w-4 h-6 object-contain" alt="" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("Friday Mosque", language)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png" className="w-4 h-6 object-contain" alt="" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("5 Prayers", language)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png" className="w-4 h-6 object-contain" alt="" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("Zawiya / Shrine", language)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" className="w-4 h-6 object-contain" alt="" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("Default Mosque", language)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-3">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" className="w-4 h-6 object-contain" alt="" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("Destination", language)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" style={{ borderBottom: darkMode ? '2px dotted #1f2937' : '2px dotted white' }} />
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{t("Walking Route", language)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{t("Driving Route", language)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {locationError && (
                <div className="absolute top-safe-20 left-4 right-4 z-[1000] p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl shadow-sm transition-colors">
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
