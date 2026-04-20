import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Navigation, Heart, CheckCircle2, 
  Clipboard, Check, Share2, Building2, Users, Maximize, 
  Home, Droplets, Info, Activity, Clock, ShieldCheck,
  Package, Map, Zap, Layout, DollarSign, Waves, Globe, 
  Thermometer, Ruler, Layers, ShoppingBag, School, BookOpen,
  Dna, Sparkles
} from 'lucide-react';
import { Mosque } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t, getLocalizedName } from '../utils/translations';
import { useState, useMemo } from 'react';

interface ProfileScreenProps {
  mosque: Mosque;
  onClose: () => void;
}

export default function ProfileScreen({ mosque, onClose }: ProfileScreenProps) {
  const { favorites, toggleFavorite, language, routeProfile, userLocation, setIsEquipmentOpen } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'structure' | 'utility' | 'assets'>('identity');
  const isFavorite = favorites.includes(mosque.id);

  const handleCopyPosition = () => {
    const coords = `${mosque.latitude}, ${mosque.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mosque.name,
          text: `${mosque.name} - ${mosque.address}`,
          url: `https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleOpenGoogleMapsRoute = () => {
    const travelMode = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
    if (userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    }
  };

  // Intelligent & Organized Data Categorization
  const categories = useMemo(() => {
    const sections = {
      identity: [] as any[],
      structure: [] as any[],
      utility: [] as any[],
      assets: [] as any[]
    };

    const highlights: any[] = [];
    let opening: string | null = null;
    
    if (!mosque.extraData) return { sections, highlights, openingStatus: null };

    const mapKeywords = {
      identity: ['nom', 'code', 'adresse', 'commune', 'financement', 'type', 'nature', 'construction', 'état', 'mhai', 'association', 'bienfaiteurs', 'ouverture', 'nidhara', 'awqaf'],
      structure: ['terrain', 'bâtie', 'aménagée', 'x', 'y', 'longitude', 'latitude', 'topographie', 'talus', 'rigoles', 'ravin', 'zone thermique', 'béton', 'terre', 'adobe', 'pisé', 'pierre', 'brique', 'tôle', 'bois', 'métallique', 'matériaux', 'maqasoura', 'salle', 'prière', 'hommes', 'femmes', 'toilette', 'minaret', 'صومعة', 'طبقات', 'magasin', 'msid', 'médersa', 'réunion', 'صحن', 'أروقة', 'mortuaire'],
      utility: ['accès', 'routier', 'piste', 'handicapé', 'eau', 'puits', 'sources', 'électricité', 'photovoltaïque', 'assainissement', 'fosse', 'septique', 'logement', 'imam', 'muezzin', 'mouadhine'],
      assets: ['boutique', 'commerce', 'locaux', 'سكن', 'عائد', 'loyer']
    };

    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const valStr = String(value);

      if (lowerKey.includes('ouverture') || lowerKey.includes('ouvert')) {
        opening = valStr;
      }

      if (lowerKey.includes('capacité') && !highlights.find(h => h.label === 'Capacity')) {
        highlights.push({ label: 'Capacity', value: valStr, icon: Users, color: 'emerald' });
      }

      let matched = false;
      for (const [tab, keywords] of Object.entries(mapKeywords)) {
        if (keywords.some(kw => lowerKey.includes(kw))) {
          sections[tab as keyof typeof sections].push({ key, value });
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        sections.identity.push({ key, value });
      }
    });

    return { sections, highlights, openingStatus: opening };
  }, [mosque.extraData, language]);

  const totalArea = parseFloat(String(mosque.extraData?.['Surface du terrain'] || mosque.extraData?.['مساحة القطعة الأرضية'] || 0));
  const builtArea = parseFloat(String(mosque.extraData?.['Surface bâtie'] || mosque.extraData?.['المساحة المبنية'] || 0));
  const builtPercentage = totalArea > 0 ? (builtArea / totalArea) * 100 : 0;

  const tabs = [
    { id: 'identity', label: 'Identity', icon: Info },
    { id: 'structure', label: 'Structure', icon: Layout },
    { id: 'utility', label: 'Facilities', icon: Zap },
    { id: 'assets', label: 'Economy', icon: DollarSign }
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-gray-50 overflow-hidden flex flex-col"
    >
      {/* Compact Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 px-6 pt-safe-4 backdrop-blur-sm bg-white/10">
        <button 
          onClick={onClose}
          className="p-2.5 bg-white rounded-xl text-gray-900 border border-gray-100 shadow-lg active:scale-90 transition-all"
        >
          <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="p-2.5 bg-white rounded-xl text-gray-900 border border-gray-100 shadow-lg active:scale-90 transition-all"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all",
              isFavorite 
                ? "bg-red-500 text-white border-red-500" 
                : "bg-white text-gray-900 border-gray-100"
            )}
          >
            <Heart size={20} className={cn(isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Compact Hero Banner */}
        <div className="relative h-[38vh] min-h-[300px]">
          <img 
            src={mosque.image} 
            alt={mosque.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest">{mosque.type}</span>
              {categories.openingStatus && (
                <span className="px-2 py-0.5 bg-white/90 text-gray-900 rounded-md text-[8px] font-black uppercase tracking-widest border border-gray-200">{categories.openingStatus}</span>
              )}
            </div>
            <h1 className="text-3xl font-serif font-black text-gray-900 leading-tight mb-1 drop-shadow-sm">
              {getLocalizedName(mosque, language)}
            </h1>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
              <MapPin size={14} className="shrink-0" />
              <span className="line-clamp-1">{t(mosque.address, language)}</span>
            </div>
          </div>
        </div>

        {/* Action & Stats Summary */}
        <div className="px-5 -mt-4 relative z-10 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={handleOpenGoogleMapsRoute}
              className="flex flex-col items-center justify-center p-3 bg-emerald-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all text-center"
            >
              <Navigation size={20} />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{t('Google Maps', language)}</span>
            </button>
            <button 
              onClick={handleCopyPosition}
              className="flex flex-col items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all text-center"
            >
              {copied ? <Check size={20} /> : <Clipboard size={20} />}
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{copied ? t('Copied', language) : t('Copy GPS', language)}</span>
            </button>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-2xl text-center shadow-sm">
              <Users size={20} className="text-gray-400" />
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter mt-1 truncate">
                {categories.highlights[0]?.value || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-2xl text-center shadow-sm">
              <Maximize size={20} className="text-gray-400" />
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter mt-1 truncate">
                {totalArea} m²
              </span>
            </div>
          </div>

          {/* Sticky Tabs Navigation */}
          <div className="sticky top-2 z-40 bg-white/70 backdrop-blur-xl p-1.5 rounded-2xl border border-white shadow-xl flex gap-1 items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{t(tab.label, language)}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Specialized Component for Structure Tab */}
              {activeTab === 'structure' && totalArea > 0 && (
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Occupancy Rate', language)}</h3>
                    <span className="text-xs font-bold text-emerald-600">{builtPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${builtPercentage}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                    <span>{builtArea} m² {t('Built', language)}</span>
                    <span>{totalArea} m² {t('Total', language)}</span>
                  </div>
                </div>
              )}

              {/* High Density Grid for All Tabs */}
              <div className="grid grid-cols-2 gap-2.5">
                {categories.sections[activeTab].map((item, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "group bg-white border border-gray-100 p-3 rounded-2xl hover:border-emerald-200 hover:shadow-lg transition-all",
                      categories.sections[activeTab].length % 2 !== 0 && i === 0 ? "col-span-2" : ""
                    )}
                  >
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest group-hover:text-emerald-500 transition-colors block mb-0.5">
                      {t(item.key, language)}
                    </span>
                    <span className="text-xs font-bold text-gray-800 line-clamp-1">
                      {t(String(item.value), language)}
                    </span>
                  </div>
                ))}
                {categories.sections[activeTab].length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-gray-400 opacity-50">
                    <Layout size={32} strokeWidth={1} />
                    <span className="mt-2 text-xs font-medium italic">{t('Not categorized yet', language)}</span>
                  </div>
                )}
              </div>

              {/* Utility / Services Tab Footer */}
              {activeTab === 'utility' && (
                <div className="pt-4 grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setIsEquipmentOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-3xl text-white shadow-xl active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Package size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold leading-none mb-1">{t('Manage Equipment', language)}</h4>
                        <p className="text-[10px] text-gray-400">{t('Technical inventory tracking', language)}</p>
                      </div>
                    </div>
                    <ArrowLeft size={16} className={language === 'ar' ? '' : 'rotate-180'} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
