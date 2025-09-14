// 最寄り駅取得専用エンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { findNearestStation } from '../../../../lib/services/directionsService';
import type { StationInfo, ApiResponse, ApiError } from '../../../../types';
import { validation, logError } from '../../../../utils';

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

  logError(apiError, 'GET /api/stations/nearest');

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