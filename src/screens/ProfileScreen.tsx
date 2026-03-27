import { motion } from 'motion/react';
import { 
  ArrowLeft, MapPin, Navigation, Heart, CheckCircle2, 
  Clipboard, Check, Share2, Building2, Users, Maximize, 
  Home, Droplets, Info, Activity, Clock, ShieldCheck
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
  const { favorites, toggleFavorite, language, routeProfile, userLocation } = useAppStore();
  const [copied, setCopied] = useState(false);
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

  // Intelligent Data Organization
  const { organizedData, highlights } = useMemo(() => {
    const highlightsList: { label: string; value: string; icon: any; color: string }[] = [];
    if (!mosque.extraData) return { organizedData: [], highlights: [] };

    const categories = [
      {
        id: 'components',
        title: t('Mosque Components', language),
        icon: Building2,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        keys: [], // Special handling for combined data
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'capacity',
        title: t('Capacity & Space', language),
        icon: Maximize,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        keys: ['capacité', 'surface', 'aire', 'm2', 'place', 'nombre de fidèles', 'superficie'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'prayer',
        title: t('Prayer Areas', language),
        icon: Users,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        keys: ['femme', 'homme', 'salle', 'prière', 'étage', 'mezzanine', 'capacité'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'sanitary',
        title: t('Sanitary Facilities', language),
        icon: Droplets,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        keys: ['eau', 'électricité', 'sanitaire', 'latrine', 'toilette', 'abdest', 'puits', 'compteur', 'robinet'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'staff',
        title: t('Staff & Housing', language),
        icon: Home,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        keys: ['logement', 'imam', 'mouadhine', 'mouadine', 'gardien', 'habous', 'fquih'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'status',
        title: t('Status & Environment', language),
        icon: Activity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        keys: ['état', 'construction', 'date', 'terrain', 'titre', 'foncier', 'clôture', 'urbain', 'rural', 'ouvert', 'fermé', 'صومعة'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'other',
        title: t('Other Details', language),
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        keys: [],
        items: [] as { key: string; value: any }[]
      }
    ];

    const categorizedKeys = new Set<string>();

    // Deep Analysis for Highlights and Categorization
    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const valStr = String(value);

      // Extract highlights...
      if ((lowerKey.includes('capacité') || lowerKey.includes('nombre de fidèles')) && !highlightsList.find(h => h.label === 'Capacity')) {
        highlightsList.push({ label: 'Capacity', value: valStr, icon: Users, color: 'emerald' });
      }
      if ((lowerKey.includes('surface') || lowerKey.includes('superficie')) && !highlightsList.find(h => h.label === 'Surface')) {
        highlightsList.push({ label: 'Surface', value: valStr, icon: Maximize, color: 'blue' });
      }
      if (lowerKey.includes('état') && !highlightsList.find(h => h.label === 'Condition')) {
        highlightsList.push({ label: 'Condition', value: valStr, icon: Activity, color: 'amber' });
      }
      if (lowerKey.includes('construction') && !highlightsList.find(h => h.label === 'Built')) {
        highlightsList.push({ label: 'Built', value: valStr, icon: Clock, color: 'purple' });
      }

      // Special handling for combined data (Count, Area, Height)
      const isCombined = valStr.includes(t('Count', language)) || valStr.includes(t('Area', language)) || valStr.includes(t('Height', language));
      
      if (isCombined) {
        categories.find(c => c.id === 'components')?.items.push({ key, value });
        return;
      }

      let found = false;
      for (const cat of categories) {
        if (cat.id === 'components') continue; // Skip components as it's handled above
        if (cat.keys.some(k => lowerKey.includes(k))) {
          cat.items.push({ key, value });
          categorizedKeys.add(key);
          found = true;
          break;
        }
      }
      if (!found) {
        categories.find(c => c.id === 'other')?.items.push({ key, value });
      }
    });

    return { 
      organizedData: categories.filter(cat => cat.items.length > 0),
      highlights: highlightsList 
    };
  }, [mosque.extraData, language]);

  return (
    <motion.div
      initial={{ x: language === 'ar' ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      exit={{ x: language === 'ar' ? '-100%' : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white overflow-y-auto"
    >
      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[350px]">
        <img 
          src={mosque.image} 
          alt={getLocalizedName(mosque, language)} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <button 
          onClick={onClose}
          className={`absolute top-safe-4 ${language === 'ar' ? 'right-4' : 'left-4'} p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/20 z-10`}
        >
          <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="absolute bottom-8 left-6 right-6 text-white z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-4 py-1.5 bg-emerald-500 rounded-full text-[11px] uppercase tracking-widest font-black mb-4 shadow-lg shadow-emerald-900/20"
          >
            <ShieldCheck size={14} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t(mosque.type, language)}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black mb-4 leading-[1.1] tracking-tight drop-shadow-2xl"
          >
            {getLocalizedName(mosque, language)}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start text-white/90 text-base font-bold bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <MapPin size={20} className={cn("shrink-0 mt-0.5", language === 'ar' ? 'ml-3' : 'mr-3')} />
              <span>{t(mosque.address, language)}</span>
            </div>
            
            {mosque.commune && (
              <div className="flex items-center text-white/80 text-sm font-bold px-3">
                <Building2 size={18} className={cn("shrink-0", language === 'ar' ? 'ml-3' : 'mr-3')} />
                <span>{t(mosque.commune, language)}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="p-6 pb-24 max-w-2xl mx-auto -mt-6 relative z-20 bg-white rounded-t-[32px] shadow-2xl shadow-black/5">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-10">
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenGoogleMapsRoute}
            className="flex-1 flex flex-col items-center justify-center py-4 bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200"
          >
            <Navigation size={24} className="mb-1" />
            <span className="text-[10px] uppercase tracking-widest">{t('Google Maps', language)}</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyPosition}
            className="flex-1 flex flex-col items-center justify-center py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all"
          >
            {copied ? <Check size={24} className="mb-1 text-emerald-600" /> : <Clipboard size={24} className="mb-1" />}
            <span className="text-[10px] uppercase tracking-widest">{t(copied ? 'Copied' : 'Position', language)}</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold transition-all"
          >
            <Share2 size={24} className="mb-1" />
            <span className="text-[10px] uppercase tracking-widest">{t('Share', language)}</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "w-16 flex items-center justify-center rounded-2xl transition-all border",
              isFavorite 
                ? "bg-red-50 text-red-500 border-red-100" 
                : "bg-white text-gray-400 border-gray-100"
            )}
          >
            <Heart size={24} className={cn(isFavorite && "fill-current")} />
          </motion.button>
        </div>

        {/* Key Highlights */}
        {highlights.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">{t('Key Highlights', language)}</h3>
              <div className="h-px flex-1 bg-gray-100 mx-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {highlights.map((h, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className={cn("p-2 rounded-xl mb-2", `bg-${h.color}-50 text-${h.color}-600`)}>
                    <h.icon size={18} />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">{t(h.label, language)}</span>
                  <span className="text-sm text-gray-900 font-black truncate w-full">{h.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Location Section - Removed as it's now in the Hero */}
        
        {/* Key Highlights */}
        {/* Intelligent Data Sections */}
        {organizedData.map((cat) => (
          <section key={cat.id} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", cat.bgColor, cat.color)}>
                  <cat.icon size={16} />
                </div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">{cat.title}</h3>
              </div>
              <div className="h-px flex-1 bg-gray-100 mx-4" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.items.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-100 transition-colors group">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2 group-hover:text-emerald-600 transition-colors">{t(item.key, language)}</span>
                  <span className="text-sm text-gray-900 font-black">{t(String(item.value), language)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Services & Facilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">{t('Services', language)}</h3>
              <div className="h-px flex-1 bg-gray-100 mx-4" />
            </div>
            <div className="space-y-2">
              {mosque.services.map(service => (
                <div key={service} className="flex items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                  <CheckCircle2 size={16} className={`text-emerald-500 shrink-0 ${language === 'ar' ? 'ml-2.5' : 'mr-2.5'}`} />
                  <span className="text-sm text-emerald-900 font-bold">{t(service, language)}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">{t('Facilities', language)}</h3>
              <div className="h-px flex-1 bg-gray-100 mx-4" />
            </div>
            <div className="flex flex-wrap gap-2">
              {mosque.items.map(item => (
                <span key={item} className="px-4 py-2 bg-gray-50 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-full border border-gray-100">
                  {t(item, language)}
                </span>
              ))}
              {mosque.items.length === 0 && (
                <span className="text-xs text-gray-400 italic font-medium">{t('No facilities listed', language)}</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
