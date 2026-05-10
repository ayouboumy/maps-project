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
  Activity,
  TrendingUp,
  BrainCircuit,
  Maximize2,
  Accessibility,
  Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line
} from 'recharts';

type AnalysisTab = 'overview' | 'communes' | 'services' | 'types' | 'explorer' | 'intelligence' | 'custom';

export default function AnalysisScreen() {
  const { language, mosques } = useAppStore();
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisTab>('overview');
  const [filterCommune, setFilterCommune] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom Dimension Picker state
  const [mainDimension, setMainDimension] = useState<'commune' | 'type' | 'spending' | 'condition'>('commune');
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');

  // Extract unique attributes (services + items)
  const allAttributes = useMemo(() => {
    const attrs = new Set<string>();
    mosques.forEach(m => {
      m.services?.forEach(s => attrs.add(s));
      m.items?.forEach(i => attrs.add(i));
    });
    return Array.from(attrs).sort();
  }, [mosques]);

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
    if (total === 0) return { total: 0, wuduPercent: 0, womenPercent: 0, avgServices: "0", womenCount: 0, accessibilityCount: 0 };
    
    const withWudu = filteredMosques.filter(m => m.services?.some(s => s.toLowerCase().includes('wudu') || s.toLowerCase().includes('وضوء'))).length;
    const withWomenSpace = filteredMosques.filter(m => 
      m.services?.some(s => s.toLowerCase().includes('femme') || s.toLowerCase().includes('women') || s.toLowerCase().includes('نساء') || s.toLowerCase().includes('قاعة صلاة للنساء')) ||
      (m as any).womenHallCount > 0
    ).length;

    const withAccessibility = filteredMosques.filter(m => 
      m.services?.some(s => s.toLowerCase().includes('access') || s.toLowerCase().includes('handicap') || s.toLowerCase().includes('ولوجيات') || s.toLowerCase().includes('disabled'))
    ).length;

    const averageServices = filteredMosques.reduce((acc, m) => acc + (m.services?.length || 0), 0) / total;

    return {
      total,
      wuduPercent: Math.round((withWudu / total) * 100),
      womenPercent: Math.round((withWomenSpace / total) * 100),
      avgServices: averageServices.toFixed(1),
      womenCount: withWomenSpace,
      accessibilityCount: withAccessibility
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

  const profileData = useMemo(() => {
    if (filteredMosques.length === 0) return [];
    
    return [
      { subject: 'Services', A: Math.min(100, (parseFloat(stats.avgServices) / 10) * 100) },
      { subject: 'Wudu', A: stats.wuduPercent },
      { subject: 'Women', A: stats.womenPercent },
      { subject: 'Types', A: Math.min(100, (mosqueTypes.length / 10) * 100) },
      { subject: 'Scale', A: Math.min(100, (stats.total / (mosques.length || 1)) * 100) }
    ];
  }, [stats, filteredMosques, mosqueTypes, mosques.length]);

  // Recharts Data Transformation
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMosques.forEach(m => {
      let key = 'Unknown';
      if (mainDimension === 'commune') key = m.commune || 'Other';
      else if (mainDimension === 'type') key = m.type || 'Other';
      else if (mainDimension === 'spending') key = (m as any).spendingType || 'Other';
      else if (mainDimension === 'condition') key = (m as any).condition || 'Other';
      
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Show top 10 for better visualization
  }, [filteredMosques, mainDimension]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMosques.forEach(m => {
      const type = m.type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredMosques]);

  const insights = useMemo(() => {
    if (filteredMosques.length < 5) return [];
    
    const messages = [];
    const mainCommune = communesData[0];
    if (mainCommune) {
      messages.push(`${mainCommune[0]} has the highest concentration of mosques in the current view (${mainCommune[1]}).`);
    }

    if (stats.wuduPercent > 80) {
      messages.push(t("Excellent coverage of wudu facilities across the selected mosques.", language));
    } else if (stats.wuduPercent < 40) {
      messages.push(t("Significant need for improved wudu facilities in this selection.", language));
    }

    if (stats.womenPercent > 50) {
      messages.push(t("High availability of designated spaces for women in these localities.", language));
    }

    const typeStats = Object.entries(filteredMosques.reduce((acc, m) => {
      const t = m.type || 'Other';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);

    if (typeStats[0]) {
      messages.push(t("Most mosques in this category are classified as", language) + ` '${typeStats[0][0]}'.`);
    }

    // New: Anomaly detection (communes with way above average services)
    const avgServ = parseFloat(stats.avgServices);
    communesData.forEach(([name, count]) => {
      const communeMosques = filteredMosques.filter(m => m.commune === name);
      const communeAvg = communeMosques.reduce((acc, m) => acc + (m.services?.length || 0), 0) / count;
      if (communeAvg > avgServ * 1.5 && count > 2) {
        messages.push(`${name} ` + t("has significantly better equipped mosques than average.", language));
      }
    });

    return messages;
  }, [filteredMosques, stats, communesData, language]);

  const tabs = [
    { id: 'overview', label: t('Overview', language), icon: LayoutGrid },
    { id: 'communes', label: t('Communes', language), icon: MapIcon },
    { id: 'services', label: t('Services', language), icon: ListChecks },
    { id: 'types', label: t('Types', language), icon: Building2 },
    { id: 'intelligence', label: t('Intelligence', language), icon: BrainCircuit },
    { id: 'custom', label: t('Dynamic Analysis', language), icon: Zap },
    { id: 'explorer', label: t('Explorer', language), icon: Search },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

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
                    <Compass className="text-emerald-500 mb-2" size={24} />
                    <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.total}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Total Mosques", language)}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    <CheckCircle2 className="text-blue-500 mb-2" size={24} />
                    <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.avgServices}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Avg Services", language)}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                    <Users className="text-purple-500 mb-2" size={24} />
                    <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.womenCount}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Mosques with Women Hall", language)}</div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                    <Accessibility className="text-orange-500 mb-2" size={24} />
                    <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.accessibilityCount}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Mosques with Accessibility", language)}</div>
                  </div>
                </div>

                {/* Animated Chart Section */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-500" />
                      {t("Distribution", language)}
                    </h3>
                    <select 
                      value={mainDimension}
                      onChange={(e) => setMainDimension(e.target.value as any)}
                      className="text-xs font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border-none outline-none text-emerald-600 dark:text-emerald-400"
                    >
                      <option value="commune">Commune</option>
                      <option value="type">Type</option>
                      <option value="spending">Authority</option>
                      <option value="condition">Condition</option>
                    </select>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          scale="band" 
                          tick={{ fontSize: 10, fontWeight: 600 }}
                          width={80}
                        />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          radius={[0, 10, 10, 0]}
                          barSize={20}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Maximize2 size={18} className="text-purple-500" />
                    {t("Selection Profile", language)}
                  </h3>
                  <div className="h-64 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profileData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                        <Radar
                          name="Selection"
                          dataKey="A"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
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
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{t("Mosque Density", language)}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("A breakdown of mosques by geographical location.", language)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                    <MapIcon size={24} />
                  </div>
                </div>

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
                </div>
              </motion.div>
            )}

            {activeAnalysis === 'custom' && (
              <motion.div
                key="custom"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t("Select an Attribute", language)}</label>
                    <select 
                      value={selectedAttribute}
                      onChange={(e) => setSelectedAttribute(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl py-4 px-4 text-gray-900 dark:text-gray-100 font-bold border border-transparent focus:border-emerald-500/50 outline-none appearance-none"
                    >
                      <option value="">-- {t("Analyze", language)} --</option>
                      {allAttributes.map(attr => (
                        <option key={attr} value={attr}>{t(attr, language)}</option>
                      ))}
                    </select>
                  </div>

                  {selectedAttribute && (
                    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20 text-center">
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {filteredMosques.filter(m => m.services?.includes(selectedAttribute) || m.items?.includes(selectedAttribute)).length}
                          </div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("Total", language)}</div>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20 text-center">
                          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {Math.round((filteredMosques.filter(m => m.services?.includes(selectedAttribute) || m.items?.includes(selectedAttribute)).length / filteredMosques.length) * 100)}%
                          </div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("Percentage", language)}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{t("Distribution by Commune", language)}</h4>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={
                              Object.entries(
                                filteredMosques
                                  .filter(m => m.services?.includes(selectedAttribute) || m.items?.includes(selectedAttribute))
                                  .reduce((acc, m) => {
                                    const c = m.commune || 'Other';
                                    acc[c] = (acc[c] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                              )
                              .map(([name, value]) => ({ name, value }))
                              .sort((a, b) => b.value - a.value)
                              .slice(0, 8)
                            }>
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                              <YAxis hide />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{t("Distribution by Category", language)}</h4>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={
                              Object.entries(
                                filteredMosques
                                  .filter(m => m.services?.includes(selectedAttribute) || m.items?.includes(selectedAttribute))
                                  .reduce((acc, m) => {
                                    const t = m.type || 'Other';
                                    acc[t] = (acc[t] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                              )
                              .map(([name, value]) => ({ name, value }))
                              .sort((a, b) => b.value - a.value)
                            }>
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                              <YAxis hide />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedAttribute && (
                    <div className="py-20 text-center space-y-4 opacity-50">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                        <Activity size={32} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">{t("Select an attribute above to begin real-time analysis", language)}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeAnalysis === 'intelligence' && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  {insights.map((insight, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex items-start gap-4 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                        <Zap size={20} />
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                        {insight}
                      </p>
                    </motion.div>
                  ))}

                  {insights.length === 0 && (
                    <div className="p-12 text-center text-gray-500 font-medium">
                      {t("Not enough data for intelligence analysis", language)}
                    </div>
                  )}

                  <div className="bg-gray-900 dark:bg-black p-8 rounded-[40px] text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <TrendingUp size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">{t("Data Insights", language)}</span>
                      </div>
                      <h2 className="text-2xl font-bold leading-tight">
                        {t("Structural Trends", language)}
                      </h2>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="text-emerald-400 font-black text-2xl">{stats.avgServices}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("Complexity Score", language)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-emerald-400 font-black text-2xl">{stats.total}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("Sample Size", language)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest of the existing tabs (Services, Types, Explorer) will be handled similarly */}
            {/* Keeping them for completeness but updating visuals within */}

            {activeAnalysis === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 gap-4"
              >
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm h-80">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <ListChecks size={20} className="text-blue-500" />
                    {t("Common Amenities", language)}
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topServices.slice(0, 8).map(([name, count]) => ({ name, count }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                      <YAxis hide />
                      <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4 pt-4">
                  {topServices.map(([name, count]) => (
                    <div key={name} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 group">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-2xl">
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
                </div>
              </motion.div>
            )}

            {activeAnalysis === 'types' && (
              <motion.div
                key="types"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm h-64 flex flex-col items-center">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 self-start">{t("Category Breakdown", language)}</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-4">
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
                </div>
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

