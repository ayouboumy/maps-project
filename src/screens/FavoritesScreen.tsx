import { Heart, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'motion/react';
import { t, getLocalizedName } from '../utils/translations';

export default function FavoritesScreen() {
  const { mosques, favorites, setSelectedMosque, setActiveTab, language } = useAppStore();

  const favoriteMosques = mosques.filter(m => favorites.includes(m.id));

  const handleSelect = (mosque: any) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="bg-white px-4 pt-safe-4 pb-4 shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-900">{t('Saved Mosques', language)}</h1>
        <p className="text-gray-500 text-sm mt-1">{favoriteMosques.length} {t('places saved', language)}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {favoriteMosques.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {favoriteMosques.map((mosque, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={mosque.id}
                onClick={() => handleSelect(mosque)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="h-32 relative">
                  <img 
                    src={mosque.image} 
                    alt={getLocalizedName(mosque, language)} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500">
                    <Heart size={16} className="fill-current" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-emerald-600 mb-1">{t(mosque.type, language)}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{getLocalizedName(mosque, language)}</h3>
                  <div className="flex items-start text-gray-500 text-sm">
                    <MapPin size={14} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} mt-0.5 shrink-0`} />
                    <span className="line-clamp-1">{mosque.address}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-red-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('No favorites yet', language)}</h3>
            <p className="text-gray-500 mb-6 max-w-[250px] mx-auto">
              {t('Save your favorite mosques to quickly access them later, even offline.', language)}
            </p>
            <button 
              onClick={() => setActiveTab('search')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {t('Explore Mosques', language)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
