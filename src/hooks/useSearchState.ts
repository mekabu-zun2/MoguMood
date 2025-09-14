// 検索状態管理カスタムフック

'use client';

import { useState, useCallback, useRef } from 'react';
import type { SearchState, SearchMode, RestaurantResult } from '../types';
import { SEARCH_RADIUS, STATION_COUNT } from '../utils/constants';

interface UseSearchStateOptions {
  initialMode?: SearchMode;
  initialRadius?: number;
  initialStationCount?: number;
}

interface UseSearchStateReturn {
  // 状態
  searchState: SearchState;
  
  // 検索パラメータの更新
  setMode: (mode: SearchMode) => void;
  setMood: (mood: string) => void;
  setRadius: (radius: number) => void;
  setStationCount: (count: number) => void;
  setLocation: (location: GeolocationCoordinates | null) => void;
  
  // 検索実行
  executeSearch: () => Promise<void>;
  
  // 結果管理
  setResults: (results: RestaurantResult[]) => void;
  addResults: (results: RestaurantResult[]) => void;
  clearResults: () => void;
  
  // 状態管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // リセット
  resetSearch: () => void;
  
  // キャッシュ管理
  getCachedResults: (key: string) => RestaurantResult[] | null;
  setCachedResults: (key: string, results: RestaurantResult[]) => void;
  clearCache: () => void;
}

/**
 * 検索状態管理カスタムフック
 */
