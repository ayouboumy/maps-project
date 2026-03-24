import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MapPin, Heart, ArrowUpDown, Navigation, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Mosque } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { t, getLocalizedName } from '../utils/translations';
import { getDistance } from 'geolib';
import { cn } from '../lib/utils';

export default function SearchScreen() {
  const { 
    mosques, 
    favorites, 
    toggleFavorite,
    setSelectedMosque, 
    setActiveTab, 
    language, 
    userLocation,
    selectedCommune,
    setSelectedCommune
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance'>(userLocation ? 'distance' : 'name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  // Debounce search input to prevent lag while typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const types = useMemo(() => {
    const allTypes = mosques
      .map(m => m.type)
      .filter(Boolean)
      .map(t => t.trim());
    const unique = Array.from(new Set(allTypes)).sort();
    return unique;
  }, [mosques]);

  const services = useMemo(() => {
    const allServices = mosques
      .flatMap(m => m.services || [])
      .filter(Boolean)
      .map(s => s.trim());
    return Array.from(new Set(allServices)).sort();
  }, [mosques]);

  const facilities = useMemo(() => {
    const allItems = mosques
      .flatMap(m => m.items || [])
      .filter(Boolean)
      .map(i => i.trim());
    return Array.from(new Set(allItems)).sort();
  }, [mosques]);

  const communes = useMemo(() => {
    const allCommunes = mosques.map(m => {
      if (m.commune) return m.commune.trim();
      // Fallback: try to extract from address if commune is missing
      return (m.address.split(',')[0] || '').trim();
    }).filter(c => c && c !== 'Unknown' && c !== 'Unknown Address' && c !== t('Unknown', language) && c !== t('Unknown Address', language));
    return Array.from(new Set(allCommunes)).sort();
  }, [mosques, language]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (selectedService) count++;
    if (selectedCommune) count++;
    if (selectedFacility) count++;
    return count;
  }, [selectedType, selectedService, selectedCommune, selectedFacility]);

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedService(null);
    setSelectedCommune(null);
    setSelectedFacility(null);
    setQuery('');
  };

  const filteredMosques = useMemo(() => {
    const lowerQuery = debouncedQuery.toLowerCase().trim();
    
    let filtered = mosques.filter(mosque => {
      const matchesType = selectedType ? (mosque.type && mosque.type.trim() === selectedType.trim()) : true;
      if (!matchesType) return false;

      const matchesService = selectedService ? (mosque.services && mosque.services.includes(selectedService)) : true;
      if (!matchesService) return false;

      const matchesFacility = selectedFacility ? (mosque.items && mosque.items.includes(selectedFacility)) : true;
      if (!matchesFacility) return false;

      const matchesCommune = selectedCommune ? (mosque.commune && mosque.commune.trim() === selectedCommune.trim()) : true;
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
        (mosque.commune && mosque.commune.toLowerCase().includes(lowerQuery))
      );
    });

    if (sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const distA = getDistance(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: a.latitude, longitude: a.longitude }
        );
        const distB = getDistance(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: b.latitude, longitude: b.longitude }
        );
        return distA - distB;
      });
    } else {
      filtered.sort((a, b) => {
        const nameA = getLocalizedName(a, language);
        const nameB = getLocalizedName(b, language);
        return nameA.localeCompare(nameB);
      });
    }

    return filtered;
  }, [mosques, debouncedQuery, selectedType, selectedService, selectedFacility, selectedCommune, language, sortBy, userLocation]);

  const handleSelect = (mosque: Mosque) => {
    setSelectedMosque(mosque);
    setActiveTab('map');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header Section */}
      <div className="bg-white px-4 pt-safe-4 pb-4 shadow-sm z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('Search', language)}</h1>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
              >
                {t('Clear All', language)}
              </button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2.5 rounded-xl transition-all relative active:scale-95",
                showFilters || activeFilterCount > 0 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-100 text-gray-600"
              )}
            >
              {showFilters ? <X size={20} /> : <Filter size={20} />}
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none`}>
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className={`block w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 border border-gray-100 rounded-2xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all shadow-inner`}
            placeholder={t('Search mosques, cities...', language)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-5 py-5 border-t border-gray-100 mt-4">
                {/* Sort Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <ArrowUpDown size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('Sort By', language)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('name')}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm",
                        sortBy === 'name' ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                      )}
                    >
                      {t('Name', language)}
                    </button>
                    {userLocation && (
                      <button
                        onClick={() => setSortBy('distance')}
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm",
                          sortBy === 'distance' ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                        )}
                      >
                        {t('Distance', language)}
                      </button>
                    )}
                  </div>
                </div>

                {/* Commune Filter */}
                {communes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('Commune', language)}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => setSelectedCommune(null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                          selectedCommune === null ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                        )}
                      >
                        {t('All', language)}
                      </button>
                      {communes.map(commune => (
                        <button
                          key={commune}
                          onClick={() => setSelectedCommune(commune)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                            selectedCommune === commune ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                          )}
                        >
                          {commune}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type Filter */}
                {types.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Filter size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('Type', language)}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => setSelectedType(null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                          selectedType === null ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                        )}
                      >
                        {t('All', language)}
                      </button>
                      {types.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                            selectedType === type ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                          )}
                        >
                          {t(type, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Filter */}
                {services.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Filter size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('Services', language)}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => setSelectedService(null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                          selectedService === null ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                        )}
                      >
                        {t('All', language)}
                      </button>
                      {services.map(service => (
                        <button
                          key={service}
                          onClick={() => setSelectedService(service)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                            selectedService === service ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                          )}
                        >
                          {t(service, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facilities Filter */}
                {facilities.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Filter size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('Facilities', language)}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => setSelectedFacility(null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                          selectedFacility === null ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                        )}
                      >
                        {t('All', language)}
                      </button>
                      {facilities.map(facility => (
                        <button
                          key={facility}
                          onClick={() => setSelectedFacility(facility)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                            selectedFacility === facility ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                          )}
                        >
                          {t(facility, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            {filteredMosques.length} {t('mosques found', language)}
          </span>
          {activeFilterCount > 0 && !showFilters && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-[60%]">
              {selectedCommune && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 whitespace-nowrap">{selectedCommune}</span>}
              {selectedType && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 whitespace-nowrap">{t(selectedType, language)}</span>}
              {selectedService && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 whitespace-nowrap">{t(selectedService, language)}</span>}
              {selectedFacility && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 whitespace-nowrap">{t(selectedFacility, language)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {filteredMosques.length > 0 ? (
          <div className="space-y-5">
            {filteredMosques.map((mosque, index) => (
              <motion.div
                key={mosque.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                onClick={() => handleSelect(mosque)}
                className="group bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex p-3.5 gap-4">
                  {/* Image Section */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                    <img
                      src={mosque.image || `https://picsum.photos/seed/${mosque.id}/200/200`}
                      alt={getLocalizedName(mosque, language)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(mosque.id);
                      }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-gray-400 hover:text-red-500 hover:scale-110 transition-all active:scale-90"
                    >
                      <Heart 
                        size={14} 
                        className={favorites.includes(mosque.id) ? "fill-red-500 text-red-500" : ""} 
                      />
                    </button>
                  </div>
                  
                  {/* Info Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md uppercase tracking-widest border border-emerald-100/50">
                          {t(mosque.type || 'Mosque', language)}
                        </span>
                        {mosque.commune && (
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded-md">
                            {mosque.commune}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors text-[15px] tracking-tight">
                        {getLocalizedName(mosque, language)}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
                        <MapPin size={11} className="text-emerald-500/60" />
                        <span className="truncate">{mosque.address}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {userLocation && (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-xl border border-emerald-100/30">
                          <Navigation size={11} className="fill-emerald-600" />
                          <span className="text-[11px] font-black tracking-tight">
                            {(getDistance(
                              { latitude: userLocation.latitude, longitude: userLocation.longitude },
                              { latitude: mosque.latitude, longitude: mosque.longitude }
                            ) / 1000).toFixed(1)} km
                          </span>
                        </div>
                      )}
                      {!userLocation && <div />}
                      <div className="flex items-center gap-1 text-gray-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1">
                        <span className="text-[9px] font-black uppercase tracking-widest">{t('Details', language)}</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* End of list spacer */}
            <div className="h-20" />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6 relative">
              <Search size={36} className="text-gray-200" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-500/5 rounded-[32px]" 
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('No mosques found', language)}</h3>
            <p className="text-sm text-gray-400 max-w-[240px] leading-relaxed mb-8">
              {t('Try adjusting your search or filters to find what you are looking for.', language)}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 active:scale-95 transition-all hover:bg-emerald-700"
              >
                {t('Clear all filters', language)}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
