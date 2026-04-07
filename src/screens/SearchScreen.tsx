import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MapPin, Heart, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Mosque } from '../types';
import { motion } from 'motion/react';
import { t, getLocalizedName } from '../utils/translations';
import { getDistance } from 'geolib';
import PullToRefresh from '../components/PullToRefresh';

export default function SearchScreen() {
  const { mosques, favorites, setSelectedMosque, setActiveTab, language, userLocation, refreshLocation } = useAppStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance'>(userLocation ? 'distance' : 'name');

  // Debounce search input to prevent lag while typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const types = useMemo(() => {
    const allTypes = mosques.map(m => m.type).filter(Boolean);
    return Array.from(new Set(allTypes)).sort();
  }, [mosques]);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => m.commune).filter(Boolean);
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques]);

  const filteredMosques = useMemo(() => {
    const lowerQuery = debouncedQuery.toLowerCase().trim();
    
    let filtered = mosques.filter(mosque => {
      const matchesType = selectedType ? mosque.type === selectedType : true;
      if (!matchesType) return false;

      const matchesCommune = selectedCommune ? mosque.commune === selectedCommune : true;
      if (!matchesCommune) return false;

      if (!lowerQuery) return true;

      const localizedName = getLocalizedName(mosque, language);
      return (
        localizedName.toLowerCase().includes(lowerQuery) ||
        mosque.name.toLowerCase().includes(lowerQuery) ||
        (mosque.name_ar && mosque.name_ar.toLowerCase().includes(lowerQuery)) ||
        (mosque.name_fr && mosque.name_fr.toLowerCase().includes(lowerQuery)) ||
        (mosque.name_en && mosque.name_en.toLowerCase().includes(lowerQuery)) ||
        mosque.address.toLowerCase().includes(lowerQuery) ||
        mosque.commune.toLowerCase().includes(lowerQuery)
      );
    });

    if (sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        try {
          const distA = getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: a.latitude, longitude: a.longitude }
          );
          const distB = getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: b.latitude, longitude: b.longitude }
          );
          return distA - distB;
        } catch (e) {
          return 0;
        }
      });
    } else {
      filtered.sort((a, b) => {
        const nameA = getLocalizedName(a, language);
        const nameB = getLocalizedName(b, language);
        return nameA.localeCompare(nameB);
      });
    }

    // Limit to 100 results to prevent rendering lag with large datasets
    return filtered.slice(0, 100);
  }, [mosques, debouncedQuery, selectedType, selectedCommune, language, sortBy, userLocation]);

  const handleSelect = (mosque: Mosque) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="bg-white px-4 pt-safe-4 pb-4 shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('Search', language)}</h1>
        
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              className={`block w-full ${language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors`}
              placeholder={t('Search mosques, cities...', language)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {(query || selectedType || selectedCommune) && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedType(null);
                setSelectedCommune(null);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap flex items-center justify-center"
            >
              {t('Clear', language)}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className={`flex items-center text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <Filter size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('Type', language)}</span>
            </div>
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === null 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('All', language)}
            </button>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === type 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t(type, language)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className={`flex items-center text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <Filter size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('Commune', language)}</span>
            </div>
            <button
              onClick={() => setSelectedCommune(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCommune === null 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('All', language)}
            </button>
            {communes.map(commune => (
              <button
                key={commune}
                onClick={() => setSelectedCommune(commune)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCommune === commune 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {commune}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className={`flex items-center text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <ArrowUpDown size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('Sort', language)}</span>
            </div>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                sortBy === 'name' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('Name', language)}
            </button>
            {userLocation && (
              <button
                onClick={() => setSortBy('distance')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  sortBy === 'distance' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('Distance', language)}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PullToRefresh onRefresh={refreshLocation}>
          <div className="p-4 pb-24 space-y-3">
            {filteredMosques.map((mosque, i) => (
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={mosque.id}
              onClick={() => handleSelect(mosque)}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow relative"
            >
              <img 
                src={mosque.image} 
                alt={getLocalizedName(mosque, language)} 
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className={`flex-1 py-1 ${language === 'ar' ? 'pl-2' : 'pr-2'}`}>
                <div className="flex justify-between items-start">
                  <div className="text-xs font-medium text-emerald-600 mb-1">{t(mosque.type, language)}</div>
                  <div className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{mosque.commune}</div>
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-1 flex items-center gap-1.5">
                  <span className="line-clamp-1">{mosque.name}</span>
                  {favorites.includes(mosque.id) && (
                    <Heart size={14} className="fill-red-500 text-red-500 shrink-0" />
                  )}
                </h3>
                <div className="flex items-start text-gray-500 text-xs">
                  <MapPin size={12} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} mt-0.5 shrink-0`} />
                  <span className="line-clamp-1">{t(mosque.address, language)}</span>
                </div>
                {userLocation && (
                  <div className="text-xs text-emerald-600 mt-1 font-medium">
                    {(() => {
                      try {
                        return (getDistance(
                          { latitude: userLocation.latitude, longitude: userLocation.longitude },
                          { latitude: mosque.latitude, longitude: mosque.longitude }
                        ) / 1000).toFixed(1) + ' km';
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredMosques.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('No mosques found', language)}</h3>
              <p className="text-gray-500 text-sm">{t('Try adjusting your search or filters', language)}</p>
            </div>
          )}
        </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
