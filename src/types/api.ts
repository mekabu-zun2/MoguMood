// API関連の型定義

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

export interface MoodConversionRequest {
  mood: string;
}

export interface MoodConversionResponse {
  originalMood: string;
  searchTags: string[];
  searchQuery: string;
}

export interface PlacesSearchRequest {
  location: {
    lat: number;
    lng: number;
  };
  radius?: number;
  query: string;
  type?: string;
}

export interface PlacesSearchResponse {
  results: RestaurantResult[];
  status: string;
  nextPageToken?: string;
}

export interface StationSearchRequest {
  location: {
    lat: number;
    lng: number;
  };
  stationCount: number;
}

export interface StationInfo {
  placeId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  distance: number;
}

export interface StationSearchResponse {
  nearestStation: StationInfo;
  stationsInRange: StationInfo[];
  status: string;
}

// エラー関連
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type ApiErrorCode = 
  | 'NETWORK_ERROR'
  | 'API_KEY_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'INVALID_REQUEST'
  | 'LOCATION_ERROR'
  | 'UNKNOWN_ERROR';

import { RestaurantResult } from './restaurant';