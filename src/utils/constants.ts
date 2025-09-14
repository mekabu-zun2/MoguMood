// 定数定義

// 検索範囲の設定
export const SEARCH_RADIUS = {
  MIN: 500,    // 最小半径 500m
  MAX: 5000,   // 最大半径 5000m
  DEFAULT: 1000, // デフォルト半径 1000m
  STEP: 100,   // スライダーのステップ
} as const;

// 駅数の設定
export const STATION_COUNT = {
  MIN: 1,      // 最小駅数
  MAX: 5,      // 最大駅数
  DEFAULT: 2,  // デフォルト駅数
} as const;

// Google Places API の設定
export const PLACES_API = {
  TYPES: {
    RESTAURANT: 'restaurant',
    FOOD: 'food',
    MEAL_TAKEAWAY: 'meal_takeaway',
    TRAIN_STATION: 'train_station',
  },
  MAX_RESULTS: 20,
  PHOTO_MAX_WIDTH: 400,
  PHOTO_MAX_HEIGHT: 300,
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  GEOLOCATION_DENIED: '位置情報の取得が拒否されました。設定から位置情報を有効にしてください。',
  GEOLOCATION_UNAVAILABLE: '位置情報を取得できませんでした。',
  GEOLOCATION_TIMEOUT: '位置情報の取得がタイムアウトしました。',
  GEOLOCATION_UNSUPPORTED: 'お使いのブラウザは位置情報に対応していません。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  API_ERROR: 'サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。',
  SEARCH_FAILED: '検索に失敗しました。条件を変更して再度お試しください。',
  NO_RESULTS: '条件に合う飲食店が見つかりませんでした。',
  INVALID_MOOD: '気分を入力してください。',
  INVALID_LOCATION: '位置情報が取得できませんでした。',
} as const;

// UI関連の定数
export const UI = {
  TOUCH_TARGET_SIZE: 44, // タッチターゲットの最小サイズ (px)
  DEBOUNCE_DELAY: 300,   // デバウンス遅延時間 (ms)
  LOADING_TIMEOUT: 10000, // ローディングタイムアウト (ms)
  RETRY_ATTEMPTS: 3,     // リトライ回数
  RETRY_DELAY: 1000,     // リトライ間隔 (ms)
} as const;

// Google Maps URL生成用
export const GOOGLE_MAPS = {
  BASE_URL: 'https://www.google.com/maps/search/',
  QUERY_PARAMS: {
    API: 'api=1',
    QUERY: 'query',
    QUERY_PLACE_ID: 'query_place_id',
  },
} as const;

// 気分入力のプレースホルダー例
export const MOOD_PLACEHOLDERS = [
  '疲れた時に食べたい温かいもの',
  'さっぱりしたものが食べたい',
  'がっつり肉料理が食べたい',
  '甘いものでほっとしたい',
  'ヘルシーなものが食べたい',
  '辛いものでスッキリしたい',
] as const;