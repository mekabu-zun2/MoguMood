// 駅検索カスタムフック

'use client';

import { useState, useCallback, useRef } from 'react';
import type { 
  StationInfo, 
  StationSearchResponse, 
  ApiResponse, 
  ApiError 
} from '../types';
import { logError } from '../utils';

interface UseStationSearchState {
  nearestStation: StationInfo | null;
  stationsInRange: StationInfo[];
  loading: boolean;
  error: string | null;
}

interface StationSearchRequest {
  location: { lat: number; lng: number };
  stationCount: number;
}

interface UseStationSearchOptions {
  enableCache?: boolean;
}

interface UseStationSearchReturn extends UseStationSearchState {
  searchStations: (request: StationSearchRequest) => Promise<StationInfo[]>;
  findNearestStation: (location: { lat: number; lng: number }) => Promise<StationInfo | null>;
  clearResults: () => void;
  clearError: () => void;
  retry: () => void;
  getCachedStations: (location: { lat: number; lng: number }) => StationInfo[] | null;
}

/**
 * 駅検索カスタムフック
 */
export function useStationSearch(options: UseStationSearchOptions = {}): UseStationSearchReturn {
  const {
    enableCache = true,
  } = options;

  const [state, setState] = useState<UseStationSearchState>({
    nearestStation: null,
    stationsInRange: [],
    loading: false,
    error: null,
  });

  // キャッシュ（メモリ内）
  const cacheRef = useRef<Map<string, StationInfo[]>>(new Map());
  const nearestStationCacheRef = useRef<Map<string, StationInfo>>(new Map());
  
  // 最後の検索リクエストを記録（リトライ用）
  const lastRequestRef = useRef<StationSearchRequest | null>(null);

  /**
   * 駅検索API呼び出し
   */
  const searchStationsInternal = useCallback(async (
    request: StationSearchRequest
  ): Promise<StationInfo[]> => {
    lastRequestRef.current = request;

    // キャッシュキーを生成
    const cacheKey = generateStationCacheKey(request.location, request.stationCount);
    
    // キャッシュチェック
    if (enableCache) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setState(prev => ({
          ...prev,
          nearestStation: cached[0] || null,
          stationsInRange: cached,
          loading: false,
          error: null,
        }));
        return cached;
      }
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      const data: ApiResponse<StationSearchResponse> = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || '駅検索に失敗しました');
      }

      if (!data.data) {
        throw new Error('駅検索結果が取得できませんでした');
      }

      const searchResponse = data.data;
      const stations = searchResponse.stationsInRange;

      setState(prev => ({
        ...prev,
        nearestStation: searchResponse.nearestStation,
        stationsInRange: stations,
        loading: false,
        error: null,
      }));

      // キャッシュに保存
      if (enableCache) {
        cacheRef.current.set(cacheKey, stations);
        
        // 最寄り駅も個別にキャッシュ
        const nearestCacheKey = generateLocationCacheKey(request.location);
        nearestStationCacheRef.current.set(nearestCacheKey, searchResponse.nearestStation);
      }

      return stations;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '駅検索に失敗しました';
      
      setState(prev => ({
        ...prev,
        nearestStation: null,
        stationsInRange: [],
        loading: false,
        error: errorMessage,
      }));

      // エラーログ
      const apiError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        details: { request, originalError: error },
      };
      logError(apiError, 'useStationSearch');

      return [];
    }
  }, [enableCache]);

  /**
   * 最寄り駅のみを検索
   */
  const findNearestStationInternal = useCallback(async (
    location: { lat: number; lng: number }
  ): Promise<StationInfo | null> => {
    // キャッシュチェック
    if (enableCache) {
      const cacheKey = generateLocationCacheKey(location);
      const cached = nearestStationCacheRef.current.get(cacheKey);
      if (cached) {
        setState(prev => ({
          ...prev,
          nearestStation: cached,
          loading: false,
          error: null,
        }));
        return cached;
      }
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      });

      const response = await fetch(`/api/stations/nearest?${params.toString()}`);

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      const data: ApiResponse<StationInfo> = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || '最寄り駅の検索に失敗しました');
      }

      if (!data.data) {
        throw new Error('最寄り駅が見つかりませんでした');
      }

      const nearestStation = data.data;

      setState(prev => ({
        ...prev,
        nearestStation,
        loading: false,
        error: null,
      }));

      // キャッシュに保存
      if (enableCache) {
        const cacheKey = generateLocationCacheKey(location);
        nearestStationCacheRef.current.set(cacheKey, nearestStation);
      }

      return nearestStation;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '最寄り駅の検索に失敗しました';
      
      setState(prev => ({
        ...prev,
        nearestStation: null,
        loading: false,
        error: errorMessage,
      }));

      // エラーログ
      const apiError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        details: { location, originalError: error },
      };
      logError(apiError, 'useStationSearch.findNearestStation');

      return null;
    }
  }, [enableCache]);

  /**
   * 駅検索（外部公開用）
   */
  const searchStations = useCallback(async (request: StationSearchRequest): Promise<StationInfo[]> => {
    return searchStationsInternal(request);
  }, [searchStationsInternal]);

  /**
   * 最寄り駅検索（外部公開用）
   */
  const findNearestStation = useCallback(async (location: { lat: number; lng: number }): Promise<StationInfo | null> => {
    return findNearestStationInternal(location);
  }, [findNearestStationInternal]);

  /**
   * 結果をクリア
   */
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      nearestStation: null,
      stationsInRange: [],
      error: null,
    }));
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * リトライ
   */
  const retry = useCallback(() => {
    if (lastRequestRef.current) {
      searchStationsInternal(lastRequestRef.current);
    }
  }, [searchStationsInternal]);

  /**
   * キャッシュから駅情報を取得
   */
  const getCachedStations = useCallback((location: { lat: number; lng: number }): StationInfo[] | null => {
    // 最寄り駅のキャッシュをチェック
    const nearestCacheKey = generateLocationCacheKey(location);
    const nearestStation = nearestStationCacheRef.current.get(nearestCacheKey);
    
    if (nearestStation) {
      return [nearestStation];
    }

    return null;
  }, []);

  return {
    ...state,
    searchStations,
    findNearestStation,
    clearResults,
    clearError,
    retry,
    getCachedStations,
  };
}

