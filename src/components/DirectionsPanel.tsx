import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Footprints, MapPin, Car, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../utils/translations';
import { cn } from '../lib/utils';

export default function DirectionsPanel() {
  const { routingToMosque, routeInfo, setRoutingToMosque, language, routeProfile, setRouteProfile } = useAppStore();

  const handleOpenMaps = () => {
    if (!routingToMosque) return;
    const travelMode = routeProfile === 'driving' ? 'driving' : 'walking';
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${routingToMosque.latitude},${routingToMosque.longitude}&travelmode=${travelMode}`, '_blank');
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h ${remainingMinutes} min`;
  };

  return (
    <AnimatePresence>
      {routingToMosque && (
        <>
          {/* TOP BAR: Origin & Destination */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-safe-4 left-4 right-4 z-[1001] bg-white rounded-2xl shadow-lg p-3 border border-gray-100"
          >
            <div className="flex items-start gap-3">
              <button 
                onClick={() => setRoutingToMosque(null)}
                className="mt-1 p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
              </button>
              
              <div className="flex-1 flex flex-col gap-2 relative">
                {/* Vertical dotted line connecting the two dots */}
                <div className="absolute left-[9px] top-[20px] bottom-[20px] w-[2px] bg-gray-300 border-l-2 border-dotted border-gray-400" />
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-xl px-4 py-2 flex-1 text-xs text-gray-600 font-medium border border-gray-200">
                    {t('Your Location', language)}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 z-10">
                    <MapPin size={18} className="text-red-500" fill="#ef4444" stroke="white" strokeWidth={2} />
                  </div>
                  <div className="bg-white rounded-xl px-4 py-2 flex-1 text-xs text-gray-900 font-bold border border-gray-200 shadow-sm line-clamp-1">
                    {routingToMosque.name}
                  </div>
                </div>
              </div>

              {/* Quick Profile Toggle in Top Bar */}
              <button
                onClick={() => setRouteProfile(routeProfile === 'driving' ? 'foot' : 'driving')}
                className="mt-1 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              >
                {routeProfile === 'driving' ? <Car size={20} /> : <Footprints size={20} />}
              </button>
            </div>
          </motion.div>

          {/* BOTTOM SHEET: Travel Modes & Start */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe"
          >
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-6 pt-2">
              {/* Polished Segmented Control */}
              <div className="bg-gray-100 p-1.5 rounded-[20px] flex gap-1 mb-6 relative">
                <motion.div 
                  className="absolute top-1.5 bottom-1.5 bg-white rounded-[14px] shadow-sm pointer-events-none"
                  initial={false}
                  animate={{ 
                    x: routeProfile === 'driving' 
                      ? (language === 'ar' ? '100%' : '0%') 
                      : (language === 'ar' ? '0%' : '100%'),
                    left: routeProfile === 'driving' ? '6px' : 'calc(50% + 2px)',
                    width: 'calc(50% - 8px)'
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
                
                <button
                  onClick={() => setRouteProfile('driving')}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-sm font-bold z-10 transition-colors",
                    routeProfile === 'driving' ? "text-blue-600" : "text-gray-500"
                  )}
                >
                  <Car size={20} />
                  <span>{t('Driving', language)}</span>
                </button>
                
                <button
                  onClick={() => setRouteProfile('foot')}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-sm font-bold z-10 transition-colors",
                    routeProfile === 'foot' ? "text-blue-600" : "text-gray-500"
                  )}
                >
                  <Footprints size={20} />
                  <span>{t('Walking', language)}</span>
                </button>
              </div>

              {/* Route Info & Start Button */}
              <div className="flex items-center justify-between">
                <div>
                  {routeInfo ? (
                    <>
                      <div className={`text-3xl font-black tracking-tight ${routeProfile === 'driving' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {formatDuration(routeInfo.duration)}
                      </div>
                      <div className="text-gray-500 font-medium mt-1">
                        {(routeInfo.distance / 1000).toFixed(1)} km
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-bold text-gray-300 animate-pulse">
                      {t('Calculating...', language)}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleOpenMaps}
                  disabled={!routeInfo}
                  className="flex items-center gap-2 bg-blue-600 disabled:bg-blue-300 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 active:scale-95"
                >
                  <Navigation size={22} className={language === 'ar' ? 'ml-1' : 'mr-1'} fill="currentColor" />
                  {t('Start', language)}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
