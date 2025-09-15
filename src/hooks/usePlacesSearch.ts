// 飲食店検索カスタムフック

'use client';

import { useState, useCallback, useRef } from 'react';
import type { 
  RestaurantResult, 
  PlacesSearchResponse, 
  ApiResponse, 
  ApiError,
  SearchMode 
} from '../types';
import { logError } from '../utils';

interface UsePlacesSearchState {
  results: RestaurantResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextPageToken?: string;
}

interface SearchRequest {
  mode: SearchMode;
  location: { lat: number; lng: number };
  query: string;
  radius?: number;
  stationCount?: number;
}

interface UsePlacesSearchOptions {
  enableCache?: boolean;
  maxResults?: number;
}

interface UsePlacesSearchReturn extends UsePlacesSearchState {
  searchRestaurants: (request: SearchRequest) => Promise<RestaurantResult[]>;
  loadMore: () => Promise<RestaurantResult[]>;
  clearResults: () => void;
  clearError: () => void;
  retry: () => void;
  sortResults: (sortBy: 'distance' | 'rating' | 'name') => void;
  filterResults: (filter: (result: RestaurantResult) => boolean) => void;
}

/**
 * 飲食店検索カスタムフック
 */
export function usePlacesSearch(options: UsePlacesSearchOptions = {}): UsePlacesSearchReturn {
  const {
    enableCache = true,
    maxResults = 50,
  } = options;

  const [state, setState] = useState<UsePlacesSearchState>({
    results: [],
    loading: false,
    error: null,
    hasMore: false,
  });

  // キャッシュ（メモリ内）
  const cacheRef = useRef<Map<string, RestaurantResult[]>>(new Map());
  
  // 最後の検索リクエストを記録（リトライ・ページネーション用）
  const lastRequestRef = useRef<SearchRequest | null>(null);

  /**
   * 飲食店検索API呼び出し
   */
  const searchRestaurantsInternal = useCallback(async (
    request: SearchRequest,
    pageToken?: string
  ): Promise<RestaurantResult[]> => {
    lastRequestRef.current = request;

    // キャッシュキーを生成
    const cacheKey = generateCacheKey(request);
    
    // 新規検索でキャッシュがある場合
    if (!pageToken && enableCache) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setState(prev => ({
          ...prev,
          results: cached,
          loading: false,
          error: null,
          hasMore: false, // キャッシュされた結果には追加ページなし
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
      const requestBody = {
        ...request,
        pageToken,
      };

      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      const data: ApiResponse<PlacesSearchResponse> = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || '検索に失敗しました');
      }

      if (!data.data) {
        throw new Error('検索結果が取得できませんでした');
      }

      const searchResponse = data.data;
      const newResults = searchResponse.results;

      setState(prev => {
        const updatedResults = pageToken 
          ? [...prev.results, ...newResults] // ページネーション
          : newResults; // 新規検索

        // 重複除去
        const uniqueResults = removeDuplicateResults(updatedResults);
        
        // 最大件数制限
        const limitedResults = uniqueResults.slice(0, maxResults);

        return {
          ...prev,
          results: limitedResults,
          loading: false,
          error: null,
          hasMore: !!searchResponse.nextPageToken && limitedResults.length < maxResults,
          nextPageToken: searchResponse.nextPageToken,
        };
      });

      // 新規検索の場合はキャッシュに保存
      if (!pageToken && enableCache) {
        cacheRef.current.set(cacheKey, newResults);
      }

      return newResults;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '検索に失敗しました';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        hasMore: false,
      }));

      // エラーログ
      const apiError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        details: { request, originalError: error },
      };
      logError(apiError, 'usePlacesSearch');

      return [];
    }
  }, [enableCache, maxResults]);

  /**
   * 飲食店検索（外部公開用）
   */
  const searchRestaurants = useCallback(async (request: SearchRequest): Promise<RestaurantResult[]> => {
    return searchRestaurantsInternal(request);
  }, [searchRestaurantsInternal]);

  /**
   * 追加結果を読み込み（ページネーション）
   */
  const loadMore = useCallback(async (): Promise<RestaurantResult[]> => {
    if (!state.hasMore || !state.nextPageToken || !lastRequestRef.current) {
      return [];
    }

    return searchRestaurantsInternal(lastRequestRef.current, state.nextPageToken);
  }, [state.hasMore, state.nextPageToken, searchRestaurantsInternal]);

  /**
   * 結果をクリア
   */
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      error: null,
      hasMore: false,
      nextPageToken: undefined,
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
      searchRestaurantsInternal(lastRequestRef.current);
    }
  }, [searchRestaurantsInternal]);

  /**
   * 結果をソート
   */
  const sortResults = useCallback((sortBy: 'distance' | 'rating' | 'name') => {
    setState(prev => ({
      ...prev,
      results: [...prev.results].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || 0) - (b.distance || 0);
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'name':
            return a.name.localeCompare(b.name, 'ja');
          default:
            return 0;
        }
      }),
    }));
  }, []);

  /**
   * 結果をフィルタリング
   */
  const filterResults = useCallback((filter: (result: RestaurantResult) => boolean) => {
    setState(prev => ({
      ...prev,
      results: prev.results.filter(filter),
    }));
  }, []);

  return {
    ...state,
    searchRestaurants,
    loadMore,
    clearResults,
    clearError,
    retry,
    sortResults,
    filterResults,
  };
}

