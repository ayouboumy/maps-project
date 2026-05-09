import { useAppStore } from '../store/useAppStore';
import { t } from '../utils/translations';
import { BarChart2, Compass, Building2, ListChecks } from 'lucide-react';
import { useMemo } from 'react';

export default function AnalysisScreen() {
  const { language, mosques } = useAppStore();

  const mosqueTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    mosques.forEach(m => {
      const typeStr = m.type || 'Unknown';
      typeCounts[typeStr] = (typeCounts[typeStr] || 0) + 1;
    });
    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [mosques]);

  const mosquesCount = language === 'ar' ? 'إجمالي المساجد' : (language === 'fr' ? 'Total des Mosquées' : 'Total Mosques');

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto w-full transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 pt-safe transition-colors duration-300">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 flex items-center gap-2">
            <BarChart2 size={28} className="text-emerald-500" />
            {t("Analysis", language)}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Compass size={18} />
            <span className="text-sm font-medium">{mosquesCount}</span>
          </div>
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {mosques.length}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-blue-500" />
            {t('Types of Mosques', language)}
          </h2>
          
          <div className="space-y-3">
            {mosqueTypes.map(([typeStr, count]) => {
              const maxCount = mosqueTypes[0][1];
              const widthPercent = Math.max((count / maxCount) * 100, 10);
              
              return (
                <div key={typeStr} className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span className="capitalize">{typeStr}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <ListChecks size={20} className="text-purple-500" />
            {t('Most Common Amenities', language)}
          </h2>
          
          <div className="space-y-3">
            {topServices.map(([service, count]) => {
              const maxCount = topServices[0][1];
              const widthPercent = Math.max((count / maxCount) * 100, 10);
              
              return (
                <div key={service} className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span className="capitalize">{service}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
