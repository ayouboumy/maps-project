import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mosque, TabType } from '../types';
import mosquesData from '../data/mosques.json';

interface AppState {
  mosques: Mosque[];
  favorites: number[];
  activeTab: TabType;
  selectedMosque: Mosque | null;
  userLocation: { latitude: number; longitude: number } | null;
  
  toggleFavorite: (id: number) => void;
  setActiveTab: (tab: TabType) => void;
  setSelectedMosque: (mosque: Mosque | null) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mosques: mosquesData as Mosque[],
      favorites: [],
      activeTab: 'map',
      selectedMosque: null,
      userLocation: null,

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id],
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedMosque: (mosque) => set({ selectedMosque: mosque }),
      setUserLocation: (location) => set({ userLocation: location }),
    }),
    {
      name: 'mosque-finder-storage',
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);
