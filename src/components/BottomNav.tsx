import { Map as MapIcon, Search, Heart, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t } from '../utils/translations';

export default function BottomNav() {
  const { activeTab, setActiveTab, language } = useAppStore();

  const tabs = [
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-[1000]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-emerald-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon size={24} className={cn(isActive && "fill-emerald-50")} />
              <span className="text-[10px] font-medium">{t(label, language)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
