import { useAppStore } from '../store/useAppStore';
import LeafletMapView from './LeafletMapView';
import MapboxMapView from './MapboxMapView';

interface MapViewProps {
  showNearest?: boolean;
}

export default function MapView({ showNearest }: MapViewProps) {
  const { mapProvider } = useAppStore();

  if (mapProvider === 'mapbox') {
    return <MapboxMapView showNearest={showNearest} />;
  }

  return <LeafletMapView showNearest={showNearest} />;
}
