import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useAppStore } from './store/useAppStore';
import BottomNav from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import SearchScreen from './screens/SearchScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react';
import MapView from './components/MapView';
import { t } from './utils/translations';
import DirectionsPanel from './components/DirectionsPanel';

interface ErrorBoundaryProps {
  children: ReactNode;
  language: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-xs w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RefreshCw size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              The application encountered an unexpected error. Please try resetting it.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all"
            >
              Reset & Reload App
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  const { activeTab, setUserLocation, language, routingToMosque, setSelectedMosque, setRoutingToMosque } = useAppStore();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showNearest, setShowNearest] = useState(false);

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    setSelectedMosque(null);
    setRoutingToMosque(null);
    
    if (!('geolocation' in navigator)) {
      setLocationError(t("Geolocation is not supported by your browser.", language));
      setIsLocating(false);
      return;
    }

    // Use a timeout for the geolocation request
    const timeoutId = setTimeout(() => {
      if (isLocating) {
        setIsLocating(false);
        setLocationError(t("Location request timed out. Please check your GPS settings.", language));
      }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude, accuracy } = position.coords;
        
        // Basic validation to avoid 0,0 or obviously wrong coordinates
        if (latitude === 0 && longitude === 0) {
          setLocationError(t("Invalid location received. Please try again.", language));
          setIsLocating(false);
          return;
        }

        console.log(`Location received: ${latitude}, ${longitude} (Accuracy: ${accuracy}m)`);
        
        setUserLocation({
          latitude,
          longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Error getting location:", error);
        let message = t("Location access denied or unavailable.", language);
        if (error.code === error.PERMISSION_DENIED) {
          message = t("Location permission denied. Please enable it in your settings.", language);
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = t("Location information is unavailable.", language);
        } else if (error.code === error.TIMEOUT) {
          message = t("Location request timed out.", language);
        }
        setLocationError(message);
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 12000, 
        maximumAge: 0 
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <ErrorBoundary language={language}>
      <div 
        className="fixed inset-0 bg-gray-100 overflow-hidden font-sans text-gray-900 flex justify-center"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
      {/* Mobile container constraint for desktop viewing */}
      <div className="w-full max-w-md h-[100dvh] bg-white relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'map' && (
            <>
              <MapView showNearest={showNearest} />
              
              {/* Floating Location Button */}
              {!routingToMosque && (
                <div className={`absolute top-safe-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-[1000] flex flex-col gap-3`}>
                  <button 
                    onClick={requestLocation}
                    className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:text-blue-600 transition-colors"
                    title={t("My Location", language)}
                  >
                    <LocateFixed size={24} className={isLocating ? "animate-pulse text-blue-500" : ""} />
                  </button>
                  <button 
                    onClick={() => setShowNearest(!showNearest)}
                    className={`p-3 rounded-full shadow-md transition-colors ${showNearest ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:text-blue-600'}`}
                    title={t("Nearest Mosques", language)}
                  >
                    <MapPin size={24} />
                  </button>
                </div>
              )}

              {locationError && (
                <div className="absolute top-safe-20 left-4 right-4 z-[1000] p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl shadow-sm">
                  {locationError}
                </div>
              )}

              <BottomSheet />
              <DirectionsPanel />
            </>
          )}

          {activeTab === 'search' && <SearchScreen />}
          
          {activeTab === 'favorites' && <FavoritesScreen />}

          {activeTab === 'settings' && <SettingsScreen />}
        </div>

        {!routingToMosque && <BottomNav />}
      </div>
    </div>
    </ErrorBoundary>
  );
}
