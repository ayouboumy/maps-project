import { useAppStore } from '../store/useAppStore';
import LeafletMapView from './LeafletMapView';
import MapboxMapView from './MapboxMapView';

interface MapViewProps {
  showNearest?: boolean;
}

export default function MapView({ showNearest }: MapViewProps) {
  const { mapProvider, manualMapboxToken } = useAppStore();
  const envToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || (typeof process !== 'undefined' ? process.env.VITE_MAPBOX_ACCESS_TOKEN : '') || '').trim();
  const activeToken = manualMapboxToken || envToken;

  if (mapProvider === 'mapbox') {
    return <MapboxMapView key={activeToken || 'default'} showNearest={showNearest} />;
  }

  return <LeafletMapView showNearest={showNearest} />;
}
