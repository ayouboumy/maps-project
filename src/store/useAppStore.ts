import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mosque, TabType } from '../types';
import mosquesData from '../data/mosques.json';

export type Language = 'en' | 'ar' | 'fr';

interface AppState {
  mosques: Mosque[];
  favorites: number[];
  activeTab: TabType;
  selectedMosque: Mosque | null;
  userLocation: { latitude: number; longitude: number } | null;
  language: Language;
  dynamicTranslations: Record<string, Record<Language, string>>;
  
  toggleFavorite: (id: number) => void;
  setActiveTab: (tab: TabType) => void;
  setSelectedMosque: (mosque: Mosque | null) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  importMosques: (newMosques: Mosque[]) => void;
  setLanguage: (lang: Language) => void;
  addDynamicTranslations: (translations: Record<string, Record<Language, string>>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mosques: mosquesData as Mosque[],
      favorites: [],
      activeTab: 'map',
      selectedMosque: null,
      userLocation: null,
      language: 'fr', // Default to French since data is in French
      dynamicTranslations: {},

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id],
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedMosque: (mosque) => set({ selectedMosque: mosque }),
      setUserLocation: (location) => set({ userLocation: location }),
      importMosques: (newMosques) => set({ mosques: newMosques }),
      setLanguage: (lang) => set({ language: lang }),
      addDynamicTranslations: (translations) => set((state) => ({ 
        dynamicTranslations: { ...state.dynamicTranslations, ...translations } 
      })),
    }),
    {
      name: 'mosque-finder-storage',
      partialize: (state) => ({ 
        favorites: state.favorites, 
        mosques: state.mosques, 
        language: state.language,
        dynamicTranslations: state.dynamicTranslations
      }),
    }
  )
);
