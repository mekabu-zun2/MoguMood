// 検索結果キャッシュ機能

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SearchCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分

  /**
   * キャッシュからデータを取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 有効期限チェック
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * データをキャッシュに保存
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * 特定のキーを削除
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 期限切れのエントリを削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * キャッシュサイズを取得
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * キャッシュキーを生成
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

// シングルトンインスタンス
export const searchCache = new SearchCache();

// 定期的なクリーンアップ（10分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanup();
  }, 10 * 60 * 1000);
}