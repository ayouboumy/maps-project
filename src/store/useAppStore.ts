import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Mosque, TabType } from '../types';
import mosquesData from '../data/mosques.json';

// Custom storage for IndexedDB using idb-keyval
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export type Language = 'en' | 'ar' | 'fr';
export type RouteProfile = 'foot' | 'driving';

export interface RouteInfo {
  distance: number;
  duration: number;
}

interface AppState {
  mosques: Mosque[];
  favorites: number[];
  activeTab: TabType;
  selectedMosque: Mosque | null;
  routingToMosque: Mosque | null;
  routeInfo: RouteInfo | null;
  routeProfile: RouteProfile;
  userLocation: { latitude: number; longitude: number } | null;
  language: Language;
  dynamicTranslations: Record<string, Record<Language, string>>;
  selectedCommune: string | null;
  
  toggleFavorite: (id: number) => void;
  setActiveTab: (tab: TabType) => void;
  setSelectedMosque: (mosque: Mosque | null) => void;
  setRoutingToMosque: (mosque: Mosque | null) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  setRouteProfile: (profile: RouteProfile) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  importMosques: (newMosques: Mosque[]) => void;
  setLanguage: (lang: Language) => void;
  addDynamicTranslations: (translations: Record<string, Record<Language, string>>) => void;
  setSelectedCommune: (commune: string | null) => void;
  resetApp: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mosques: mosquesData as Mosque[],
      favorites: [],
      activeTab: 'map',
      selectedMosque: null,
      routingToMosque: null,
      routeInfo: null,
      routeProfile: 'foot',
      userLocation: null,
      language: 'fr', // Default to French since data is in French
      dynamicTranslations: {},
      selectedCommune: null,

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id],
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedMosque: (mosque) => set({ selectedMosque: mosque }),
      setRoutingToMosque: (mosque) => set({ routingToMosque: mosque }),
      setRouteInfo: (info) => set({ routeInfo: info }),
      setRouteProfile: (profile) => set({ routeProfile: profile }),
      setUserLocation: (location) => set({ userLocation: location }),
      importMosques: (newMosques) => set({ mosques: newMosques }),
      setLanguage: (lang) => set({ language: lang }),
      addDynamicTranslations: (translations) => set((state) => ({ 
        dynamicTranslations: { ...state.dynamicTranslations, ...translations } 
      })),
      setSelectedCommune: (commune) => set({ selectedCommune: commune }),
      resetApp: async () => {
        localStorage.clear();
        await del('mosque-finder-storage-v2');
        window.location.reload();
      }
    }),
    {
      name: 'mosque-finder-storage-v2',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ 
        favorites: state.favorites, 
        mosques: state.mosques, 
        language: state.language,
        dynamicTranslations: state.dynamicTranslations,
        selectedCommune: state.selectedCommune,
        userLocation: state.userLocation
      }),
    }
  )
);
