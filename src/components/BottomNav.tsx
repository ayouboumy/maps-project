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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-[1000] transition-colors duration-300">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <Icon size={24} className={cn(isActive && "fill-emerald-50 dark:fill-emerald-900/40")} />
              <span className="text-[10px] font-medium">{t(label, language)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
