// エラーハンドリング用ユーティリティ

import type { ApiError, ApiErrorCode } from '../types/api';
import { ERROR_MESSAGES } from './constants';

/**
 * GeolocationPositionErrorをApiErrorに変換
 */
export function handleGeolocationError(error: GeolocationPositionError): ApiError {
  let code: ApiErrorCode;
  let message: string;
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      code = 'LOCATION_ERROR';
      message = ERROR_MESSAGES.GEOLOCATION_DENIED;
      break;
    case error.POSITION_UNAVAILABLE:
      code = 'LOCATION_ERROR';
      message = ERROR_MESSAGES.GEOLOCATION_UNAVAILABLE;
      break;
    case error.TIMEOUT:
      code = 'LOCATION_ERROR';
      message = ERROR_MESSAGES.GEOLOCATION_TIMEOUT;
      break;
    default:
      code = 'UNKNOWN_ERROR';
      message = ERROR_MESSAGES.GEOLOCATION_UNAVAILABLE;
  }
  
  return {
    code,
    message,
    details: {
      originalError: {
        message: error.message,
        code: error.code,
      },
      errorCode: error.code,
    },
  };
}

/**
 * Fetch APIエラーをApiErrorに変換
 */
export function handleFetchError(error: unknown): ApiError {
  if (error instanceof TypeError) {
    // ネットワークエラー
    return {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
      details: { 
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      },
    };
  }
  
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || ERROR_MESSAGES.API_ERROR,
      details: { 
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      },
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: ERROR_MESSAGES.API_ERROR,
    details: { originalError: String(error) },
  };
}

/**
 * HTTP レスポンスエラーをApiErrorに変換
 */
export function handleHttpError(response: Response): ApiError {
  let code: ApiErrorCode;
  let message: string;
  
  switch (response.status) {
    case 400:
      code = 'INVALID_REQUEST';
      message = ERROR_MESSAGES.SEARCH_FAILED;
      break;
    case 401:
    case 403:
      code = 'API_KEY_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
      break;
    case 429:
      code = 'RATE_LIMIT_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      code = 'UNKNOWN_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
      break;
    default:
      code = 'UNKNOWN_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
  }
  
  return {
    code,
    message,
    details: {
      status: response.status,
      statusText: response.statusText,
    },
  };
}

/**
 * Google Places API エラーをApiErrorに変換
 */
export function handlePlacesApiError(status: string): ApiError {
  let code: ApiErrorCode;
  let message: string;
  
  switch (status) {
    case 'ZERO_RESULTS':
      code = 'INVALID_REQUEST';
      message = ERROR_MESSAGES.NO_RESULTS;
      break;
    case 'OVER_QUERY_LIMIT':
      code = 'RATE_LIMIT_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
      break;
    case 'REQUEST_DENIED':
      code = 'API_KEY_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
      break;
    case 'INVALID_REQUEST':
      code = 'INVALID_REQUEST';
      message = ERROR_MESSAGES.SEARCH_FAILED;
      break;
    default:
      code = 'UNKNOWN_ERROR';
      message = ERROR_MESSAGES.API_ERROR;
  }
  
  return {
    code,
    message,
    details: { placesApiStatus: status },
  };
}

/**
 * エラーログ出力
 */
export function logError(error: ApiError, context?: string): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
  
  // 開発環境でのみコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', logData);
  }
  
  // 本番環境では外部ログサービスに送信する処理を追加可能
  // 例: Sentry, LogRocket, etc.
}

/**
 * エラー回復のための提案を生成
 */
export function getErrorRecoveryActions(error: ApiError): string[] {
  const actions: string[] = [];
  
  switch (error.code) {
    case 'LOCATION_ERROR':
      actions.push('位置情報を有効にしてください');
      actions.push('ブラウザの設定を確認してください');
      break;
    case 'NETWORK_ERROR':
      actions.push('インターネット接続を確認してください');
      actions.push('しばらく時間をおいてから再度お試しください');
      break;
    case 'API_KEY_ERROR':
    case 'RATE_LIMIT_ERROR':
      actions.push('しばらく時間をおいてから再度お試しください');
      break;
    case 'INVALID_REQUEST':
      actions.push('検索条件を変更してください');
      actions.push('気分の入力内容を確認してください');
      break;
    default:
      actions.push('ページを再読み込みしてください');
      actions.push('しばらく時間をおいてから再度お試しください');
  }
  
  return actions;
}

/**
 * エラーが一時的なものかどうかを判定
 */
export function isTemporaryError(error: ApiError): boolean {
  const temporaryErrorCodes: ApiErrorCode[] = [
    'NETWORK_ERROR',
    'RATE_LIMIT_ERROR',
    'UNKNOWN_ERROR',
  ];
  
  return temporaryErrorCodes.includes(error.code as ApiErrorCode);
}

/**
 * リトライ可能なエラーかどうかを判定
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableErrorCodes: ApiErrorCode[] = [
    'NETWORK_ERROR',
    'RATE_LIMIT_ERROR',
  ];
  
  return retryableErrorCodes.includes(error.code as ApiErrorCode);
}