export function useSearchState(options: UseSearchStateOptions = {}): UseSearchStateReturn {
  const {
    initialMode = 'radius',
    initialRadius = SEARCH_RADIUS.DEFAULT,
    initialStationCount = STATION_COUNT.DEFAULT,
  } = options;

  // 検索状態
  const [searchState, setSearchState] = useState<SearchState>({
    mode: initialMode,
    mood: '',
    radius: initialRadius,
    stationCount: initialStationCount,
    location: null,
    results: [],
    loading: false,
    error: null,
  });

  // キャッシュ（メモリ内）
  const cacheRef = useRef<Map<string, RestaurantResult[]>>(new Map());

  /**
   * 検索モードを設定
   */
  const setMode = useCallback((mode: SearchMode) => {
    setSearchState(prev => ({
      ...prev,
      mode,
      error: null, // モード変更時はエラーをクリア
    }));
  }, []);

  /**
   * 気分を設定
   */
  const setMood = useCallback((mood: string) => {
    setSearchState(prev => ({
      ...prev,
      mood,
      error: null,
    }));
  }, []);

  /**
   * 半径を設定
   */
  const setRadius = useCallback((radius: number) => {
    setSearchState(prev => ({
      ...prev,
      radius: Math.max(SEARCH_RADIUS.MIN, Math.min(SEARCH_RADIUS.MAX, radius)),
      error: null,
    }));
  }, []);

  /**
   * 駅数を設定
   */
  const setStationCount = useCallback((count: number) => {
    setSearchState(prev => ({
      ...prev,
      stationCount: Math.max(STATION_COUNT.MIN, Math.min(STATION_COUNT.MAX, count)),
      error: null,
    }));
  }, []);

  /**
   * 位置情報を設定
   */
  const setLocation = useCallback((location: GeolocationCoordinates | null) => {
    setSearchState(prev => ({
      ...prev,
      location,
      error: null,
    }));
  }, []);

  /**
   * 検索実行
   */
  const executeSearch = useCallback(async () => {
    // 検索前の検証
    if (!searchState.mood.trim()) {
      setSearchState(prev => ({
        ...prev,
        error: '気分を入力してください',
      }));
      return;
    }

    if (!searchState.location) {
      setSearchState(prev => ({
        ...prev,
        error: '位置情報を取得してください',
      }));
      return;
    }

    // キャッシュキーを生成
    const cacheKey = generateCacheKey(searchState);
    const cachedResults = cacheRef.current.get(cacheKey);

    if (cachedResults) {
      // キャッシュがある場合はそれを使用
      setSearchState(prev => ({
        ...prev,
        results: cachedResults,
        loading: false,
        error: null,
      }));
      return;
    }

    // 検索実行（実際のAPI呼び出しは外部で行う）
    setSearchState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
  }, [searchState]);

  /**
   * 検索結果を設定
   */
  const setResults = useCallback((results: RestaurantResult[]) => {
    setSearchState(prev => ({
      ...prev,
      results,
      loading: false,
      error: null,
    }));

    // キャッシュに保存
    const cacheKey = generateCacheKey(searchState);
    cacheRef.current.set(cacheKey, results);
  }, [searchState]);

  /**
   * 検索結果を追加（ページネーション用）
   */
  const addResults = useCallback((newResults: RestaurantResult[]) => {
    setSearchState(prev => {
      const updatedResults = [...prev.results, ...newResults];
      
      // 重複除去
      const uniqueResults = updatedResults.filter((result, index, array) => 
        array.findIndex(r => r.placeId === result.placeId) === index
      );

      return {
        ...prev,
        results: uniqueResults,
        loading: false,
        error: null,
      };
    });
  }, []);

  /**
   * 検索結果をクリア
   */
  const clearResults = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      results: [],
      error: null,
    }));
  }, []);

  /**
   * ローディング状態を設定
   */
  const setLoading = useCallback((loading: boolean) => {
    setSearchState(prev => ({
      ...prev,
      loading,
    }));
  }, []);

  /**
   * エラーを設定
   */
  const setError = useCallback((error: string | null) => {
    setSearchState(prev => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * 検索状態をリセット
   */
  const resetSearch = useCallback(() => {
    setSearchState({
      mode: initialMode,
      mood: '',
      radius: initialRadius,
      stationCount: initialStationCount,
      location: null,
      results: [],
      loading: false,
      error: null,
    });
  }, [initialMode, initialRadius, initialStationCount]);

  /**
   * キャッシュから結果を取得
   */
  const getCachedResults = useCallback((key: string): RestaurantResult[] | null => {
    return cacheRef.current.get(key) || null;
  }, []);

  /**
   * キャッシュに結果を保存
   */
  const setCachedResults = useCallback((key: string, results: RestaurantResult[]) => {
    cacheRef.current.set(key, results);
  }, []);

  /**
   * キャッシュをクリア
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    searchState,
    setMode,
    setMood,
    setRadius,
    setStationCount,
    setLocation,
    executeSearch,
    setResults,
    addResults,
    clearResults,
    setLoading,
    setError,
    clearError,
    resetSearch,
    getCachedResults,
    setCachedResults,
    clearCache,
  };
}

/**
 * キャッシュキーを生成
 */
function generateCacheKey(searchState: SearchState): string {
  const { mode, mood, radius, stationCount, location } = searchState;
  
  if (!location) {
    return '';
  }

  const locationKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  const moodKey = mood.trim().toLowerCase();
  
  if (mode === 'radius') {
    return `radius_${locationKey}_${moodKey}_${radius}`;
  } else {
    return `station_${locationKey}_${moodKey}_${stationCount}`;
  }
}

/**
 * 検索パラメータの検証
 */
export function validateSearchParams(searchState: SearchState): string | null {
  if (!searchState.mood.trim()) {
    return '気分を入力してください';
  }

  if (searchState.mood.length > 100) {
    return '気分は100文字以内で入力してください';
  }

  if (!searchState.location) {
    return '位置情報を取得してください';
  }

  if (searchState.mode === 'radius') {
    if (searchState.radius < SEARCH_RADIUS.MIN || searchState.radius > SEARCH_RADIUS.MAX) {
      return `半径は${SEARCH_RADIUS.MIN}m〜${SEARCH_RADIUS.MAX}mの範囲で指定してください`;
    }
  } else if (searchState.mode === 'station') {
    if (searchState.stationCount < STATION_COUNT.MIN || searchState.stationCount > STATION_COUNT.MAX) {
      return `駅数は${STATION_COUNT.MIN}〜${STATION_COUNT.MAX}の範囲で指定してください`;
    }
  }

  return null;
}

/**
 * 検索状態が変更されたかチェック
 */
export function hasSearchStateChanged(
  current: SearchState, 
  previous: SearchState
): boolean {
  return (
    current.mode !== previous.mode ||
    current.mood !== previous.mood ||
    current.radius !== previous.radius ||
    current.stationCount !== previous.stationCount ||
    current.location?.latitude !== previous.location?.latitude ||
    current.location?.longitude !== previous.location?.longitude
  );
}