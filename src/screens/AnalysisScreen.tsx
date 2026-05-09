import { useAppStore } from '../store/useAppStore';
import { t } from '../utils/translations';
import { 
  BarChart2, 
  Compass, 
  Building2, 
  ListChecks, 
  Map as MapIcon, 
  CheckCircle2, 
  PieChart,
  LayoutGrid,
  ChevronRight,
  Filter,
  X,
  Search,
  Zap,
  Activity
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

type AnalysisTab = 'overview' | 'communes' | 'services' | 'types' | 'explorer';

export default function AnalysisScreen() {
  const { language, mosques } = useAppStore();
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisTab>('overview');
  const [filterCommune, setFilterCommune] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique values for filters
  const allCommunes = useMemo(() => {
    return Array.from(new Set(mosques.map(m => m.commune).filter(Boolean))).sort();
  }, [mosques]);

  const allTypes = useMemo(() => {
    return Array.from(new Set(mosques.map(m => m.type).filter(Boolean))).sort();
  }, [mosques]);

  const filteredMosques = useMemo(() => {
    return mosques.filter(m => {
      const matchCommune = !filterCommune || m.commune === filterCommune;
      const matchType = !filterType || m.type === filterType;
      const matchSearch = !searchQuery || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.items?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCommune && matchType && matchSearch;
    });
  }, [mosques, filterCommune, filterType, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredMosques.length;
    if (total === 0) return { total: 0, wuduPercent: 0, womenPercent: 0, avgServices: "0" };
    
    const withWudu = filteredMosques.filter(m => m.services?.some(s => s.toLowerCase().includes('wudu') || s.toLowerCase().includes('وضوء'))).length;
    const withWomenSpace = filteredMosques.filter(m => m.services?.some(s => s.toLowerCase().includes('femme') || s.toLowerCase().includes('women') || s.toLowerCase().includes('نساء'))).length;
    const averageServices = filteredMosques.reduce((acc, m) => acc + (m.services?.length || 0), 0) / total;

    return {
      total,
      wuduPercent: Math.round((withWudu / total) * 100),
      womenPercent: Math.round((withWomenSpace / total) * 100),
      avgServices: averageServices.toFixed(1)
    };
  }, [filteredMosques]);

  const communesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMosques.forEach(m => {
      const commune = m.commune || 'Other';
      counts[commune] = (counts[commune] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [filteredMosques]);

  const mosqueTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    filteredMosques.forEach(m => {
      const typeStr = m.type || 'Unknown';
      typeCounts[typeStr] = (typeCounts[typeStr] || 0) + 1;
    });
    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1]);
  }, [filteredMosques]);

  const topServices = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    filteredMosques.forEach(m => {
      if (m.services && Array.isArray(m.services)) {
        m.services.forEach(s => {
          serviceCounts[s] = (serviceCounts[s] || 0) + 1;
        });
      }
    });
    return Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1]);
  }, [filteredMosques]);

  const tabs = [
    { id: 'overview', label: t('Overview', language), icon: LayoutGrid },
    { id: 'communes', label: t('Communes', language), icon: MapIcon },
    { id: 'services', label: t('Services', language), icon: ListChecks },
    { id: 'types', label: t('Types', language), icon: Building2 },
    { id: 'explorer', label: t('Explorer', language), icon: Search },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden w-full transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 pt-safe transition-colors duration-300">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 flex items-center gap-2 mb-4">
            <BarChart2 size={28} className="text-emerald-500" />
            {t("Analysis", language)}
          </h1>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAnalysis(tab.id as AnalysisTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  activeAnalysis === tab.id
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pb-2">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 flex items-center gap-2 border border-transparent focus-within:border-emerald-500/50 transition-all">
              <Filter size={16} className="text-gray-400" />
              <select 
                value={filterCommune}
                onChange={(e) => setFilterCommune(e.target.value)}
                className="bg-transparent border-none text-sm w-full py-2 focus:ring-0 text-gray-700 dark:text-gray-300 outline-none appearance-none"
              >
                <option value="">{t('All Communes', language)}</option>
                {allCommunes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 flex items-center gap-2 border border-transparent focus-within:border-emerald-500/50 transition-all">
              <Building2 size={16} className="text-gray-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border-none text-sm w-full py-2 focus:ring-0 text-gray-700 dark:text-gray-300 outline-none appearance-none"
              >
                <option value="">{t('All Types', language)}</option>
                {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {(filterCommune || filterType || searchQuery) && (
              <button 
                onClick={() => {
                  setFilterCommune('');
                  setFilterType('');
                  setSearchQuery('');
                }}
                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-6">
          <AnimatePresence mode="wait">
            {activeAnalysis === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    <Compass className="text-emerald-500 mb-3" size={24} />
                    <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.total}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Total Mosques", language)}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    <CheckCircle2 className="text-blue-500 mb-3" size={24} />
                    <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.avgServices}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Avg Services", language)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <PieChart size={20} className="text-purple-500" />
                    {t("Key Facilities", language)}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("Wudu Facilities", language)}</span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.wuduPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.wuduPercent}%` }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("Women Space", language)}</span>
                        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.womenPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.womenPercent}%` }}
                          className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {(filterCommune || filterType) && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3">
                    <Zap size={20} className="text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-400">
                      {t("Analysis is currently filtered to", language)} {filterCommune} {filterType && `(${filterType})`}.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeAnalysis === 'communes' && (
              <motion.div
                key="communes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-gray-900 p-2 rounded-3xl border border-gray-100 dark:border-gray-800">
                  {communesData.map(([name, count], idx) => (
                    <div 
                      key={name}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group",
                        idx !== communesData.length - 1 && "border-b border-gray-50 dark:border-gray-800/50"
                      )}
                      onClick={() => setFilterCommune(name)}
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 transition-colors">{name}</div>
                        <div className="text-xs text-gray-500">{count} {t("Mosques", language)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-gray-900 dark:text-gray-100">
                          {Math.round((count / stats.total) * 100)}%
                        </div>
                      </div>
                      <ChevronRight size={16} className={cn("transition-transform", name === filterCommune ? "text-emerald-500 rotate-90" : "text-gray-300")} />
                    </div>
                  ))}
                  {communesData.length === 0 && (
                    <div className="p-12 text-center text-gray-500 font-medium">
                      {t("No data matching filters", language)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeAnalysis === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="grid grid-cols-1 gap-4"
              >
                {topServices.map(([name, count]) => (
                  <div key={name} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 group">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <ListChecks size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-gray-100 capitalize">{name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(count / filteredMosques.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeAnalysis === 'types' && (
              <motion.div
                key="types"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                className="space-y-4"
              >
                {mosqueTypes.map(([typeStr, count]) => (
                  <div 
                    key={typeStr} 
                    className={cn(
                      "bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-sm flex justify-between items-center group overflow-hidden relative cursor-pointer transition-all",
                      filterType === typeStr ? "border-blue-500 ring-1 ring-blue-500/20" : "border-gray-100 dark:border-gray-800"
                    )}
                    onClick={() => setFilterType(typeStr === filterType ? '' : typeStr)}
                  >
                    <div className={cn(
                      "absolute right-0 top-0 w-1 bg-blue-500 transition-all duration-300",
                      filterType === typeStr ? "h-full" : "h-0 group-hover:h-full"
                    )} />
                    <div>
                      <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">{t("Category", language)}</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">{typeStr}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-gray-100 dark:text-gray-800 group-hover:text-blue-500/10 transition-colors">{count}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeAnalysis === 'explorer' && (
              <motion.div
                key="explorer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t("Custom Analysis", language)}</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("Search by name, service, or items...", language)}
                        className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-gray-100 font-medium placeholder:text-gray-400 border border-transparent focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="text-emerald-500" size={20} />
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-300">{t("Live Stats", language)}</h4>
                    </div>
                    <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                      {filteredMosques.length} {t("Results matching your current filters and search criteria.", language)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-[10px] tracking-widest">{t("Top Matching Localities", language)}</h3>
                    <div className="flex flex-wrap gap-2">
                      {communesData.slice(0, 10).map(([name, count]) => (
                        <button
                          key={name}
                          onClick={() => setFilterCommune(name)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                            filterCommune === name
                              ? "bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20"
                              : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-emerald-500/30"
                          )}
                        >
                          {name} ({count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredMosques.length > 0 && filteredMosques.length < 50 && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-[10px] tracking-widest">{t("Matching Mosques", language)}</h3>
                      <div className="space-y-2">
                        {filteredMosques.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group/item">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{m.name}</div>
                              <div className="text-[10px] text-gray-500 truncate">{m.commune} • {m.type}</div>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 group-hover/item:text-emerald-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

