// 気分変換 API の統合テスト

import { POST, GET } from '../mood/route';
import { NextRequest } from 'next/server';

// 環境変数をモック
process.env.GEMINI_API_KEY = 'test-api-key';

// fetch をモック
global.fetch = jest.fn();

describe('/api/mood', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return mood conversion result', async () => {
      // Gemini API のレスポンスをモック
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  searchTags: ['ラーメン', 'うどん', '鍋料理'],
                  searchQuery: 'ラーメン OR うどん OR 鍋料理'
                })
              }]
            }
          }]
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: '疲れた時に食べたい温かいもの' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data).toHaveProperty('originalMood');
      expect(data.data).toHaveProperty('searchTags');
      expect(data.data).toHaveProperty('searchQuery');
      expect(data.data.searchTags).toContain('ラーメン');
    });

    it('should return error for empty mood', async () => {
      const request = new NextRequest('http://localhost:3000/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('error');
      expect(data.error).toBe('気分を入力してください');
    });

    it('should return error for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/mood', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('error');
      expect(data.error).toBe('気分を入力してください');
    });

    it('should return error for too long mood', async () => {
      const longMood = 'a'.repeat(101);
      const request = new NextRequest('http://localhost:3000/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: longMood }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('error');
      expect(data.error).toBe('気分は1文字以上100文字以下で入力してください');
    });

    it('should handle Gemini API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const request = new NextRequest('http://localhost:3000/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: '疲れた時に食べたい' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });

    it('should use fallback when Gemini API returns invalid JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'Invalid JSON response'
              }]
            }
          }]
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: '疲れた時に食べたい' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data).toHaveProperty('searchTags');
      // フォールバック処理により、適切なタグが返される
      expect(data.data.searchTags).toContain('ラーメン');
    });
  });

  describe('GET', () => {
    it('should return API information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('endpoints');
      expect(data.endpoints).toHaveProperty('POST');
    });
  });
});