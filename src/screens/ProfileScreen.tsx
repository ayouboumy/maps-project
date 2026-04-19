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
  const [activeView, setActiveView] = useState<'overview' | 'details'>('overview');
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
  const { organizedSections, highlights, openingStatus } = useMemo(() => {
    const h: { label: string; value: string; icon: any; color: string }[] = [];
    let opening: string | null = null;
    
    if (!mosque.extraData) return { organizedSections: [], highlights: [], openingStatus: null };

    const sections = [
      {
        id: 'general',
        title: t('General Information', language),
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        keywords: ['nom', 'code', 'adresse', 'commune', 'financement', 'type', 'nature', 'construction', 'état', 'mhai', 'association', 'bienfaiteurs', 'ouverture', 'nidhara', 'awqaf'],
        items: [] as { key: string; value: any; icon?: any }[]
      },
      {
        id: 'land',
        title: t('Land Information', language),
        icon: Map,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        keywords: ['terrain', 'bâtie', 'aménagée', 'x', 'y', 'longitude', 'latitude', 'topographie', 'talus', 'rigoles', 'ravin', 'zone thermique'],
        items: [] as { key: string; value: any; icon?: any }[]
      },
      {
        id: 'construction',
        title: t('Construction Information', language),
        icon: Layers,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        keywords: ['béton', 'terre', 'adobe', 'pisé', 'pierre', 'brique', 'tôle', 'bois', 'métallique', 'matériaux'],
        items: [] as { key: string; value: any; icon?: any }[]
      },
      {
        id: 'services',
        title: t('Services Information', language),
        icon: Zap,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-100',
        keywords: ['accès', 'routier', 'piste', 'handicapé', 'eau', 'puits', 'sources', 'électricité', 'photovoltaïque', 'assainissement', 'fosse', 'septique'],
        items: [] as { key: string; value: any; icon?: any }[]
      },
      {
        id: 'components',
        title: t('Mosque Components', language),
        icon: Layout,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
        keywords: ['maqasoura', 'salle', 'prière', 'hommes', 'femmes', 'toilette', 'minaret', 'صومعة', 'طبقات', 'logement', 'imam', 'muezzin', 'mouadhine', 'magasin', 'msid', 'médersa', 'réunion', 'صحن', 'أروقة', 'mortuaire'],
        items: [] as { key: string; value: any; icon?: any }[]
      },
      {
        id: 'assets',
        title: t('Revenue-Generating Assets', language),
        icon: DollarSign,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        keywords: ['boutique', 'commerce', 'locaux', 'سكن', 'عائد', 'loyer'],
        items: [] as { key: string; value: any; icon?: any }[]
      },
      {
        id: 'intelligence',
        title: t('Learned Insights', language),
        icon: Sparkles,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        keywords: [],
        items: [] as { key: string; value: any; icon?: any }[]
      }
    ];

    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const valStr = String(value);

      // Extract opening status for the header
      if (lowerKey.includes('ouverture') || lowerKey.includes('ouvert')) {
        opening = valStr;
      }

      // Populate highlights
      if (lowerKey.includes('capacité') && !h.find(item => item.label === 'Capacity')) {
        h.push({ label: 'Capacity', value: valStr, icon: Users, color: 'emerald' });
      }
      if ((lowerKey.includes('surface') || lowerKey.includes('superficie')) && (lowerKey.includes('terrain') || lowerKey.includes('totale')) && !h.find(item => item.label === 'Surface')) {
        h.push({ label: 'Surface', value: valStr, icon: Maximize, color: 'blue' });
      }
      if (lowerKey.includes('état') && !h.find(item => item.label === 'Condition')) {
        h.push({ label: 'Condition', value: valStr, icon: Activity, color: 'amber' });
      }

      // Smart Categorization
      let matched = false;
      for (const section of sections) {
        if (section.id === 'intelligence') continue;
        if (section.keywords.some(kw => lowerKey.includes(kw))) {
          section.items.push({ key, value });
          matched = true;
          break;
        }
      }

      if (!matched) {
        sections.find(s => s.id === 'intelligence')?.items.push({ key, value });
      }
    });

    return { 
      organizedSections: sections.filter(s => s.items.length > 0),
      highlights: h,
      openingStatus: opening
    };
  }, [mosque.extraData, language]);

  const totalArea = parseFloat(String(mosque.extraData?.['Surface du terrain'] || mosque.extraData?.['مساحة القطعة الأرضية'] || 0));
  const builtArea = parseFloat(String(mosque.extraData?.['Surface bâtie'] || mosque.extraData?.['المساحة المبنية'] || 0));
  const builtPercentage = totalArea > 0 ? (builtArea / totalArea) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-white overflow-hidden flex flex-col"
    >
      {/* Top Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 px-6 pt-safe-4">
        <button 
          onClick={onClose}
          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-900 border border-black/5 shadow-xl active:scale-95 transition-all"
        >
          <ArrowLeft size={22} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-900 border border-black/5 shadow-xl active:scale-95 transition-all"
          >
            <Share2 size={22} />
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "p-3 backdrop-blur-md rounded-2xl border shadow-xl active:scale-95 transition-all",
              isFavorite 
                ? "bg-red-500/10 text-red-500 border-red-500/20" 
                : "bg-white/90 text-gray-900 border-black/5"
            )}
          >
            <Heart size={22} className={cn(isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Banner Section */}
        <div className="relative h-[55vh] min-h-[450px]">
          <img 
            src={mosque.image} 
            alt={mosque.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent h-40" />

          {/* Title & Location Header */}
          <div className="absolute bottom-12 left-6 right-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30">
                {t(mosque.type, language)}
              </div>
              {openingStatus && (
                <div className="px-3 py-1 bg-white/90 backdrop-blur-md text-gray-900 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-black/5 shadow-lg">
                  {t(openingStatus, language)}
                </div>
              )}
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-6xl font-serif font-black text-gray-900 leading-[1.05] tracking-tight mb-4"
            >
              {getLocalizedName(mosque, language)}
            </motion.h1>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-2 text-gray-500 font-medium"
            >
              <MapPin size={18} className="shrink-0 mt-1" />
              <span className="text-lg leading-tight">{t(mosque.address, language)}</span>
            </motion.div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 pb-32">
          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <button 
              onClick={handleOpenGoogleMapsRoute}
              className="flex items-center justify-between p-4 bg-emerald-600 rounded-[24px] text-white shadow-2xl shadow-emerald-600/20 active:scale-[0.98] transition-all"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-1">{t('Navigation', language)}</span>
                <span className="text-sm font-bold">{t('Google Maps', language)}</span>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Navigation size={20} />
              </div>
            </button>

            <button 
              onClick={handleCopyPosition}
              className="flex items-center justify-between p-4 bg-blue-600 rounded-[24px] text-white shadow-2xl shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-1">{t('Coordinates', language)}</span>
                <span className="text-sm font-bold">{copied ? t('Copied', language) : t('Copy GPS', language)}</span>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                {copied ? <Check size={20} /> : <Clipboard size={20} />}
              </div>
            </button>
          </div>

          {/* Key Facts / Highlights Row */}
          <div className="flex gap-4 overflow-x-auto pb-4 mb-10 scrollbar-hide -mx-6 px-6">
            {highlights.map((h, i) => (
              <div key={i} className="bg-gray-50/50 border border-gray-100 p-4 rounded-[24px] min-w-[160px] flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl", `bg-${h.color}-50 text-${h.color}-600`)}>
                  <h.icon size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t(h.label, language)}</span>
                  <span className="text-sm font-bold text-gray-900">{h.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Area Visualization */}
          {totalArea > 0 && (
            <div className="mb-12 bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t('Built vs Total Space', language)}</h3>
                <span className="text-xs font-bold text-emerald-600 font-mono">{builtPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4 border border-black/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${builtPercentage}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t('Built Area', language)}: {builtArea} m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-100 border border-black/5" />
                  <span>{t('Total Area', language)}: {totalArea} m²</span>
                </div>
              </div>
            </div>
          )}

          {/* Organized Content Sections */}
          <div className="space-y-12">
            {organizedSections.map((section, idx) => (
              <motion.section 
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("p-2.5 rounded-2xl shadow-sm", section.bgColor, section.color)}>
                    <section.icon size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-black text-gray-900 leading-none mb-1">{section.title}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {section.items.length} {t('Data Points', language)}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gray-100 ml-4 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.items.map((item, i) => (
                    <div 
                      key={i} 
                      className="group bg-white border border-gray-100 p-4 rounded-[20px] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.15em] group-hover:text-emerald-500 transition-colors">
                          {t(item.key, language)}
                        </span>
                        <span className="text-sm font-bold text-gray-800 leading-tight">
                          {t(String(item.value), language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Equipment Quick Link */}
          <button 
            onClick={() => setIsEquipmentOpen(true)}
            className="mt-16 w-full p-6 bg-gray-900 rounded-[32px] text-white flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                <Package size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-lg font-bold leading-none mb-1">{t('Mosque Equipment', language)}</h4>
                <p className="text-xs text-gray-400 font-medium">{t('Manage technical items and tracking', language)}</p>
              </div>
            </div>
            <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-gray-900 transition-all">
              <ArrowLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
