import { motion, AnimatePresence } from 'motion/react';
import { X, Navigation, Footprints, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../utils/translations';

export default function DirectionsPanel() {
  const { routingToMosque, routeInfo, setRoutingToMosque, language } = useAppStore();

  if (!routingToMosque) return null;

  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${routingToMosque.latitude},${routingToMosque.longitude}`, '_blank');
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-20 left-4 right-4 z-[1001] bg-white rounded-2xl shadow-2xl p-4 border border-gray-100"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{routingToMosque.name}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
              <MapPin size={14} />
              <span className="line-clamp-1">{routingToMosque.address}</span>
            </div>
          </div>
          <button 
            onClick={() => setRoutingToMosque(null)} 
            className="bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 p-2 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <div className="bg-emerald-50 p-2 rounded-full">
              <Footprints size={20} />
            </div>
            {routeInfo ? (
              <div className="flex flex-col">
                <span className="text-lg leading-none">{formatDuration(routeInfo.duration)}</span>
                <span className="text-gray-400 text-xs font-normal mt-1">
                  {(routeInfo.distance / 1000).toFixed(1)} km
                </span>
              </div>
            ) : (
              <span className="text-sm animate-pulse">{t('Calculating...', language)}</span>
            )}
          </div>

          <button 
            onClick={handleOpenMaps}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Navigation size={18} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
            {t('Start', language)}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
