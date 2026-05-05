import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import BottomNav from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import SearchScreen from './screens/SearchScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import { LocateFixed, MapPin, Layers, HelpCircle, X, Network, Settings2, Palette, Camera, Loader2, Share2, Download } from 'lucide-react';
import MapView from './components/MapView';
import { t } from './utils/translations';
import DirectionsPanel from './components/DirectionsPanel';
import PullToRefresh from './components/PullToRefresh';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import * as htmlToImage from 'html-to-image';

export default function App() {
  const { 
    activeTab, setUserLocation, language, routingToMosque, 
    refreshLocation, mosques, mapStyle, setMapStyle, 
    isEquipmentOpen, darkMode, clusterByCommune, setClusterByCommune,
    colorByPrayerType, setColorByPrayerType, mapInstance, isExporting, setIsExporting
  } = useAppStore();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showNearest, setShowNearest] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isMapToolsOpen, setIsMapToolsOpen] = useState(false);

  const handleExportMap = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const element = document.getElementById('map-export-container');
      if (!element) throw new Error("Map container not found");
      
      // 1. Force map to recalculate its dimensions
      if (mapInstance) {
        mapInstance.invalidateSize();
      }

      // 2. Wait for tiles to settle completely
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Generate high resolution image
      // We use html-to-image because it handles modern CSS functions (oklch) better than html2canvas
      const dataUrl = await htmlToImage.toPng(element, {
        backgroundColor: darkMode ? '#030712' : '#ffffff',
        pixelRatio: 3, // High quality
        skipAutoScale: true,
        cacheBust: true,
        filter: (node: any) => {
          // Hide UI elements in the snapshot
          if (node.tagName === 'BUTTON') return false;
          // Hide specific map controls and UI overlays
          if (node.classList && (
            node.classList.contains('z-[1000]') || 
            node.classList.contains('top-safe-4') ||
            node.classList.contains('leaflet-control-container') ||
            node.classList.contains('z-[5000]') // Loading overlay
          )) {
            return false;
          }
          return true;
        },
        style: {
          // Sometimes Leaflet adds some styles that clash with the export
          // Neutralize some of them
          borderRadius: '0px'
        }
      });
      
      const link = document.createElement('a');
      link.download = `mosque-analysis-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting map:", error);
      alert(t("Failed to export map image. Image contains unsupported styles or server blocked tiles.", language));
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
          {/* Exporting Indicator Overlay */}
          <AnimatePresence>
            {isExporting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[5000] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                  <Camera className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t("Capturing Map", language)}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                  {t("Rendering high-resolution analysis. Please wait...", language)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'map' && (
            <PullToRefresh onRefresh={refreshLocation}>
              <MapView showNearest={showNearest} />
              
              {/* Floating Location & Tools Buttons */}
              {!routingToMosque && (
                <div className={`absolute top-safe-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-[1000] flex flex-col gap-3 items-end transition-all`}>
                  {/* Primary Tools Toggle */}
                  <button 
                    onClick={() => setIsMapToolsOpen(!isMapToolsOpen)}
                    className={cn(
                      "p-3 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300",
                      isMapToolsOpen
                        ? 'bg-blue-600 text-white border-blue-500 rotate-90'
                        : 'bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                    )}
                    title={t("Map Tools", language)}
                  >
                    {isMapToolsOpen ? <X size={24} /> : <Settings2 size={24} />}
                  </button>

                  {/* Expanded Tools Menu Popover */}
                  <AnimatePresence>
                    {isMapToolsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        style={{ transformOrigin: language === 'ar' ? 'top left' : 'top right' }}
                        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 w-56 flex flex-col gap-1 overflow-hidden"
                      >
                        <button 
                          onClick={() => { requestLocation(); setIsMapToolsOpen(false); }}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors text-sm font-bold active:scale-[0.98]"
                        >
                          <LocateFixed size={18} className={isLocating ? "animate-pulse text-blue-500" : "text-gray-400 dark:text-gray-500"} />
                          <span>{t("My Location", language)}</span>
                        </button>
                        
                        <button 
                          onClick={() => { setShowNearest(true); setTimeout(() => setShowNearest(false), 3000); setIsMapToolsOpen(false); }}
                          className={cn(
                            "flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors text-sm font-bold active:scale-[0.98]",
                            showNearest 
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <MapPin size={18} className={showNearest ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"} />
                          <span>{t("Nearest Mosques", language)}</span>
                        </button>

                        <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-1" />

                        <button 
                          onClick={() => {
                            const nextStyle: Record<string, 'street' | 'satellite' | 'terrain'> = {
                              'street': 'satellite',
                              'satellite': 'terrain',
                              'terrain': 'street'
                            };
                            setMapStyle(nextStyle[mapStyle]);
                          }}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors text-sm font-bold active:scale-[0.98]"
                        >
                          <Layers size={18} className="text-gray-400 dark:text-gray-500" />
                          <span>
                            {t(
                              mapStyle === 'street' ? 'Switch to Satellite' : 
                              mapStyle === 'satellite' ? 'Switch to Terrain' : 
                              'Switch to Street', 
                              language
                            )}
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => setClusterByCommune(!clusterByCommune)}
                          className={cn(
                            "flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors text-sm font-bold active:scale-[0.98]",
                            clusterByCommune 
                              ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <Network size={18} className={clusterByCommune ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"} />
                          <span>{t("Cluster by Commune", language)}</span>
                        </button>
                        
                        <button 
                          onClick={() => setColorByPrayerType(!colorByPrayerType)}
                          className={cn(
                            "flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors text-sm font-bold active:scale-[0.98]",
                            colorByPrayerType 
                              ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <Palette size={18} className={colorByPrayerType ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"} />
                          <span>{t("Color by Prayer Type", language)}</span>
                        </button>

                        <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-1" />

                        <button 
                          onClick={() => { setShowLegend(!showLegend); setIsMapToolsOpen(false); }}
                          className={cn(
                            "flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors text-sm font-bold active:scale-[0.98]",
                            showLegend 
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <HelpCircle size={18} className={showLegend ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"} />
                          <span>{t("Map Legend", language)}</span>
                        </button>
                        
                        <button 
                          onClick={handleExportMap}
                          disabled={isExporting}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm font-bold disabled:opacity-50 active:scale-[0.98]"
                        >
                          {isExporting ? <Loader2 size={18} className="animate-spin text-green-500" /> : <Camera size={18} className="text-gray-400 dark:text-gray-500" />}
                          <span>{t("Export Map Image", language)}</span>
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
