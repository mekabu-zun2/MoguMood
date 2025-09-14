// 気分変換 API エンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { convertMoodToSearchTags } from '../../../lib/services/geminiService';
import type { MoodConversionRequest, MoodConversionResponse, ApiResponse, ApiError } from '../../../types';
import { validation, logError } from '../../../utils';

/**
 * POST /api/mood
 * 気分テキストを検索タグに変換
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの解析
    const body: MoodConversionRequest = await request.json();
    
    // 入力値検証
    const validationError = validateMoodRequest(body);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    // 気分変換処理
    const result = await convertMoodToSearchTags(body.mood);
    
    const response: ApiResponse<MoodConversionResponse> = {
      data: result,
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
function validateMoodRequest(body: any): ApiResponse<null> | null {
  // bodyの存在チェック
  if (!body || typeof body !== 'object') {
    return {
      error: '不正なリクエスト形式です',
      status: 'error',
    };
  }

  // moodフィールドの検証
  if (!body.mood || typeof body.mood !== 'string') {
    return {
      error: '気分を入力してください',
      status: 'error',
    };
  }

  // 気分の内容検証
  if (!validation.mood(body.mood)) {
    return {
      error: '気分は1文字以上100文字以下で入力してください',
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
    // 既知のApiError
    apiError = error as ApiError;
  } else if (error instanceof Error) {
    // 一般的なError
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'サーバーエラーが発生しました',
      details: { originalError: error.message },
    };
  } else {
    // 不明なエラー
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: 'サーバーエラーが発生しました',
      details: { originalError: String(error) },
    };
  }

  // エラーログ出力
  logError(apiError, 'POST /api/mood');

  // HTTPステータスコードの決定
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
 * GET /api/mood
 * APIの動作確認用エンドポイント
 */
export async function GET() {
  const response = {
    message: 'Mood conversion API is running',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: '気分テキストを検索タグに変換',
        parameters: {
          mood: 'string (required) - 変換したい気分テキスト',
        },
        example: {
          mood: '疲れた時に食べたい温かいもの',
        },
      },
    },
  };

  return NextResponse.json(response, { status: 200 });
}