import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Navigation, Heart, CheckCircle2, Map, Route, Clipboard, Check, Share2, Building2 } from 'lucide-react';
import { Mosque } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t, getLocalizedName } from '../utils/translations';
import { useState } from 'react';

interface ProfileScreenProps {
  mosque: Mosque;
  onClose: () => void;
}

export default function ProfileScreen({ mosque, onClose }: ProfileScreenProps) {
  const { favorites, toggleFavorite, language, setRoutingToMosque, setSelectedMosque, routeProfile, userLocation } = useAppStore();
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

  return (
    <motion.div
      initial={{ x: language === 'ar' ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      exit={{ x: language === 'ar' ? '-100%' : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white overflow-y-auto"
    >
      <div className="relative h-72">
        <img 
          src={mosque.image} 
          alt={getLocalizedName(mosque, language)} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <button 
          onClick={onClose}
          className={`absolute top-safe-4 ${language === 'ar' ? 'right-4' : 'left-4'} p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors`}
        >
          <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="inline-block px-3 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-full text-xs font-medium mb-2">
            {t(mosque.type, language)}
          </div>
          <h1 className="text-3xl font-bold mb-1">{mosque.name}</h1>
          <div className="flex items-center text-white/80 text-sm">
            <MapPin size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
            {t(mosque.address, language)}
          </div>
        </div>
      </div>

      <div className="p-5 pb-24 max-w-md mx-auto">
        <div className="flex gap-3 mb-8">
          <button 
            onClick={handleOpenGoogleMapsRoute}
            className="flex-1 flex items-center justify-center py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Navigation size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t('Google Maps', language)}
          </button>
          <button 
            onClick={handleCopyPosition}
            className="flex-1 flex items-center justify-center py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors shadow-sm"
          >
            {copied ? <Check size={20} className={cn("text-emerald-600", language === 'ar' ? 'ml-2' : 'mr-2')} /> : <Clipboard size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />}
            {t(copied ? 'Copied' : 'Position', language)}
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 flex items-center justify-center py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-sm"
          >
            <Share2 size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t('Share', language)}
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "flex items-center justify-center px-4 rounded-xl font-medium transition-colors shadow-sm border",
              isFavorite 
                ? "bg-red-50 text-red-500 border-red-100 hover:bg-red-100" 
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Heart size={20} className={cn(isFavorite && "fill-current")} />
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Location Details', language)}</h3>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <MapPin size={18} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-0.5">{t('Address', language)}</span>
                <span className="text-sm text-gray-900 font-medium leading-relaxed">{t(mosque.address, language)}</span>
              </div>
            </div>
            {mosque.commune && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Building2 size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">{t('Commune', language)}</span>
                  <span className="text-sm text-gray-900 font-medium">{t(mosque.commune, language)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Services', language)}</h3>
          <div className="grid grid-cols-2 gap-3">
            {mosque.services.map(service => (
              <div key={service} className="flex items-center p-3 bg-gray-50 rounded-xl">
                <CheckCircle2 size={18} className={`text-emerald-500 shrink-0 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm text-gray-700 font-medium">{t(service, language)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Facilities', language)}</h3>
          <div className="flex flex-wrap gap-2">
            {mosque.items.map(item => (
              <span key={item} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full shadow-sm">
                {t(item, language)}
              </span>
            ))}
            {mosque.items.length === 0 && (
              <span className="text-sm text-gray-500 italic">{t('No facilities listed', language)}</span>
            )}
          </div>
        </div>

        {mosque.extraData && Object.keys(mosque.extraData).length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Additional Information', language)}</h3>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {Object.entries(mosque.extraData).map(([key, value], index) => (
                <div key={key} className={cn("p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1", index !== 0 && "border-t border-gray-50")}>
                  <span className="text-sm font-medium text-gray-500 capitalize">{t(key, language)}</span>
                  <span className="text-sm text-gray-900 font-medium sm:text-right">{t(String(value), language)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
