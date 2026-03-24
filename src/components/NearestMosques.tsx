import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { t, getLocalizedName } from '../utils/translations';
import { useMemo } from 'react';

interface NearestMosquesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NearestMosques({ isOpen, onClose }: NearestMosquesProps) {
  const { mosques, userLocation, setSelectedMosque, language } = useAppStore();

  const nearestMosques = useMemo(() => {
    if (!userLocation || mosques.length === 0) return [];
    
    const withDistance = mosques.map(mosque => ({
      ...mosque,
      distance: getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: mosque.latitude, longitude: mosque.longitude }
      )
    }));

    return withDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [mosques, userLocation]);

  const handleSelect = (mosque: any) => {
    setSelectedMosque(mosque);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[1001]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-16 left-0 right-0 z-[1002] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-md mx-auto"
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">{t('Nearest Mosques', language)}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {!userLocation ? (
                <div className="text-center py-8 text-gray-500">
                  {t('Location access is required to find nearest mosques.', language)}
                </div>
              ) : nearestMosques.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('No mosques found.', language)}
                </div>
              ) : (
                <div className="space-y-3">
                  {nearestMosques.map((mosque, i) => (
                    <div
                      key={mosque.id}
                      onClick={() => handleSelect(mosque)}
                      className="bg-gray-50 rounded-2xl p-3 flex gap-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <img 
                        src={mosque.image} 
                        alt={getLocalizedName(mosque, language)} 
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 py-1">
                        <h4 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-1">{getLocalizedName(mosque, language)}</h4>
                        <div className="flex items-start text-gray-500 text-xs mb-1">
                          <MapPin size={12} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} mt-0.5 shrink-0`} />
                          <span className="line-clamp-1">{mosque.address}</span>
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">
                          {(mosque.distance / 1000).toFixed(1)} km
                        </div>
                      </div>
                      <div className="flex items-center justify-center pr-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Navigation size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
