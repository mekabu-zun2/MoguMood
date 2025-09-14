// MSW ハンドラー - API モック

import { rest } from 'msw';
import type { MoodConversionResponse, PlacesSearchResponse, StationSearchResponse } from '../types';

export const handlers = [
  // 気分変換 API
  rest.post('/api/mood', (req, res, ctx) => {
    const mockResponse: MoodConversionResponse = {
      originalMood: '疲れた時に食べたい温かいもの',
      searchTags: ['ラーメン', 'うどん', '鍋料理', 'スープ'],
      searchQuery: 'ラーメン OR うどん OR 鍋料理',
    };

    return res(
      ctx.status(200),
      ctx.json({
        data: mockResponse,
        status: 'success',
      })
    );
  }),

  // 飲食店検索 API
  rest.post('/api/places', (req, res, ctx) => {
    const mockResponse: PlacesSearchResponse = {
      results: [
        {
          placeId: 'ChIJ123',
          name: 'テストラーメン店',
          rating: 4.5,
          priceLevel: 2,
          types: ['restaurant', 'food'],
          vicinity: '東京都渋谷区テスト1-1-1',
          photos: ['https://example.com/photo1.jpg'],
          distance: 300,
          googleMapsUrl: 'https://maps.google.com/test1',
        },
        {
          placeId: 'ChIJ456',
          name: 'テストうどん店',
          rating: 4.2,
          priceLevel: 1,
          types: ['restaurant', 'meal_takeaway'],
          vicinity: '東京都渋谷区テスト2-2-2',
          photos: ['https://example.com/photo2.jpg'],
          distance: 500,
          googleMapsUrl: 'https://maps.google.com/test2',
        },
      ],
      status: 'OK',
    };

    return res(
      ctx.status(200),
      ctx.json({
        data: mockResponse,
        status: 'success',
      })
    );
  }),

  // 駅検索 API
  rest.post('/api/stations', (req, res, ctx) => {
    const mockResponse: StationSearchResponse = {
      nearestStation: {
        placeId: 'ChIJStation1',
        name: '渋谷駅',
        location: { lat: 35.6580, lng: 139.7016 },
        distance: 200,
      },
      stationsInRange: [
        {
          placeId: 'ChIJStation1',
          name: '渋谷駅',
          location: { lat: 35.6580, lng: 139.7016 },
          distance: 200,
        },
        {
          placeId: 'ChIJStation2',
          name: '新宿駅',
          location: { lat: 35.6896, lng: 139.7006 },
          distance: 1500,
        },
      ],
      status: 'OK',
    };

    return res(
      ctx.status(200),
      ctx.json({
        data: mockResponse,
        status: 'success',
      })
    );
  }),

  // 最寄り駅検索 API
  rest.get('/api/stations/nearest', (req, res, ctx) => {
    const mockStation = {
      placeId: 'ChIJStation1',
      name: '渋谷駅',
      location: { lat: 35.6580, lng: 139.7016 },
      distance: 200,
    };

    return res(
      ctx.status(200),
      ctx.json({
        data: mockStation,
        status: 'success',
      })
    );
  }),

  // エラーレスポンスのテスト用
  rest.post('/api/mood/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: 'サーバーエラーが発生しました',
        status: 'error',
      })
    );
  }),

  rest.post('/api/places/error', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        error: '不正なリクエストです',
        status: 'error',
      })
    );
  }),
];

// 遅延レスポンス用のハンドラー
export const delayedHandlers = [
  rest.post('/api/mood/slow', (req, res, ctx) => {
    return res(
      ctx.delay(2000), // 2秒遅延
      ctx.status(200),
      ctx.json({
        data: {
          originalMood: '遅延テスト',
          searchTags: ['テスト'],
          searchQuery: 'テスト',
        },
        status: 'success',
      })
    );
  }),
];