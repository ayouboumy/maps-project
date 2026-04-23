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
    const exactStructure = {
      general: [
        "اسم المسجد", "رمز المسجد", "عنوان المسجد", "الجماعة", "جهة الإنفاق",
        "تاريخ البناء", "تاريخ الافتتاح", "حالة البناية", "طبيعة البناية", "نظام الفتح", "الوضعية العقارية"
      ],
      land: [
        "مساحة القطعة الأرضية", "المساحة المبنية", "غير المبنية: المساحة", "غير المبنية: المساحة المهيأة",
        "غير المبنية: المساحة غير المهيأة", "X", "Y", "الاحداثيات", "Latitude", "Longitude", "طبغرافي",
        "وجود انحدار", "وجود سواقي", "المنطقة الحرارية"
      ],
      construction: [
        "نوع البناء", "خرسانة مسلحة", "خراسانة مسلحة", "تراب أدوبي", "تراب بيزي", "حجر",
        "ياجور تقليدي", "توب خشبي", "توب معدني", "مواد البناء"
      ],
      services: [
        "عدد الولوجيات", "شبكة طرقية", "مسلك للعربات", "مسلك غير صالح للعربات", "ولوجيات ذوي الاحتياجات",
        "شبكة الماء", "بئر", "عيون", "شبكة الكهرباء", "ألواح شمسية", "شبكة التطهير", "حفرة صحية"
      ],
      components: [
        "مساحة المقصورة", "عدد قاعة الصلاة للرجال", "مساحة قاعة الصلاة للرجال", "عدد قاعة الصلاة للنساء",
        "مساحة قاعة الصلاة للنساء", "عدد مراحيض الرجال", "مساحة مراحيض الرجال", "عدد مراحيض للنساء",
        "مساحة مراحيض للنساء", "ارتفاع الصومعة", "عدد طبقات الصومعة", "قاعدة الصومعة", "عدد سكن الامام",
        "مساحة سكن الإمام", "مساحة سكن الامام", "عدد سكن المؤذن", "مساحة سكن المؤذن", "عدد المخزن", "مساحة المخزن",
        "عدد المسيد", "مساحة المسيد", "عدد الكتاب القرآني القرآنية", "مساحة الكتاب القرآني القرآنية",
        "عدد المدرسة", "مساحة المدرسة", "عدد قاعة الاجتماعات", "مساحة قاعة الاجتماعات", "عدد الصحن",
        "مساحة الصحن", "عدد الأروقة", "مساحة الأروقة", "عدد غرفة الامام", "مساحة غرفة الامام",
        "عدد غرفة المؤذن", "مساحة غرفة المؤذن", "عدد غرفة المؤقت", "مساحة غرفة المؤقت",
        "عدد غرفة الموتى", "مساحة غرفة الموتى"
      ],
      revenue: [
        "عدد محلات تجارية", "مساحة محلات تجارية", "عدد سكن", "مساحة سكن", "الأملاك", "محلات", "عائدات"
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

    if (!mosque.extraData) return { sections };

    const usedKeys = new Set<string>();

    // 1. Map exactly according to the provided structure in the exact order
    Object.entries(exactStructure).forEach(([sectionId, keys]) => {
      keys.forEach(k => {
        // Find if this exact key or trimmed key exists in extraData
        const foundKey = Object.keys(mosque.extraData!).find(
          excelKey => excelKey.trim() === k || excelKey.trim().toLowerCase() === k.toLowerCase()
        );

        if (foundKey && !usedKeys.has(foundKey)) {
          sections[sectionId as keyof typeof sections].push({ 
            key: foundKey, 
            value: mosque.extraData![foundKey] 
          });
          usedKeys.add(foundKey);
        }
      });
    });

    // 2. Put any remaining uncategorized attributes into "other"
    Object.keys(mosque.extraData).forEach(key => {
      const val = mosque.extraData![key];
      if (!usedKeys.has(key) && val !== undefined && val !== null && val !== '') {
        sections.other.push({ key, value: val });
      }
    });

    return { sections };
  }, [mosque.extraData]);

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
