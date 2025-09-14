// ヘルスチェック API エンドポイント

import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * アプリケーションの健全性チェック
 */
export async function GET() {
  try {
    // 基本的な健全性チェック
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // 環境変数の存在チェック
    const requiredEnvVars = [
      'GOOGLE_PLACES_API_KEY',
      'GOOGLE_DIRECTIONS_API_KEY',
      'GEMINI_API_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          ...healthStatus,
          status: 'unhealthy',
          issues: [`Missing environment variables: ${missingEnvVars.join(', ')}`],
        },
        { status: 503 }
      );
    }

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}