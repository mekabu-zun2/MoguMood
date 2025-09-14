// 検索関連の型定義
import type { RestaurantResult } from './restaurant';

export type SearchMode = 'radius' | 'station';

export interface SearchState {
  mode: SearchMode;
  mood: string;
  radius: number;
  stationCount: number;
  location: GeolocationCoordinates | null;
  results: RestaurantResult[];
  loading: boolean;
  error: string | null;
}

export interface SearchParams {
  mood: string;
  mode: SearchMode;
  location: {
    lat: number;
    lng: number;
  };
  radius?: number;
  stationCount?: number;
}

export interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
}