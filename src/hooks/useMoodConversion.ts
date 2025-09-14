// 気分変換カスタムフック

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MoodConversionResponse, ApiResponse, ApiError } from '../types';
import { debounce, logError } from '../utils';
import { UI } from '../utils/constants';

interface UseMoodConversionState {
  result: MoodConversionResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseMoodConversionOptions {
  debounceDelay?: number;
  enableCache?: boolean;
  autoConvert?: boolean;
}

interface UseMoodConversionReturn extends UseMoodConversionState {
  convertMood: (mood: string) => Promise<MoodConversionResponse | null>;
  clearResult: () => void;
  clearError: () => void;
  retry: () => void;
  getCachedResult: (mood: string) => MoodConversionResponse | null;
}

/**
 * 気分変換カスタムフック
 */
export function useMoodConversion(options: UseMoodConversionOptions = {}): UseMoodConversionReturn {
  const {
    debounceDelay = UI.DEBOUNCE_DELAY,
    enableCache = true,
    autoConvert = false,
  } = options;

  const [state, setState] = useState<UseMoodConversionState>({
    result: null,
    loading: false,
    error: null,
  });

  // キャッシュ（メモリ内）
  const cacheRef = useRef<Map<string, MoodConversionResponse>>(new Map());
  
  // 最後に変換した気分を記録（リトライ用）
  const lastMoodRef = useRef<string>('');

  /**
   * 気分変換API呼び出し
   */
  const convertMoodInternal = useCallback(async (mood: string): Promise<MoodConversionResponse | null> => {
    if (!mood.trim()) {
      setState(prev => ({
        ...prev,
        result: null,
        error: null,
      }));
      return null;
    }

    const trimmedMood = mood.trim();
    lastMoodRef.current = trimmedMood;

    // キャッシュチェック
    if (enableCache) {
      const cached = cacheRef.current.get(trimmedMood);
      if (cached) {
        setState(prev => ({
          ...prev,
          result: cached,
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
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: trimmedMood }),
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      const data: ApiResponse<MoodConversionResponse> = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || '気分変換に失敗しました');
      }

      if (!data.data) {
        throw new Error('変換結果が取得できませんでした');
      }

      const result = data.data;

      // キャッシュに保存
      if (enableCache) {
        cacheRef.current.set(trimmedMood, result);
      }

      setState(prev => ({
        ...prev,
        result,
        loading: false,
        error: null,
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '気分変換に失敗しました';
      
      setState(prev => ({
        ...prev,
        result: null,
        loading: false,
        error: errorMessage,
      }));

      // エラーログ
      const apiError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        details: { mood: trimmedMood, originalError: error },
      };
      logError(apiError, 'useMoodConversion');

      return null;
    }
  }, [enableCache]);

  /**
   * デバウンス付きの気分変換
   */
  const debouncedConvert = useCallback(
    debounce(convertMoodInternal, debounceDelay),
    [convertMoodInternal, debounceDelay]
  );

  /**
   * 気分変換（外部公開用）
   */
  const convertMood = useCallback(async (mood: string): Promise<MoodConversionResponse | null> => {
    if (autoConvert) {
      // 自動変換モードではデバウンス付き
      debouncedConvert(mood);
      return null; // 非同期で結果は状態に設定される
    } else {
      // 手動変換モードでは即座に実行
      return convertMoodInternal(mood);
    }
  }, [autoConvert, debouncedConvert, convertMoodInternal]);

  /**
   * 結果をクリア
   */
  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
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
    if (lastMoodRef.current) {
      convertMoodInternal(lastMoodRef.current);
    }
  }, [convertMoodInternal]);

  /**
   * キャッシュから結果を取得
   */
  const getCachedResult = useCallback((mood: string): MoodConversionResponse | null => {
    return cacheRef.current.get(mood.trim()) || null;
  }, []);

  return {
    ...state,
    convertMood,
    clearResult,
    clearError,
    retry,
    getCachedResult,
  };
}

/**
 * 気分変換の便利関数（一回限りの使用）
 */
export async function convertMoodOnce(mood: string): Promise<MoodConversionResponse> {
  if (!mood.trim()) {
    throw new Error('気分を入力してください');
  }

  const response = await fetch('/api/mood', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mood: mood.trim() }),
  });

  if (!response.ok) {
    const errorData: ApiResponse<null> = await response.json();
    throw new Error(errorData.error || 'サーバーエラーが発生しました');
  }

  const data: ApiResponse<MoodConversionResponse> = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.error || '気分変換に失敗しました');
  }

  if (!data.data) {
    throw new Error('変換結果が取得できませんでした');
  }

  return data.data;
}

/**
 * 気分変換結果の検証
 */
export function validateMoodConversionResult(result: MoodConversionResponse): boolean {
  return (
    result &&
    typeof result.originalMood === 'string' &&
    Array.isArray(result.searchTags) &&
    result.searchTags.length > 0 &&
    typeof result.searchQuery === 'string' &&
    result.searchQuery.length > 0
  );
}

/**
 * 気分変換結果をフォーマット
 */
export function formatMoodConversionResult(result: MoodConversionResponse): string {
  if (!result || !result.searchTags.length) {
    return '';
  }

  return result.searchTags.join('、');
}

/**
 * 気分変換のキャッシュサイズを制限
 */
export function limitMoodConversionCache(cache: Map<string, MoodConversionResponse>, maxSize: number = 50): void {
  if (cache.size > maxSize) {
    const entries = Array.from(cache.entries());
    const toDelete = entries.slice(0, cache.size - maxSize);
    
    for (const [key] of toDelete) {
      cache.delete(key);
    }
  }
}