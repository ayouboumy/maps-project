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
  const { favorites, toggleFavorite, language, routeProfile, userLocation, setIsEquipmentOpen, darkMode } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'land' | 'construction' | 'services' | 'components' | 'revenue'>('general');
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

  // Optimized & Strict Manual Data Categorization based on specific 6-category structure
  const categories = useMemo(() => {
    const sections = {
      general: [] as any[],
      land: [] as any[],
      construction: [] as any[],
      services: [] as any[],
      components: [] as any[],
      revenue: [] as any[]
    };

    const highlights: any[] = [];
    let openingStatus: string | null = null;
    
    if (!mosque.extraData) return { sections, highlights, openingStatus: null };

    // 1. Explicit Category Prefix Detection (Since user says Excel has these titles)
    const categoryPrefixes: Record<string, keyof typeof sections> = {
      'معلومات عامة': 'general',
      'معلومات القطعة أرضية': 'land', // Matches slightly variations
      'معلومات القطعة الأرضية': 'land',
      'معلومات البناء': 'construction',
      'معلومات الخدمات': 'services',
      'مكونات المسجد': 'components',
      'معلومات الأملاك ذات العائد': 'revenue',
      'الأملاك ذات العائد': 'revenue',
      'general information': 'general',
      'land information': 'land',
      'construction information': 'construction',
      'services information': 'services',
      'mosque components': 'components',
      'revenue assets': 'revenue'
    };

    // 2. Priority Map for Exact Arabic & French Document Labels
    const explicitMap: Record<string, keyof typeof sections> = {
      // 1. General (معلومات عامة)
      'اسم المسجد': 'general', 'رمز المسجد': 'general', 'عنوان المسجد': 'general', 'الجماعة': 'general', 
      'جهة الإنفاق': 'general', 'تاريخ البناء': 'general', 'تاريخ الافتتاح': 'general', 'حالة البناية': 'general', 
      'طبيعة البناية': 'general', 'نظام الفتح': 'general', 'الوضعية العقارية': 'general', 'nom': 'general', 'code': 'general',
      'financement': 'general', 'nature de construction': 'general', 'état bâti': 'general',
      
      // 2. Land (معلومات القطعة الأرضية)
      'مساحة القطعة الأرضية': 'land', 'المساحة المبنية': 'land', 'غير المبنية: المساحة': 'land', 
      'غير المبنية: المساحة المهيأة': 'land', 'غير المبنية: المساحة غير المهيأة': 'land', 'X': 'land', 'Y': 'land', 
      'الاحداثيات': 'land', 'Latitude': 'land', 'Longitude': 'land', 'طبغرافي': 'land', 'وجود انحدار': 'land', 
      'وجود سواقي': 'land', 'المنطقة الحرارية': 'land', 'terrain': 'land', 'topographie': 'land',
      
      // 3. Construction (معلومات البناء)
      'نوع اليناء': 'construction', 'نوع البناء': 'construction', 'خراسانة مسلحة': 'construction', 
      'تراب أدوبي': 'construction', 'تراب بيزي': 'construction', 'حجر': 'construction', 
      'ياجور تقليدي': 'construction', 'توب خشبي': 'construction', 'توب معدني': 'construction', 
      'مواد البناء': 'construction', 'structure': 'construction', 'matériaux': 'construction',
      'type structure': 'construction', 'ossature': 'construction',
      
      // 4. Services (معلومات الخدمات)
      'عدد الولوجيات': 'services', 'شبكة طرقية': 'services', 'مسلك للعربات': 'services', 
      'مسلك غير صالح للعربات': 'services', 'ولوجيات ذوي الاحتياجات': 'services', 'شبكة الماء': 'services', 
      'بئر': 'services', 'عيون': 'services', 'شبكة الكهرباء': 'services', 'ألواح شمسية': 'services', 
      'شبكة التطهير': 'services', 'حفرة صحية': 'services', 'services': 'services', 'eau': 'services', 'électricité': 'services',
      'accès': 'services', 'routes': 'services', 'assainissement': 'services',
      
      // 5. Components (مكونات المسجد)
      'مساحة المقصورة': 'components', 'عدد قاعة الصلاة للرجال': 'components', 'مساحة قاعة الصلاة للرجال': 'components', 
      'عدد قاعة الصلاة للنساء': 'components', 'مساحة قاعة الصلاة للنساء': 'components', 'عدد مراحيض الرجال': 'components', 
      'مساحة مراحيض الرجال': 'components', 'عدد مراحيض للنساء': 'components', 'مساحة مراحيض للنساء': 'components', 
      'ارتفاع الصومعة': 'components', 'عدد طبقات الصومعة': 'components', 'قاعدة الصومعة': 'components', 
      'عدد سكن الامام': 'components', 'مساحة سكن الإمام': 'components', 'عدد سكن المؤذن': 'components', 
      'مساحة سكن المؤذن': 'components', 'عدد المخزن': 'components', 'مساحة المخزن': 'components', 
      'عدد المسيد': 'components', 'مساحة المسيد': 'components', 'عدد الكتاب القرآني القرآنية': 'components', 
      'مساحة الكتاب القرآني القرآنية': 'components', 'عدد المدرسة': 'components', 'مساحة المدرسة': 'components', 
      'عدد قاعة الاجتماعات': 'components', 'مساحة قاعة الاجتماعات': 'components', 'عدد الصحن': 'components', 
      'مساحة الصحن': 'components', 'عدد الأروقة': 'components', 'مساحة الأروقة': 'components', 
      'عدد غرفة الامام': 'components', 'مساحة غرفة الامام': 'components', 'عدد غرفة المؤذن': 'components', 
      'مساحة غرفة المؤذن': 'components', 'عدد غرفة المؤقت': 'components', 'مساحة غرفة المؤقت': 'components', 
      'عدد غرفة الموتى': 'components', 'مساحة غرفة الموتى': 'components', 'salle de prière': 'components', 'toilette': 'components',
      'minaret': 'components', 'logement imam': 'components', 'logement muezzin': 'components', 'msid': 'components',
      'Count سكن الامام': 'components', 'Area سكن الامام': 'components', 'Count سكن المؤذن': 'components', 'Area سكن المؤذن': 'components',
      'Nombre سكن الامام': 'components', 'Surface سكن الامام': 'components', 'Nombre سكن المؤذن': 'components', 'Surface سكن المؤذن': 'components',
      
      // 6. Revenue Assets (معلومات الأملاك ذات العائد)
      'عدد محلات تجارية': 'revenue', 'مساحة محلات تجارية': 'revenue', 'عدد سكن': 'revenue', 
      'مساحة سكن': 'revenue', 'الأملاك': 'revenue', 'محلات': 'revenue', 'عائدات': 'revenue', 'boutique': 'revenue', 'commerce': 'revenue',
      'locaux commerciaux': 'revenue', 'revenus': 'revenue', 'loyer': 'revenue',
      'Count محلات تجارية': 'revenue', 'Area محلات تجارية': 'revenue', 'Count سكن': 'revenue', 'Area سكن': 'revenue',
      'Nombre محلات تجارية': 'revenue', 'Surface محلات تجارية': 'revenue', 'Nombre سكن': 'revenue', 'Surface سكن': 'revenue'
    };

    // 3. Fallback Keyword Patterns (Carefully selected to avoid bleeding)
    const mapKeywords = {
      general: ['adresse', 'commune', 'ouverture', 'spending', 'gestionnaire', 'نظام'],
      land: ['area', 'surface terrain', 'coords', 'gps', 'topogra', 'slopes', 'gutters', 'thermal'],
      construction: ['concrete', 'adobe', 'pierre', 'brick', 'metal', 'bois', 'armé'],
      services: ['accès', 'piste', 'handicapé', 'puits', 'sources', 'photovolta', 'assainissement', 'septique', 'réseau'],
      components: ['maqasoura', 'wc', 'minaret', 'صومعة', 'magasin', 'msid', 'médersa', 'réunion', 'صحن', 'أروقة', 'mortuaire', 'chambre'],
      revenue: ['loyer', 'unités', 'residential', 'asset', 'income', 'commercial']
    };

    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase().trim();
      const valStr = String(value);

      if (lowerKey.includes('ouverture') || lowerKey.includes('ouvert')) {
        openingStatus = valStr;
      }

      if (lowerKey.includes('capacité') && !highlights.find(h => h.label === 'Capacity')) {
        highlights.push({ label: 'Capacity', value: valStr, icon: Users, color: 'emerald' });
      }

      // Priority 0: Forced Prefix Match (Highest Priority)
      for (const [prefix, cat] of Object.entries(categoryPrefixes)) {
        if (lowerKey.includes(prefix.toLowerCase())) {
          sections[cat].push({ key, value });
          return;
        }
      }

      // Priority 1: Explicit mapping
      if (explicitMap[key]) {
        sections[explicitMap[key]].push({ key, value });
        return;
      }
      
      // Try again with trimmed key in case of whitespace
      if (explicitMap[key.trim()]) {
        sections[explicitMap[key.trim()]].push({ key, value });
        return;
      }

      // Priority 2: Keyword mapping
      let matched = false;
      const cats: (keyof typeof sections)[] = ['revenue', 'components', 'services', 'construction', 'land', 'general'];
      for (const cat of cats) {
        if (mapKeywords[cat].some(kw => lowerKey.includes(kw))) {
          sections[cat].push({ key, value });
          matched = true;
          break;
        }
      }
      
      // Priority 3: Final Fallback to general
      if (!matched) {
        sections.general.push({ key, value });
      }
    });

    return { sections, highlights, openingStatus };
  }, [mosque.extraData, language]);

  const totalArea = parseFloat(String(mosque.extraData?.['Surface du terrain'] || mosque.extraData?.['مساحة القطعة الأرضية'] || 0));
  const builtArea = parseFloat(String(mosque.extraData?.['Surface bâtie'] || mosque.extraData?.['المساحة المبنية'] || 0));
  const builtPercentage = totalArea > 0 ? (builtArea / totalArea) * 100 : 0;

  const tabs = [
    { id: 'general', label: 'General Information', icon: Info },
    { id: 'land', label: 'Land Information', icon: Map },
    { id: 'construction', label: 'Construction Information', icon: Building2 },
    { id: 'services', label: 'Services Information', icon: Zap },
    { id: 'components', label: 'Mosque Components', icon: Layout },
    { id: 'revenue', label: 'Revenue Assets', icon: DollarSign }
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-gray-50 dark:bg-gray-950 overflow-hidden flex flex-col transition-colors duration-300"
    >
      {/* Compact Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 px-6 pt-safe-4 backdrop-blur-sm bg-white/10 dark:bg-black/10">
        <button 
          onClick={onClose}
          className="p-2.5 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-lg active:scale-90 transition-all"
        >
          <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="p-2.5 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-lg active:scale-90 transition-all"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all",
              isFavorite 
                ? "bg-red-500 text-white border-red-500" 
                : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
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
                <span className="px-2 py-0.5 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded-md text-[8px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-800">{categories.openingStatus}</span>
              )}
            </div>
            <h1 className="text-3xl font-serif font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
              {getLocalizedName(mosque, language)}
            </h1>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
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
              className="flex flex-col items-center justify-center p-3 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl shadow-xl active:scale-95 transition-all text-center"
            >
              {copied ? <Check size={20} /> : <Clipboard size={20} />}
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{copied ? t('Copied', language) : t('Copy GPS', language)}</span>
            </button>
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center shadow-sm">
              <Users size={20} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-tighter mt-1 truncate">
                {categories.highlights[0]?.value || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center shadow-sm">
              <Maximize size={20} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-tighter mt-1 truncate">
                {totalArea} m²
              </span>
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-10 pb-20">
            {tabs.map((tab) => {
              const items = categories.sections[tab.id];
              if (items.length === 0) return null;

              return (
                <div key={tab.id} className="relative">
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-6 sticky top-0 z-20 py-2 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 shadow-xl shadow-gray-200 dark:shadow-none">
                      <tab.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                        {t(tab.label, language)}
                      </h3>
                      <div className="flex gap-1 mt-1.5 focus:outline-none">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-1 w-4 rounded-full bg-emerald-500/30" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Specialized Land Metrics */}
                  {tab.id === 'land' && totalArea > 0 && (
                    <div className="mb-6 bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden relative group">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                      
                      <div className="relative z-10">
                        <div className="flex items-end justify-between mb-6">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest block mb-1">{t('Total Surface', language)}</span>
                            <span className="text-3xl font-serif font-black text-gray-900 dark:text-white">{totalArea} <span className="text-xs font-sans font-bold text-gray-400">m²</span></span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest block mb-1">{t('Built Ratio', language)}</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{builtPercentage.toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${builtPercentage}%` }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-sm" 
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{builtArea} m² {t('Built Coverage', language)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <span>{totalArea - builtArea} m² {t('Open Space', language)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Components Data Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300",
                          items.length % 2 !== 0 && i === 0 ? "sm:col-span-2" : ""
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest block mb-1 group-hover:text-emerald-500 transition-colors">
                              {item.key}
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                              {item.value}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 transition-all shrink-0">
                            <CheckCircle2 size={14} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Technical Inventory Footer Link */}
          <div className="pt-6">
            <button 
              onClick={() => setIsEquipmentOpen(true)}
              className="group relative w-full overflow-hidden p-6 bg-gray-900 dark:bg-white rounded-[40px] text-white dark:text-gray-900 shadow-2xl active:scale-95 transition-all"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Package size={80} />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 dark:bg-black/10 rounded-2xl flex items-center justify-center text-emerald-400 dark:text-emerald-600">
                    <Activity size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight leading-none mb-1.5">{t('Technical Inventory', language)}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{t('Track state of maintenance and equipment', language)}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-gray-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowLeft size={20} className={cn(language === 'ar' ? '' : 'rotate-180')} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
