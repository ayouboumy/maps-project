import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mosque, TabType } from '../types';
import mosquesData from '../data/mosques.json';

export type Language = 'en' | 'ar' | 'fr';
export type RouteProfile = 'foot' | 'driving';
export type MapStyle = 'street' | 'satellite' | 'terrain';

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
  mapStyle: MapStyle;
  isEquipmentOpen: boolean;
  downloadedCommunes: string[];
  knowledgeBase: {
    commonTypes: string[];
    commonServices: string[];
    regionalPatterns: Record<string, string>;
    lastAnalysisCount: number;
  };
  aiInsights: string[];
  isTraining: boolean;
  lastTrainingDate: string | null;
  aiRecommendedIds: string[];
  isAiSearching: boolean;
  optimizedRouteIds: number[] | null;
  
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
  setMapStyle: (style: MapStyle) => void;
  refreshLocation: () => Promise<void>;
  resetApp: () => void;
  updateMosqueItems: (id: number, items: string[]) => void;
  setIsEquipmentOpen: (isOpen: boolean) => void;
  downloadCommune: (commune: string) => void;
  removeDownloadedCommune: (commune: string) => void;
  setKnowledgeBase: (kb: AppState['knowledgeBase']) => void;
  setAiInsights: (insights: string[]) => void;
  setIsTraining: (isTraining: boolean) => void;
  setLastTrainingDate: (date: string) => void;
  setAiRecommendedIds: (ids: string[]) => void;
  setIsAiSearching: (isSearching: boolean) => void;
  setOptimizedRouteIds: (ids: number[] | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mosques: [],
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
      mapStyle: 'street',
      isEquipmentOpen: false,
      downloadedCommunes: [],
      knowledgeBase: {
        commonTypes: [],
        commonServices: [],
        regionalPatterns: {},
        lastAnalysisCount: 0
      },
      aiInsights: [],
      isTraining: false,
      lastTrainingDate: null,
      aiRecommendedIds: [],
      isAiSearching: false,
      optimizedRouteIds: null,

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
      setMapStyle: (style) => set({ mapStyle: style }),
      refreshLocation: () => new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              set({
                userLocation: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }
              });
              resolve();
            },
            (error) => {
              console.error("Error getting location:", error);
              resolve();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          resolve();
        }
      }),
      resetApp: () => {
        set({
          mosques: [],
          favorites: [],
          dynamicTranslations: {},
          selectedCommune: null,
          selectedMosque: null,
          routingToMosque: null,
          routeInfo: null,
        });
      },
      updateMosqueItems: (id, items) => {
        set((state) => {
          const newMosques = state.mosques.map((m) =>
            m.id === id ? { ...m, items } : m
          );
          const newSelectedMosque = state.selectedMosque?.id === id 
            ? { ...state.selectedMosque, items } 
            : state.selectedMosque;
          
          return {
            mosques: newMosques,
            selectedMosque: newSelectedMosque
          };
        });
      },
      setIsEquipmentOpen: (isOpen) => set({ isEquipmentOpen: isOpen }),
      downloadCommune: (commune) => set((state) => ({
        downloadedCommunes: state.downloadedCommunes.includes(commune) 
          ? state.downloadedCommunes 
          : [...state.downloadedCommunes, commune]
      })),
      removeDownloadedCommune: (commune) => set((state) => ({
        downloadedCommunes: state.downloadedCommunes.filter(c => c !== commune)
      })),
      setKnowledgeBase: (kb) => set({ knowledgeBase: kb }),
      setAiInsights: (insights) => set({ aiInsights: insights }),
      setIsTraining: (isTraining) => set({ isTraining }),
      setLastTrainingDate: (date) => set({ lastTrainingDate: date }),
      setAiRecommendedIds: (ids) => set({ aiRecommendedIds: ids }),
      setIsAiSearching: (isSearching) => set({ isAiSearching: isSearching }),
      setOptimizedRouteIds: (ids) => set({ optimizedRouteIds: ids }),
    }),
    {
      name: 'mosque-finder-storage',
      partialize: (state) => ({ 
        favorites: state.favorites, 
        mosques: state.mosques, 
        language: state.language,
        dynamicTranslations: state.dynamicTranslations,
        selectedCommune: state.selectedCommune,
        mapStyle: state.mapStyle,
        downloadedCommunes: state.downloadedCommunes,
        knowledgeBase: state.knowledgeBase,
        aiInsights: state.aiInsights,
        lastTrainingDate: state.lastTrainingDate
      }),
    }
  )
);
