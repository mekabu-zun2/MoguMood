// ヘルパー関数

import { GOOGLE_MAPS, ERROR_MESSAGES } from './constants';
import type { ApiErrorCode, RestaurantResult } from '../types';

/**
 * Google Maps URLを生成する
 */
export function generateGoogleMapsUrl(restaurant: RestaurantResult): string {
  const { name, placeId } = restaurant;
  const baseUrl = GOOGLE_MAPS.BASE_URL;
  const params = new URLSearchParams({
    [GOOGLE_MAPS.QUERY_PARAMS.API.split('=')[0]]: '1',
    [GOOGLE_MAPS.QUERY_PARAMS.QUERY]: name,
    [GOOGLE_MAPS.QUERY_PARAMS.QUERY_PLACE_ID]: placeId,
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 2点間の距離を計算する（ハーバーサイン公式）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 地球の半径 (km)
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // メートルに変換
  
  return Math.round(distance);
}

/**
 * 度をラジアンに変換
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 距離を人間が読みやすい形式にフォーマット
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 評価を星の形式でフォーマット
 */
export function formatRating(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

/**
 * 価格レベルを円マークでフォーマット
 */
export function formatPriceLevel(priceLevel: number): string {
  if (priceLevel === 0) return '価格情報なし';
  return '¥'.repeat(priceLevel);
}

/**
 * エラーコードに対応するメッセージを取得
 */
export function getErrorMessage(errorCode: ApiErrorCode): string {
  switch (errorCode) {
    case 'NETWORK_ERROR':
      return ERROR_MESSAGES.NETWORK_ERROR;
    case 'API_KEY_ERROR':
    case 'RATE_LIMIT_ERROR':
    case 'UNKNOWN_ERROR':
      return ERROR_MESSAGES.API_ERROR;
    case 'INVALID_REQUEST':
      return ERROR_MESSAGES.SEARCH_FAILED;
    case 'LOCATION_ERROR':
      return ERROR_MESSAGES.INVALID_LOCATION;
    default:
      return ERROR_MESSAGES.API_ERROR;
  }
}

/**
 * デバウンス関数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * リトライ機能付きの非同期関数実行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxAttempts} failed:`, error);
      
      // エラーオブジェクトを適切に処理
      if (error instanceof Error) {
        lastError = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        lastError = new Error(String(error.message));
      } else {
        lastError = new Error(String(error));
      }
      
      if (attempt === maxAttempts) {
        console.error('All retry attempts failed, throwing last error:', lastError);
        throw lastError;
      }
      
      // 指数バックオフでリトライ間隔を増加
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await sleep(waitTime);
    }
  }
  
  throw lastError!;
}

/**
 * 指定時間待機する
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 配列をランダムにシャッフル
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 気分入力のプレースホルダーをランダムに取得
 */
export function getRandomMoodPlaceholder(): string {
  const placeholders = [
    '疲れた時に食べたい温かいもの',
    'さっぱりしたものが食べたい',
    'がっつり肉料理が食べたい',
    '甘いものでほっとしたい',
    'ヘルシーなものが食べたい',
    '辛いものでスッキリしたい',
  ];
  
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

/**
 * 入力値のバリデーション
 */
export const validation = {
  /**
   * 気分入力のバリデーション
   */
  mood: (mood: string): boolean => {
    return mood.trim().length > 0 && mood.trim().length <= 100;
  },
  
  /**
   * 位置情報のバリデーション
   */
  location: (lat: number, lng: number): boolean => {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  },
  
  /**
   * 半径のバリデーション
   */
  radius: (radius: number): boolean => {
    return radius >= 500 && radius <= 5000;
  },
  
  /**
   * 駅数のバリデーション
   */
  stationCount: (count: number): boolean => {
    return count >= 1 && count <= 5 && Number.isInteger(count);
  },
};