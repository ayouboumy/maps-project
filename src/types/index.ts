export interface Mosque {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: string;
  services: string[];
  items: string[];
  image: string;
  extraData?: Record<string, any>;
}

export type TabType = 'map' | 'search' | 'favorites' | 'settings';
