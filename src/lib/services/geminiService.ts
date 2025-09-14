// Gemini API サービス

import type { MoodConversionResponse, ApiError } from '../../types';
import { handleFetchError, handleHttpError, withRetry } from '../../utils';

/**
 * Gemini API クライアント
 */
class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 気分テキストを検索タグに変換
   */
  async convertMoodToSearchTags(mood: string): Promise<MoodConversionResponse> {
    const prompt = this.createMoodConversionPrompt(mood);
    
    try {
      return await withRetry(async () => {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          }),
        });

        if (!response.ok) {
          throw handleHttpError(response);
        }

        const data = await response.json();
        return this.parseGeminiResponse(mood, data);
      }, 3, 1000);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error as ApiError;
      }
      throw handleFetchError(error);
    }
  }

  /**
   * 気分変換用のプロンプトを作成
   */
  private createMoodConversionPrompt(mood: string): string {
    return `
あなたは飲食店検索の専門家です。ユーザーの気分や欲求を適切な飲食店の検索タグに変換してください。

ユーザーの気分: "${mood}"

以下の形式でJSONレスポンスを返してください：
{
  "searchTags": ["タグ1", "タグ2", "タグ3"],
  "searchQuery": "検索クエリ"
}

ルール:
1. searchTagsは3-5個の具体的な料理名やジャンル名を含める
2. 日本の一般的な飲食店で提供される料理を中心に考える
3. searchQueryはGoogle Places APIで検索する際に使用するクエリ文字列
4. 気分に最も適した料理やジャンルを優先する
5. 曖昧な表現は具体的な料理名に変換する

例:
- "疲れた時に食べたい温かいもの" → ["ラーメン", "うどん", "鍋料理", "スープ"]
- "さっぱりしたい" → ["サラダ", "寿司", "そば", "冷やし中華"]
- "がっつり食べたい" → ["焼肉", "ステーキ", "とんかつ", "ハンバーガー"]

JSONのみを返し、他の説明は不要です。
    `.trim();
  }

  /**
   * Gemini APIのレスポンスを解析
   */
  private parseGeminiResponse(originalMood: string, data: any): MoodConversionResponse {
    try {
      // Gemini APIのレスポンス構造に従って解析
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Gemini APIからの応答が不正です');
      }

      // JSONを抽出（マークダウンのコードブロックが含まれている場合があるため）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSONレスポンスが見つかりません');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // レスポンスの検証
      if (!parsedResponse.searchTags || !Array.isArray(parsedResponse.searchTags)) {
        throw new Error('searchTagsが不正です');
      }

      if (!parsedResponse.searchQuery || typeof parsedResponse.searchQuery !== 'string') {
        throw new Error('searchQueryが不正です');
      }

      return {
        originalMood,
        searchTags: parsedResponse.searchTags,
        searchQuery: parsedResponse.searchQuery,
      };
    } catch (error) {
      // パースに失敗した場合はフォールバック処理
      return this.createFallbackResponse(originalMood);
    }
  }

  /**
   * フォールバック用のレスポンスを作成
   */
  private createFallbackResponse(mood: string): MoodConversionResponse {
    // 簡単なキーワードマッチングでフォールバック
    const moodLower = mood.toLowerCase();
    let searchTags: string[];
    let searchQuery: string;

    if (moodLower.includes('疲れ') || moodLower.includes('温か')) {
      searchTags = ['ラーメン', 'うどん', '鍋料理', 'スープ'];
      searchQuery = 'ラーメン OR うどん OR 鍋料理';
    } else if (moodLower.includes('さっぱり') || moodLower.includes('軽い')) {
      searchTags = ['サラダ', '寿司', 'そば', '和食'];
      searchQuery = 'サラダ OR 寿司 OR そば';
    } else if (moodLower.includes('がっつり') || moodLower.includes('肉')) {
      searchTags = ['焼肉', 'ステーキ', 'とんかつ', 'ハンバーガー'];
      searchQuery = '焼肉 OR ステーキ OR とんかつ';
    } else if (moodLower.includes('甘い') || moodLower.includes('デザート')) {
      searchTags = ['カフェ', 'スイーツ', 'ケーキ', 'アイス'];
      searchQuery = 'カフェ OR スイーツ OR ケーキ';
    } else if (moodLower.includes('辛い') || moodLower.includes('スパイス')) {
      searchTags = ['カレー', '韓国料理', '中華料理', '麻婆豆腐'];
      searchQuery = 'カレー OR 韓国料理 OR 中華料理';
    } else {
      // デフォルト
      searchTags = ['レストラン', '定食', '和食', '洋食'];
      searchQuery = 'レストラン OR 定食';
    }

    return {
      originalMood: mood,
      searchTags,
      searchQuery,
    };
  }
}

// シングルトンインスタンス
let geminiServiceInstance: GeminiService | null = null;

/**
 * Gemini サービスのインスタンスを取得
 */
export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    geminiServiceInstance = new GeminiService(apiKey);
  }
  return geminiServiceInstance;
}

/**
 * 気分を検索タグに変換（エクスポート用の便利関数）
 */
export async function convertMoodToSearchTags(mood: string): Promise<MoodConversionResponse> {
  const service = getGeminiService();
  return service.convertMoodToSearchTags(mood);
}