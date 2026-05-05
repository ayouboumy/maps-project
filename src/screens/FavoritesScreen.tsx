import { Heart, MapPin, Crosshair } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { t, getLocalizedName } from '../utils/translations';
import PullToRefresh from '../components/PullToRefresh';

export default function FavoritesScreen() {
  const { mosques, favorites, setSelectedMosque, setActiveTab, language, refreshLocation } = useAppStore();

  const favoriteMosques = mosques.filter(m => favorites.includes(m.id));

  const handleSelect = (mosque: any) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 flex flex-col max-w-md mx-auto transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 px-4 pt-safe-4 pb-4 shadow-sm z-10 border-b dark:border-gray-800 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Saved Mosques', language)}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{favoriteMosques.length} {t('places saved', language)}</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <PullToRefresh onRefresh={refreshLocation}>
          <div className="p-4 pb-24">
            {favoriteMosques.length > 0 ? (
              <div className="space-y-3">
                {favoriteMosques.map((mosque, i) => {
                  const displayCode = mosque.code || 
                    (mosque.extraData && Object.entries(mosque.extraData).find(([k]) => k.toLowerCase().includes('code') || k.includes('رمز'))?.[1]);
                  return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={mosque.id}
                onClick={() => handleSelect(mosque)}
                className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 cursor-pointer hover:shadow-md transition-all relative"
              >
                <img 
                  src={mosque.image} 
                  alt={getLocalizedName(mosque, language)} 
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div className={`flex-1 py-1 ${language === 'ar' ? 'pl-2' : 'pr-2'}`}>
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">{t(mosque.type, language)}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded transition-colors">{mosque.commune}</div>
                  </div>
                  <div className="flex flex-col mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                      <span className="line-clamp-1">{mosque.name}</span>
                      <Heart size={14} className="fill-red-500 text-red-500 shrink-0" />
                    </h3>
                    {displayCode && (
                      <div className="mt-0.5">
                        <span className="text-[8px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 inline-block">
                          رمز المسجد {displayCode}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                    <MapPin size={12} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} mt-0.5 shrink-0`} />
                    <span className="line-clamp-1">{t(mosque.address, language)}</span>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(mosque);
                      }}
                      className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all active:scale-90"
                      title={t('View on map', language)}
                    >
                      <Crosshair size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );})}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <Heart size={32} className="text-red-300 dark:text-red-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{t('No favorites yet', language)}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-[250px] mx-auto transition-colors">
              {t('Save your favorite mosques to quickly access them later, even offline.', language)}
            </p>
            <button 
              onClick={() => setActiveTab('search')}
              className="px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {t('Explore Mosques', language)}
            </button>
          </div>
        )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
