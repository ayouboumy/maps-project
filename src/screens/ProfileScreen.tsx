import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Navigation, Heart, CheckCircle2 } from 'lucide-react';
import { Mosque } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface ProfileScreenProps {
  mosque: Mosque;
  onClose: () => void;
}

export default function ProfileScreen({ mosque, onClose }: ProfileScreenProps) {
  const { favorites, toggleFavorite } = useAppStore();
  const isFavorite = favorites.includes(mosque.id);

  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`, '_blank');
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white overflow-y-auto"
    >
      <div className="relative h-72">
        <img 
          src={mosque.image} 
          alt={mosque.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <button 
          onClick={onClose}
          className="absolute top-safe-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="inline-block px-3 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-full text-xs font-medium mb-2">
            {mosque.type}
          </div>
          <h1 className="text-3xl font-bold mb-1">{mosque.name}</h1>
          <div className="flex items-center text-white/80 text-sm">
            <MapPin size={16} className="mr-1" />
            {mosque.address}
          </div>
        </div>
      </div>

      <div className="p-5 pb-24 max-w-md mx-auto">
        <div className="flex gap-3 mb-8">
          <button 
            onClick={handleOpenMaps}
            className="flex-1 flex items-center justify-center py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Navigation size={20} className="mr-2" />
            Open in Maps
          </button>
          <button 
            onClick={() => toggleFavorite(mosque.id)}
            className={cn(
              "flex items-center justify-center px-6 rounded-xl font-medium transition-colors shadow-sm border",
              isFavorite 
                ? "bg-red-50 text-red-500 border-red-100 hover:bg-red-100" 
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Heart size={20} className={cn(isFavorite && "fill-current")} />
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Services</h3>
          <div className="grid grid-cols-2 gap-3">
            {mosque.services.map(service => (
              <div key={service} className="flex items-center p-3 bg-gray-50 rounded-xl">
                <CheckCircle2 size={18} className="text-emerald-500 mr-2 shrink-0" />
                <span className="text-sm text-gray-700 font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Facilities</h3>
          <div className="flex flex-wrap gap-2">
            {mosque.items.map(item => (
              <span key={item} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full shadow-sm">
                {item}
              </span>
            ))}
            {mosque.items.length === 0 && (
              <span className="text-sm text-gray-500 italic">No facilities listed</span>
            )}
          </div>
        </div>

        {mosque.extraData && Object.keys(mosque.extraData).length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {Object.entries(mosque.extraData).map(([key, value], index) => (
                <div key={key} className={cn("p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1", index !== 0 && "border-t border-gray-50")}>
                  <span className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-gray-900 font-medium sm:text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
