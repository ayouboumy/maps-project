import { useAppStore } from '../store/useAppStore';
import LeafletMapView from './LeafletMapView';
import MapboxMapView from './MapboxMapView';

interface MapViewProps {
  showNearest?: boolean;
}

export default function MapView({ showNearest }: MapViewProps) {
  const { mapProvider } = useAppStore();

  if (mapProvider === 'mapbox') {
    return <MapboxMapView key={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'default'} showNearest={showNearest} />;
  }

  return <LeafletMapView showNearest={showNearest} />;
}
