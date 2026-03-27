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
        keys: ['état', 'construction', 'date', 'terrain', 'titre', 'foncier', 'clôture', 'urbain', 'rural', 'ouvert', 'fermé'],
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

    // Deep Analysis for Highlights
    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const valStr = String(value).toLowerCase();

      // Extract capacity highlight
      if ((lowerKey.includes('capacité') || lowerKey.includes('nombre de fidèles')) && !highlightsList.find(h => h.label === 'Capacity')) {
        highlightsList.push({ label: 'Capacity', value: String(value), icon: Users, color: 'emerald' });
      }
      // Extract surface highlight
      if ((lowerKey.includes('surface') || lowerKey.includes('superficie')) && !highlightsList.find(h => h.label === 'Surface')) {
        highlightsList.push({ label: 'Surface', value: String(value), icon: Maximize, color: 'blue' });
      }
      // Extract status highlight
      if (lowerKey.includes('état') && !highlightsList.find(h => h.label === 'Condition')) {
        highlightsList.push({ label: 'Condition', value: String(value), icon: Activity, color: 'amber' });
      }
      // Extract construction date highlight
      if (lowerKey.includes('construction') && !highlightsList.find(h => h.label === 'Built')) {
        highlightsList.push({ label: 'Built', value: String(value), icon: Clock, color: 'purple' });
      }

      let found = false;
      for (const cat of categories) {
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
      <div className="relative h-[40vh] min-h-[300px]">
        <img 
          src={mosque.image} 
          alt={getLocalizedName(mosque, language)} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <button 
          onClick={onClose}
          className={`absolute top-safe-4 ${language === 'ar' ? 'right-4' : 'left-4'} p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/20`}
        >
          <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-wider font-bold mb-3"
          >
            <ShieldCheck size={12} className={language === 'ar' ? 'ml-1.5' : 'mr-1.5'} />
            {t(mosque.type, language)}
          </motion.div>
          <h1 className="text-4xl font-black mb-2 leading-tight tracking-tight">
            {getLocalizedName(mosque, language)}
          </h1>
          <div className="flex items-center text-white/70 text-sm font-medium">
            <MapPin size={16} className={language === 'ar' ? 'ml-1.5' : 'mr-1.5'} />
            {t(mosque.address, language)}
          </div>
        </div>
      </div>

      <div className="p-6 pb-24 max-w-2xl mx-auto">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-10">
          <button 
            onClick={handleOpenGoogleMapsRoute}
            className="flex-1 flex flex-col items-center justify-center py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            <Navigation size={24} className="mb-1" />
            <span className="text-[10px] uppercase tracking-widest">{t('Google Maps', language)}</span>
          </button>
          <button 
            onClick={handleCopyPosition}
            className="flex-1 flex flex-col items-center justify-center py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-all active:scale-95"
          >
            {copied ? <Check size={24} className="mb-1 text-emerald-600" /> : <Clipboard size={24} className="mb-1" />}
            <span className="text-[10px] uppercase tracking-widest">{t(copied ? 'Copied' : 'Position', language)}</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
          >
            <Share2 size={24} className="mb-1" />
            <span className="text-[10px] uppercase tracking-widest">{t('Share', language)}</span>
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "w-16 flex items-center justify-center rounded-2xl transition-all active:scale-95 border",
              isFavorite 
                ? "bg-red-50 text-red-500 border-red-100" 
                : "bg-white text-gray-400 border-gray-100"
            )}
          >
            <Heart size={24} className={cn(isFavorite && "fill-current")} />
          </button>
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

        {/* Location Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">{t('Location Details', language)}</h3>
            <div className="h-px flex-1 bg-gray-100 mx-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <MapPin size={20} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">{t('Address', language)}</span>
                <span className="text-sm text-gray-900 font-bold leading-relaxed">{t(mosque.address, language)}</span>
              </div>
            </div>
            {mosque.commune && (
              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Building2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">{t('Commune', language)}</span>
                  <span className="text-sm text-gray-900 font-bold">{t(mosque.commune, language)}</span>
                </div>
              </div>
            )}
          </div>
        </section>

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
