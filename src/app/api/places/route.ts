// 飲食店検索 API エンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { searchNearbyRestaurants, searchRestaurantsByText } from '../../../lib/services/placesService';
import { searchStationsInRange } from '../../../lib/services/directionsService';
import type { 
  PlacesSearchRequest, 
  PlacesSearchResponse, 
  ApiResponse, 
  ApiError,
  RestaurantResult,
  SearchMode 
} from '../../../types';
import { validation, logError } from '../../../utils';

interface ExtendedPlacesSearchRequest extends PlacesSearchRequest {
  mode: SearchMode;
  stationCount?: number;
}

/**
 * POST /api/places
 * 飲食店検索（半径モード・駅数モード対応）
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの解析
    const body: ExtendedPlacesSearchRequest = await request.json();
    
    // 入力値検証
    const validationError = validatePlacesRequest(body);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    let searchResult: PlacesSearchResponse;

    // 検索モードに応じて処理を分岐
    if (body.mode === 'radius') {
      // 半径モード: 現在地から指定半径内を検索
      searchResult = await searchByRadius(body);
    } else if (body.mode === 'station') {
      // 駅数モード: 指定駅数分の駅周辺を検索
      searchResult = await searchByStations(body);
    } else {
      return NextResponse.json({
        error: '不正な検索モードです',
        status: 'error',
      }, { status: 400 });
    }

    const response: ApiResponse<PlacesSearchResponse> = {
      data: searchResult,
      status: 'success',
    };

    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 半径モードでの検索
 */
async function searchByRadius(request: ExtendedPlacesSearchRequest): Promise<PlacesSearchResponse> {
  const searchRequest: PlacesSearchRequest = {
    location: request.location,
    radius: request.radius || 1000,
    query: request.query,
    type: request.type,
  };

  return await searchRestaurantsByText(
    request.query,
    request.location,
    request.radius
  );
}

/**
 * 駅数モードでの検索
 */
async function searchByStations(request: ExtendedPlacesSearchRequest): Promise<PlacesSearchResponse> {
  if (!request.stationCount) {
    throw {
      code: 'INVALID_REQUEST',
      message: '駅数が指定されていません',
    } as ApiError;
  }

  // 駅検索
  const stationResponse = await searchStationsInRange({
    location: request.location,
    stationCount: request.stationCount,
  });

  const allResults: RestaurantResult[] = [];
  const processedStations = new Set<string>();

  // 各駅周辺で飲食店を検索
  for (const station of stationResponse.stationsInRange) {
    // 重複する駅をスキップ
    if (processedStations.has(station.placeId)) {
      continue;
    }
    processedStations.add(station.placeId);

    try {
      const stationResults = await searchRestaurantsByText(
        request.query,
        station.location,
        500 // 駅周辺500m
      );

      // 最寄り駅情報を追加
      const resultsWithStation = stationResults.results.map(result => ({
        ...result,
        nearestStation: station.name,
      }));

      allResults.push(...resultsWithStation);
    } catch (error) {
      // 個別の駅での検索エラーは警告として記録し、処理を継続
      console.warn(`Station search failed for ${station.name}:`, error);
    }
  }

  // 重複除去と並び替え
  const uniqueResults = removeDuplicateResults(allResults);
  const sortedResults = sortResultsByRelevance(uniqueResults, request.query);

  return {
    results: sortedResults.slice(0, 20), // 最大20件
    status: 'OK',
  };
}

/**
 * 重複する検索結果を除去
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
 * 検索結果を関連性でソート
 */
function sortResultsByRelevance(results: RestaurantResult[], query: string): RestaurantResult[] {
  return results.sort((a, b) => {
    // 1. 評価の高い順
    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (Math.abs(ratingDiff) > 0.1) {
      return ratingDiff;
    }

    // 2. 距離の近い順
    const distanceDiff = (a.distance || 0) - (b.distance || 0);
    if (Math.abs(distanceDiff) > 100) {
      return distanceDiff;
    }

    // 3. 名前にクエリが含まれているものを優先
    const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
    const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());
    
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    return 0;
  });
}

/**
 * リクエストの入力値検証
 */
function validatePlacesRequest(body: any): ApiResponse<null> | null {
  // bodyの存在チェック
  if (!body || typeof body !== 'object') {
    return {
      error: '不正なリクエスト形式です',
      status: 'error',
    };
  }

  // 必須フィールドの検証
  if (!body.location || typeof body.location !== 'object') {
    return {
      error: '位置情報が必要です',
      status: 'error',
    };
  }

  if (!body.query || typeof body.query !== 'string') {
    return {
      error: '検索クエリが必要です',
      status: 'error',
    };
  }

  if (!body.mode || !['radius', 'station'].includes(body.mode)) {
    return {
      error: '検索モード（radius または station）が必要です',
      status: 'error',
    };
  }

  // 位置情報の検証
  const { lat, lng } = body.location;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return {
      error: '位置情報の形式が不正です',
      status: 'error',
    };
  }

  if (!validation.location(lat, lng)) {
    return {
      error: '位置情報の値が不正です',
      status: 'error',
    };
  }

  // モード別の検証
  if (body.mode === 'radius') {
    if (body.radius && !validation.radius(body.radius)) {
      return {
        error: '半径は500m〜5000mの範囲で指定してください',
        status: 'error',
      };
    }
  } else if (body.mode === 'station') {
    if (!body.stationCount || !validation.stationCount(body.stationCount)) {
      return {
        error: '駅数は1〜5の範囲で指定してください',
        status: 'error',
      };
    }
  }

  return null;
}

/**
 * APIエラーハンドリング
 */
function handleApiError(error: unknown): NextResponse {
  let apiError: ApiError;
  
  if (error && typeof error === 'object' && 'code' in error) {
    apiError = error as ApiError;
  } else if (error instanceof Error) {
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'サーバーエラーが発生しました',
      details: { originalError: error.message },
    };
  } else {
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: 'サーバーエラーが発生しました',
      details: { originalError: String(error) },
    };
  }

  logError(apiError, 'POST /api/places');

  let statusCode = 500;
  switch (apiError.code) {
    case 'INVALID_REQUEST':
      statusCode = 400;
      break;
    case 'API_KEY_ERROR':
      statusCode = 401;
      break;
    case 'RATE_LIMIT_ERROR':
      statusCode = 429;
      break;
    case 'NETWORK_ERROR':
    case 'UNKNOWN_ERROR':
    default:
      statusCode = 500;
      break;
  }

  const response: ApiResponse<null> = {
    error: apiError.message,
    status: 'error',
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * GET /api/places
 * APIの動作確認用エンドポイント
 */
export async function GET() {
  const response = {
    message: 'Places search API is running',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: '飲食店検索（半径モード・駅数モード対応）',
        parameters: {
          mode: 'string (required) - "radius" or "station"',
          location: 'object (required) - { lat: number, lng: number }',
          query: 'string (required) - 検索クエリ',
          radius: 'number (optional) - 半径モード時の検索半径（m）',
          stationCount: 'number (optional) - 駅数モード時の駅数',
        },
        examples: {
          radius_mode: {
            mode: 'radius',
            location: { lat: 35.6762, lng: 139.6503 },
            query: 'ラーメン',
            radius: 1000,
          },
          station_mode: {
            mode: 'station',
            location: { lat: 35.6762, lng: 139.6503 },
            query: 'ラーメン',
            stationCount: 3,
          },
        },
      },
    },
  };

  return NextResponse.json(response, { status: 200 });
}