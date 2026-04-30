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
  const [activeTab, setActiveTab] = useState<'general' | 'land' | 'construction' | 'services' | 'components' | 'revenue' | 'other'>('general');
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

  // Optimized & Strict Manual Data Categorization based on specific 6-category structure provided by user
  const categories = useMemo(() => {
    const exactStructure = {
      general: [
        "اسم المسجد", "رمز المسجد", "عنوان المسجد", "الجماعة", "جهة الإنفاق", 
        "type", "nature", "تاريخ البناء", "حالة البناية", 
        "mhai", "association", "comité_de_quartier", "bienfaiteurs", "autre", "ouverture"
      ],
      land: [
        "مساحة القطعة الأرضية", "المساحة المبنية", "غير المبنية: المساحة", "غير المبنية: المساحة المهيأة", 
        "غير المبنية: المساحة غير المهيأة", "x", "y", "longitude", "latitude", 
        "topogaphique", "existance de talus", "existance de rigoles d'eau", "ravin", 
        "ter_gmp_autre", "zone_thermique"
      ],
      construction: [
        "نوع اليناء", "béton_armé", "construction_en_terre_adobe", "construction_en_terre_pisé", 
        "msq_mat_pierre", "brique_traditionnel", "tôle_en_bois", "tôle_métallique"
      ],
      services: [
        "nombre_d_accès_à_la_mosquée", "réseau_routier", "piste_carossable", "piste_non_carossable", 
        "accessibilité_handicapé", "branché_au_réseau_d_eau_potable", "puits", "sources", 
        "branché_au_réseau_d_électricité", "photovoltaïque", "traditionnel", 
        "branché_au_réseau_d_assainissement", "fosse_septique_puits_perdu", "aucun"
      ],
      components: [
        "مساحة المقصورة", "عدد قاعة الصلاة للرجال", "مساحة قاعة الصلاة للرجال", "عدد قاعة الصلاة للنساء",
        "مساحة قاعة الصلاة للنساء", "عدد مراحيض الرجال", "مساحة مراحيض الرجال", "عدد مراحيض للنساء",
        "مساحة مراحيض للنساء", "ارتفاع الصومعة", "عدد طبقات الصومعة", "قاعدة الصومعة", "عدد سكن الامام",
        "مساحة سكن الإمام", "عدد سكن المؤذن", "مساحة سكن المؤذن", "عدد المخزن", "مساحة المخزن",
        "عدد المسيد", "مساحة المسيد", "عدد الكتاب القرآني القرآنية", "مساحة الكتاب القرآني القرآنية",
        "عدد المدرسة", "مساحة المدرسة", "عدد قاعة الاجتماعات", "مساحة قاعة الاجتماعات",
        "عدد الصحن", "مساحة الصحن", "عدد الأروقة", "مساحة الأروقة", "عدد غرفة الامام", "مساحة غرفة الامام",
        "عدد غرفة المؤذن", "مساحة غرفة المؤذن", "عدد غرفة المؤقت", "مساحة غرفة المؤقت",
        "عدد غرفة الموتى", "مساحة غرفة الموتى"
      ],
      revenue: [
        "عدد محلات تجارية", "مساحة محلات تجارية", "عدد سكن", "مساحة سكن"
      ]
    };

    const sections = {
      general: [] as {key: string, value: any}[],
      land: [] as {key: string, value: any}[],
      construction: [] as {key: string, value: any}[],
      services: [] as {key: string, value: any}[],
      components: [] as {key: string, value: any}[],
      revenue: [] as {key: string, value: any}[],
      other: [] as {key: string, value: any}[]
    };

    const usedKeys = new Set<string>();

    const normalize = (str: string) => {
      // Gentle normalization to avoid destroying data
      return str.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ةه]/g, 'ه')
        .replace(/[يى]/g, 'ي')
        .replace(/[\(\)\[\]\.،:]/g, '') // remove common punctuation from Excel headers
        .trim();
    };

    // Include base properties as part of the data pool
    const dataSource = { 
      // Base mappings that correspond to user properties if they uploaded standard fields
      "اسم المسجد": mosque.name,
      "longitude": mosque.longitude,
      "latitude": mosque.latitude,
      "عنوان المسجد": mosque.address,
      "type": mosque.type,
      ...mosque.extraData
    };

    // Map according to exact user-defined structure
    Object.entries(exactStructure).forEach(([sectionId, keys]) => {
      keys.forEach(k => {
        const normK = normalize(k);
        
        let foundKey = Object.keys(dataSource).find(dataKey => dataKey === k);
        if (!foundKey) {
          foundKey = Object.keys(dataSource).find(dataKey => dataKey.trim() === k.trim());
        }
        if (!foundKey) {
          foundKey = Object.keys(dataSource).find(dataKey => {
            const nData = normalize(dataKey);
            if (nData === normK) return true;
            // Fuzzy match for longer keys (e.g. accounting for units like (م2) or extra words)
            if (normK.length >= 5 && nData.includes(normK)) return true;
            if (nData.length >= 5 && normK.includes(nData)) return true;
            return false;
          });
        }

        if (foundKey && !usedKeys.has(foundKey)) {
          const val = (dataSource as any)[foundKey];
          if (val !== undefined && val !== null && val !== '') {
            sections[sectionId as keyof typeof sections].push({ 
              key: k, // Display using the exact structured key requested by the user
              value: val 
            });
            usedKeys.add(foundKey);
          }
        }
      });
    });

    // Heuristics for any MISSING unmapped keys
    if (mosque.extraData) {
      Object.keys(mosque.extraData).forEach(key => {
        if (!usedKeys.has(key)) {
          const val = mosque.extraData![key];
          if (val !== undefined && val !== null && val !== '') {
            const nData = normalize(key);
            // Auto-categorize based on keywords if they were missed by exact structure
            if (nData.includes('مساحه') || nData.includes('مساحات') || nData.includes('عدد')) {
               if (nData.includes('سكن') || nData.includes('محل') || nData.includes('تجار')) {
                 sections.revenue.push({ key, value: val });
               } else if (nData.includes('ارض') || nData.includes('قطعه') || nData.includes('مبنيه')) {
                 sections.land.push({ key, value: val });
               } else {
                 sections.components.push({ key, value: val });
               }
            } else if (nData.includes('شبكه') || nData.includes('ماء') || nData.includes('كهرباء') || nData.includes('صرف') || nData.includes('طريق')) {
               sections.services.push({ key, value: val });
            } else if (nData.includes('بناء') || nData.includes('تراب') || nData.includes('حجر') || nData.includes('اسمنت') || nData.includes('خرسانه')) {
               sections.construction.push({ key, value: val });
            } else {
               sections.other.push({ key, value: val });
            }
            usedKeys.add(key);
          }
        }
      });
    }

    // Include unmapped base fields into other if desired, but here we just map extraData

    return { sections };
  }, [mosque]);

  const tabs = [
    { id: 'general', label: 'معلومات عامة', icon: Info },
    { id: 'land', label: 'معلومات القطعة الأرضية', icon: Map },
    { id: 'construction', label: 'معلومات البناء', icon: Building2 },
    { id: 'services', label: 'معلومات الخدمات', icon: Zap },
    { id: 'components', label: 'مكونات المسجد', icon: Layout },
    { id: 'revenue', label: 'معلومات الأملاك ذات العائد', icon: DollarSign },
    { id: 'other', label: 'معلومات إضافية', icon: Clipboard }
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
          <div className="grid grid-cols-2 gap-2">
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
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-5 px-5">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const items = categories.sections[tab.id as keyof typeof categories.sections];
              if (!items || items.length === 0) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all flex-shrink-0 font-bold text-sm",
                    isActive 
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800"
                  )}
                >
                  <tab.icon size={16} className={isActive ? "" : "text-gray-400"} />
                  {t(tab.label, language)}
                </button>
              );
            })}
          </div>

          {/* Document Content */}
          <div className="pb-20 pt-4">
            <AnimatePresence mode="wait">
              {tabs.map((tab) => {
                if (tab.id !== activeTab) return null;
                
                const items = categories.sections[tab.id as keyof typeof categories.sections];
                if (!items || items.length === 0) return (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 text-center text-gray-400 dark:text-gray-600 font-medium"
                  >
                    {t('No data available in this category', language)}
                  </motion.div>
                );

                return (
                  <motion.div 
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
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
                                {t(item.key, language)}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                {t(String(item.value), language)}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 transition-all shrink-0">
                              <CheckCircle2 size={14} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
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
