import { motion, AnimatePresence } from 'motion/react';
import { X, Navigation, Heart, Info, Map, Route } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { useState } from 'react';
import ProfileScreen from '../screens/ProfileScreen';
import { t, getLocalizedName } from '../utils/translations';

export default function BottomSheet() {
  const { selectedMosque, setSelectedMosque, favorites, toggleFavorite, language } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);

  if (!selectedMosque) return null;

  const isFavorite = favorites.includes(selectedMosque.id);

  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${selectedMosque.latitude},${selectedMosque.longitude}`, '_blank');
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedMosque.latitude},${selectedMosque.longitude}`, '_blank');
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
            className="fixed bottom-16 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-md mx-auto"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMosque.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t(selectedMosque.type, language)}</p>
                </div>
                <button 
                  onClick={() => setSelectedMosque(null)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              <div className="flex gap-4 mb-5">
                <img 
                  src={selectedMosque.image} 
                  alt={getLocalizedName(selectedMosque, language)} 
                  className="w-24 h-24 rounded-xl object-cover shadow-sm"
                />
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {selectedMosque.address}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMosque.services.slice(0, 2).map(service => (
                      <span key={service} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-md">
                        {t(service, language)}
                      </span>
                    ))}
                    {selectedMosque.services.length > 2 && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-md">
                        +{selectedMosque.services.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={handleOpenMaps}
                  className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Map size={20} className="mb-1" />
                  <span className="text-xs font-medium">{t('Map', language)}</span>
                </button>
                <button 
                  onClick={handleDirections}
                  className="flex flex-col items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Route size={20} className="mb-1" />
                  <span className="text-xs font-medium">{t('Directions', language)}</span>
                </button>
                <button 
                  onClick={() => toggleFavorite(selectedMosque.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl transition-colors",
                    isFavorite 
                      ? "bg-red-50 text-red-500 hover:bg-red-100" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Heart size={20} className={cn("mb-1", isFavorite && "fill-current")} />
                  <span className="text-xs font-medium">{t('Save', language)}</span>
                </button>
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <Info size={20} className="mb-1" />
                  <span className="text-xs font-medium">{t('Details', language)}</span>
                </button>
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
