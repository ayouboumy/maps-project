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
  ChevronRight
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

type AnalysisTab = 'overview' | 'communes' | 'services' | 'types';

export default function AnalysisScreen() {
  const { language, mosques } = useAppStore();
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisTab>('overview');

  const stats = useMemo(() => {
    const total = mosques.length;
    if (total === 0) return { total: 0, wuduPercent: 0, womenPercent: 0, avgServices: "0" };
    
    const withWudu = mosques.filter(m => m.services?.some(s => s.toLowerCase().includes('wudu') || s.toLowerCase().includes('وضوء'))).length;
    const withWomenSpace = mosques.filter(m => m.services?.some(s => s.toLowerCase().includes('femme') || s.toLowerCase().includes('women') || s.toLowerCase().includes('نساء'))).length;
    const averageServices = mosques.reduce((acc, m) => acc + (m.services?.length || 0), 0) / total;

    return {
      total,
      wuduPercent: Math.round((withWudu / total) * 100),
      womenPercent: Math.round((withWomenSpace / total) * 100),
      avgServices: averageServices.toFixed(1)
    };
  }, [mosques]);

  const communesData = useMemo(() => {
    const counts: Record<string, number> = {};
    mosques.forEach(m => {
      const commune = m.commune || 'Other';
      counts[commune] = (counts[commune] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [mosques]);

  const mosqueTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    mosques.forEach(m => {
      const typeStr = m.type || 'Unknown';
      typeCounts[typeStr] = (typeCounts[typeStr] || 0) + 1;
    });
    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1]);
  }, [mosques]);

  const topServices = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    mosques.forEach(m => {
      if (m.services && Array.isArray(m.services)) {
        m.services.forEach(s => {
          serviceCounts[s] = (serviceCounts[s] || 0) + 1;
        });
      }
    });
    return Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1]);
  }, [mosques]);

  const tabs = [
    { id: 'overview', label: t('Overview', language), icon: LayoutGrid },
    { id: 'communes', label: t('Communes', language), icon: MapIcon },
    { id: 'services', label: t('Services', language), icon: ListChecks },
    { id: 'types', label: t('Types', language), icon: Building2 },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden w-full transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 pt-safe transition-colors duration-300">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 flex items-center gap-2 mb-4">
            <BarChart2 size={28} className="text-emerald-500" />
            {t("Analysis", language)}
          </h1>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                        "flex items-center gap-4 p-4 rounded-2xl transition-colors",
                        idx !== communesData.length - 1 && "border-b border-gray-50 dark:border-gray-800/50"
                      )}
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{name}</div>
                        <div className="text-xs text-gray-500">{count} {t("Mosques", language)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-gray-900 dark:text-gray-100">
                          {Math.round((count / stats.total) * 100)}%
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  ))}
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
                            style={{ width: `${(count / mosques.length) * 100}%` }}
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
                  <div key={typeStr} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex justify-between items-center group overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-1 bg-blue-500 h-0 group-hover:h-full transition-all duration-300" />
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

