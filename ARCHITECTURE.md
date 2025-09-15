# アーキテクチャ設計書

## 概要

「ご飯探索マップ」のアーキテクチャ設計と改善提案

## 現在のアーキテクチャ

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Backend)
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/            # UIコンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # 外部サービス統合
│   └── services/          # API サービス
├── types/                 # TypeScript型定義
└── utils/                 # ユーティリティ関数
```

## 改善提案

### 1. 状態管理の統合

**現状の問題:**
- 複数のカスタムフックで状態が分散
- 状態間の依存関係が複雑

**改善案:**
```typescript
// src/store/searchStore.ts
import { create } from 'zustand'

interface SearchStore {
  // 統合された状態管理
  mode: SearchMode
  mood: string
  radius: number
  stationCount: number
  results: RestaurantResult[]
  loading: boolean
  error: string | null
  
  // アクション
  setMode: (mode: SearchMode) => void
  setMood: (mood: string) => void
  search: () => Promise<void>
  reset: () => void
}
```

### 2. サービス層の抽象化

**現状の問題:**
- 各サービスが直接APIを呼び出し
- エラーハンドリングが分散
- テストが困難

**改善案:**
```typescript
// src/lib/api/client.ts
class ApiClient {
  private baseURL: string
  private timeout: number
  
  async request<T>(endpoint: string, options?: RequestOptions): Promise<T>
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: any): Promise<T>
}

// src/lib/repositories/searchRepository.ts
class SearchRepository {
  constructor(private apiClient: ApiClient) {}
  
  async convertMood(mood: string): Promise<MoodConversionResponse>
  async searchPlaces(request: PlacesSearchRequest): Promise<PlacesSearchResponse>
  async searchStations(request: StationSearchRequest): Promise<StationSearchResponse>
}
```

### 3. エラーハンドリングの統一

**現状の問題:**
- エラー処理が各コンポーネントに分散
- エラーメッセージが統一されていない

**改善案:**
```typescript
// src/lib/errors/errorBoundary.tsx
class SearchErrorBoundary extends React.Component {
  // 統一されたエラーハンドリング
}

// src/hooks/useErrorHandler.ts
export function useErrorHandler() {
  const showError = (error: ApiError) => {
    // 統一されたエラー表示ロジック
  }
  
  return { showError, clearError }
}
```

### 4. パフォーマンス最適化

**改善案:**
```typescript
// src/lib/cache/searchCache.ts
class SearchCache {
  private cache = new Map<string, CacheEntry>()
  private maxAge = 5 * 60 * 1000 // 5分
  
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  clear(): void
}

// src/hooks/useSearchWithCache.ts
export function useSearchWithCache() {
  // キャッシュ機能付き検索フック
}
```

## 推奨ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
├── components/             # UIコンポーネント
│   ├── ui/                # 基本UIコンポーネント
│   ├── features/          # 機能別コンポーネント
│   └── layout/            # レイアウトコンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # 外部統合・ユーティリティ
│   ├── api/              # API クライアント
│   ├── cache/            # キャッシュ機能
│   ├── errors/           # エラーハンドリング
│   └── services/         # 外部サービス
├── store/                 # 状態管理 (Zustand)
├── types/                 # TypeScript型定義
└── utils/                 # ヘルパー関数
```

## 実装優先度

### 高優先度
1. **エラーハンドリングの統一** - ユーザー体験向上
2. **キャッシュ機能の追加** - パフォーマンス向上
3. **状態管理の整理** - 保守性向上

### 中優先度
1. **サービス層の抽象化** - テスタビリティ向上
2. **コンポーネントの分割** - 再利用性向上

### 低優先度
1. **状態管理ライブラリ導入** - 現在の規模では不要
2. **マイクロフロントエンド化** - 将来的な拡張時に検討