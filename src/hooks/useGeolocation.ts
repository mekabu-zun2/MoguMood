// 位置情報取得カスタムフック

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GeolocationState, ApiError } from '../types';
import { handleGeolocationError, logError } from '../utils';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  autoStart?: boolean;
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentPosition: () => Promise<GeolocationCoordinates>;
  startWatching: () => void;
  stopWatching: () => void;
  clearError: () => void;
  retry: () => void;
}

/**
 * 位置情報取得カスタムフック
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5分
    watch = false,
    autoStart = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: false,
    error: null,
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  /**
   * 位置情報取得のオプション
   */
  const geolocationOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  /**
   * 成功時のコールバック
   */
  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      coordinates: position.coords,
      loading: false,
      error: null,
    }));
  }, []);

  /**
   * エラー時のコールバック
   */
  const onError = useCallback((error: GeolocationPositionError) => {
    const apiError = handleGeolocationError(error);
    
    setState(prev => ({
      ...prev,
      coordinates: null,
      loading: false,
      error: apiError.message,
    }));

    logError(apiError, 'useGeolocation');
  }, []);

  /**
   * 現在位置を一度だけ取得
   */
  const getCurrentPosition = useCallback((): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!state.supported) {
        const error: ApiError = {
          code: 'LOCATION_ERROR',
          message: 'お使いのブラウザは位置情報に対応していません',
        };
        reject(error);
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSuccess(position);
          resolve(position.coords);
        },
        (error) => {
          onError(error);
          reject(handleGeolocationError(error));
        },
        geolocationOptions
      );
    });
  }, [state.supported, onSuccess, onError, geolocationOptions]);

  /**
   * 位置情報の監視を開始
   */
  const startWatching = useCallback(() => {
    if (!state.supported) {
      setState(prev => ({
        ...prev,
        error: 'お使いのブラウザは位置情報に対応していません',
      }));
      return;
    }

    if (watchId !== null) {
      return; // 既に監視中
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const id = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      geolocationOptions
    );

    setWatchId(id);
  }, [state.supported, watchId, onSuccess, onError, geolocationOptions]);

  /**
   * 位置情報の監視を停止
   */
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [watchId]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * リトライ
   */
  const retry = useCallback(() => {
    if (watch) {
      startWatching();
    } else {
      getCurrentPosition().catch(() => {
        // エラーは既にonErrorで処理済み
      });
    }
  }, [watch, startWatching, getCurrentPosition]);

  /**
   * 自動開始
   */
  useEffect(() => {
    if (autoStart && state.supported) {
      if (watch) {
        startWatching();
      } else {
        getCurrentPosition().catch(() => {
          // エラーは既にonErrorで処理済み
        });
      }
    }

    // クリーンアップ
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [autoStart, watch, state.supported]); // getCurrentPosition, startWatchingは依存関係から除外

  /**
   * コンポーネントアンマウント時のクリーンアップ
   */
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearError,
    retry,
  };
}

/**
 * 位置情報取得の便利関数
 */
export async function getLocationOnce(options?: UseGeolocationOptions): Promise<GeolocationCoordinates> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    throw {
      code: 'LOCATION_ERROR',
      message: 'お使いのブラウザは位置情報に対応していません',
    } as ApiError;
  }

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000,
  } = options || {};

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(handleGeolocationError(error)),
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}

/**
 * 位置情報がサポートされているかチェック
 */
export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * 位置情報の権限状態を取得
 */
export async function getGeolocationPermission(): Promise<PermissionState | null> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
    return null;
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.warn('Permission API not supported:', error);
    return null;
  }
}