/**
 * 駅検索用のキャッシュキーを生成
 */
function generateStationCacheKey(location: { lat: number; lng: number }, stationCount: number): string {
  const locationKey = generateLocationCacheKey(location);
  return `stations_${locationKey}_${stationCount}`;
}

/**
 * 位置情報用のキャッシュキーを生成
 */
function generateLocationCacheKey(location: { lat: number; lng: number }): string {
  return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
}

/**
 * 駅検索の便利関数（一回限りの使用）
 */
export async function searchStationsOnce(request: StationSearchRequest): Promise<StationInfo[]> {
  const response = await fetch('/api/stations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData: ApiResponse<null> = await response.json();
    throw new Error(errorData.error || 'サーバーエラーが発生しました');
  }

  const data: ApiResponse<StationSearchResponse> = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.error || '駅検索に失敗しました');
  }

  if (!data.data) {
    throw new Error('駅検索結果が取得できませんでした');
  }

  return data.data.stationsInRange;
}

/**
 * 最寄り駅検索の便利関数（一回限りの使用）
 */
export async function findNearestStationOnce(location: { lat: number; lng: number }): Promise<StationInfo> {
  const params = new URLSearchParams({
    lat: location.lat.toString(),
    lng: location.lng.toString(),
  });

  const response = await fetch(`/api/stations/nearest?${params.toString()}`);

  if (!response.ok) {
    const errorData: ApiResponse<null> = await response.json();
    throw new Error(errorData.error || 'サーバーエラーが発生しました');
  }

  const data: ApiResponse<StationInfo> = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.error || '最寄り駅の検索に失敗しました');
  }

  if (!data.data) {
    throw new Error('最寄り駅が見つかりませんでした');
  }

  return data.data;
}

/**
 * 駅情報を距離でソート
 */
export function sortStationsByDistance(stations: StationInfo[]): StationInfo[] {
  return [...stations].sort((a, b) => a.distance - b.distance);
}

/**
 * 駅情報を名前でソート
 */
export function sortStationsByName(stations: StationInfo[]): StationInfo[] {
  return [...stations].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/**
 * 指定した距離以内の駅をフィルタリング
 */
export function filterStationsByDistance(stations: StationInfo[], maxDistance: number): StationInfo[] {
  return stations.filter(station => station.distance <= maxDistance);
}

/**
 * 駅名で検索
 */
export function searchStationsByName(stations: StationInfo[], query: string): StationInfo[] {
  const lowerQuery = query.toLowerCase();
  return stations.filter(station => 
    station.name.toLowerCase().includes(lowerQuery)
  );
}