/**
 * キャッシュキーを生成
 */
function generateCacheKey(request: SearchRequest): string {
  const { mode, location, query, radius, stationCount } = request;
  const locationKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
  const queryKey = query.toLowerCase().trim();
  
  if (mode === 'radius') {
    return `radius_${locationKey}_${queryKey}_${radius || 1000}`;
  } else {
    return `station_${locationKey}_${queryKey}_${stationCount || 2}`;
  }
}

/**
 * 重複する結果を除去
 */
function removeDuplicateResults(results: RestaurantResult[]): RestaurantResult[] {
  const seen = new Set<string>();
  const unique: RestaurantResult[] = [];

  for (const result of results) {
    if (!seen.has(result.placeId)) {
      seen.add(result.placeId);
      unique.push(result);
    }
  }

  return unique;
}

/**
 * 飲食店検索の便利関数（一回限りの使用）
 */
export async function searchRestaurantsOnce(request: SearchRequest): Promise<RestaurantResult[]> {
  const response = await fetch('/api/places', {
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

  const data: ApiResponse<PlacesSearchResponse> = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.error || '検索に失敗しました');
  }

  if (!data.data) {
    throw new Error('検索結果が取得できませんでした');
  }

  return data.data.results;
}

/**
 * 検索結果の統計情報を取得
 */
export function getSearchResultStats(results: RestaurantResult[]): {
  total: number;
  averageRating: number;
  averageDistance: number;
  priceDistribution: Record<number, number>;
} {
  if (results.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      averageDistance: 0,
      priceDistribution: {},
    };
  }

  const totalRating = results.reduce((sum, r) => sum + (r.rating || 0), 0);
  const totalDistance = results.reduce((sum, r) => sum + (r.distance || 0), 0);
  
  const priceDistribution: Record<number, number> = {};
  results.forEach(r => {
    const price = r.priceLevel || 0;
    priceDistribution[price] = (priceDistribution[price] || 0) + 1;
  });

  return {
    total: results.length,
    averageRating: totalRating / results.length,
    averageDistance: totalDistance / results.length,
    priceDistribution,
  };
}

/**
 * 検索結果を地図表示用のデータに変換
 */
export function convertResultsForMap(results: RestaurantResult[]): Array<{
  id: string;
  name: string;
  position: { lat: number; lng: number };
  rating: number;
  priceLevel: number;
}> {
  return results.map(result => ({
    id: result.placeId,
    name: result.name,
    position: {
      lat: 0, // 実際の実装では result.geometry.location から取得
      lng: 0,
    },
    rating: result.rating,
    priceLevel: result.priceLevel,
  }));
}