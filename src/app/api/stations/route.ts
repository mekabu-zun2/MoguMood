// 駅検索 API エンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { searchStationsInRange, findNearestStation } from '../../../lib/services/directionsService';
import type { 
  StationSearchRequest, 
  StationSearchResponse, 
  StationInfo,
  ApiResponse, 
  ApiError 
} from '../../../types';
import { validation, logError } from '../../../utils';

/**
 * POST /api/stations
 * 駅検索（最寄り駅特定 + 指定駅数分のルート取得）
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの解析
    const body: StationSearchRequest = await request.json();
    
    // 入力値検証
    const validationError = validateStationRequest(body);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    // 駅検索実行
    const result = await searchStationsInRange(body);
    
    const response: ApiResponse<StationSearchResponse> = {
      data: result,
      status: 'success',
    };

    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/stations/nearest
 * 最寄り駅のみを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // パラメータ検証
    if (!lat || !lng) {
      return NextResponse.json({
        error: '位置情報（lat, lng）が必要です',
        status: 'error',
      }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({
        error: '位置情報の形式が不正です',
        status: 'error',
      }, { status: 400 });
    }

    if (!validation.location(latitude, longitude)) {
      return NextResponse.json({
        error: '位置情報の値が不正です',
        status: 'error',
      }, { status: 400 });
    }

    // 最寄り駅検索
    const nearestStation = await findNearestStation({
      lat: latitude,
      lng: longitude,
    });

    const response: ApiResponse<StationInfo> = {
      data: nearestStation,
      status: 'success',
    };

    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * リクエストの入力値検証
 */
function validateStationRequest(body: any): ApiResponse<null> | null {
  // bodyの存在チェック
  if (!body || typeof body !== 'object') {
    return {
      error: '不正なリクエスト形式です',
      status: 'error',
    };
  }

  // 位置情報の検証
  if (!body.location || typeof body.location !== 'object') {
    return {
      error: '位置情報が必要です',
      status: 'error',
    };
  }

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

  // 駅数の検証
  if (!body.stationCount || typeof body.stationCount !== 'number') {
    return {
      error: '駅数が必要です',
      status: 'error',
    };
  }

  if (!validation.stationCount(body.stationCount)) {
    return {
      error: '駅数は1〜5の範囲で指定してください',
      status: 'error',
    };
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

  logError(apiError, 'API /api/stations');

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
 * OPTIONS /api/stations
 * CORS対応
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}