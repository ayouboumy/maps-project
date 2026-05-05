import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MapPin, Heart, ArrowUpDown, Sparkles, Brain, Loader2, Crosshair } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Mosque } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { t, getLocalizedName } from '../utils/translations';
import { getDistance } from 'geolib';
import PullToRefresh from '../components/PullToRefresh';
import { smartSearchMosques } from '../services/aiService';

export default function SearchScreen() {
  const { 
    mosques, favorites, setSelectedMosque, setActiveTab, language, 
    userLocation, refreshLocation, knowledgeBase,
    aiRecommendedIds, setAiRecommendedIds, isAiSearching, setIsAiSearching 
  } = useAppStore();
  
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance'>(userLocation ? 'distance' : 'name');
  const [isUsingSmartSearch, setIsUsingSmartSearch] = useState(false);

  // Debounce search input to prevent lag while typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset Smart Search results when regular query is cleared or changed
  useEffect(() => {
    if (!query) {
      setAiRecommendedIds([]);
      setIsUsingSmartSearch(false);
    }
  }, [query, setAiRecommendedIds]);

  const handleSmartSearch = async () => {
    if (!query.trim()) return;
    
    setIsAiSearching(true);
    setIsUsingSmartSearch(true);
    try {
      const results = await smartSearchMosques(query, mosques);
      setAiRecommendedIds(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiSearching(false);
    }
  };

  const types = useMemo(() => {
    const allTypes = mosques.map(m => m.type).filter(Boolean);
    return Array.from(new Set(allTypes)).sort();
  }, [mosques]);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => m.commune).filter(Boolean);
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques]);

  const filteredMosques = useMemo(() => {
    // If AI recommended results are present and we specifically asked for smart search
    if (isUsingSmartSearch && aiRecommendedIds.length > 0) {
      return mosques.filter(m => aiRecommendedIds.includes(String(m.id)));
    }

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
  }, [mosques, debouncedQuery, selectedType, selectedCommune, language, sortBy, userLocation, aiRecommendedIds, isUsingSmartSearch]);

  const handleSelect = (mosque: Mosque) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  const smartSuggestions = useMemo(() => {
    if (!knowledgeBase.commonTypes.length && !knowledgeBase.commonServices.length) return [];
    
    const suggestions = [];
    if (knowledgeBase.commonTypes.length > 0) {
      suggestions.push({
        type: 'type',
        value: knowledgeBase.commonTypes[0],
        label: `${t('Most common type', language)}: ${knowledgeBase.commonTypes[0]}`
      });
    }
    if (knowledgeBase.commonServices.length > 0) {
      suggestions.push({
        type: 'service',
        value: knowledgeBase.commonServices[0],
        label: `${t('Popular service', language)}: ${knowledgeBase.commonServices[0]}`
      });
    }
    return suggestions;
  }, [knowledgeBase, language]);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 flex flex-col max-w-md mx-auto transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 px-4 pt-safe-4 pb-4 shadow-sm z-10 border-b dark:border-gray-800 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Search', language)}</h1>
        
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              className={`block w-full ${language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors`}
              placeholder={t('Search mosques, cities...', language)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query.trim() && (
            <button
              onClick={handleSmartSearch}
              disabled={isAiSearching}
              className={`px-4 py-2 ${isAiSearching ? 'bg-gray-100 dark:bg-gray-800' : 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'} text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-100/50 dark:border-emerald-800/50 flex items-center gap-2 active:scale-95`}
              title={t('Smart Search', language)}
            >
              {isAiSearching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />}
              <span className="hidden sm:inline">{t('AI Search', language)}</span>
            </button>
          )}
          {(query || selectedType || selectedCommune || isUsingSmartSearch) && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedType(null);
                setSelectedCommune(null);
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap flex items-center justify-center"
            >
              {t('Clear', language)}
            </button>
          )}
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && query === '' && !selectedType && !selectedCommune && (
          <div className="mb-4">
            <div className={`flex items-center gap-2 mb-2 px-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">{t('Smart Suggestion', language)}</span>
            </div>
            <div className={`flex gap-2 overflow-x-auto pb-2 no-scrollbar ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {smartSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (suggestion.type === 'type') setSelectedType(suggestion.value);
                    else setQuery(suggestion.value);
                  }}
                  className="whitespace-nowrap px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-100 dark:border-purple-800 flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Brain size={12} />
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className={`flex items-center text-gray-500 dark:text-gray-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <Filter size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('Type', language)}</span>
            </div>
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === null 
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t(type, language)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className={`flex items-center text-gray-500 dark:text-gray-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <Filter size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('Commune', language)}</span>
            </div>
            <button
              onClick={() => setSelectedCommune(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCommune === null 
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {commune}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className={`flex items-center text-gray-500 dark:text-gray-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
              <ArrowUpDown size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('Sort', language)}</span>
            </div>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                sortBy === 'name' 
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t('Name', language)}
            </button>
            {userLocation && (
              <button
                onClick={() => setSortBy('distance')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  sortBy === 'distance' 
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
              className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 cursor-pointer hover:shadow-md transition-all relative"
            >
              <img 
                src={mosque.image} 
                alt={getLocalizedName(mosque, language)} 
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className={`flex-1 py-1 ${language === 'ar' ? 'pl-2' : 'pr-2'}`}>
                <div className="flex justify-between items-start">
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">{t(mosque.type, language)}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded transition-colors">{mosque.commune}</div>
                </div>
                <div className="flex flex-col mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span className="line-clamp-1">{getLocalizedName(mosque, language)}</span>
                    {favorites.includes(mosque.id) && (
                      <Heart size={14} className="fill-red-500 text-red-500 shrink-0" />
                    )}
                  </h3>
                  {mosque.code && (
                    <div className="mt-0.5">
                      <span className="text-[9px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 inline-block shadow-sm">
                        {mosque.code}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                  <MapPin size={12} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} mt-0.5 shrink-0`} />
                  <span className="line-clamp-1">{t(mosque.address, language)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  {userLocation && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
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
                  {!userLocation && <div></div>}
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
          ))}
          
          {filteredMosques.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <Search size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 transition-colors">{t('No mosques found', language)}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">{t('Try adjusting your search or filters', language)}</p>
            </div>
          )}
        </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
