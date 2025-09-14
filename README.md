# ご飯探索マップ 🍽️

気分に合わせて周辺の飲食店を検索できるスマートフォン対応Webアプリケーション

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 📖 概要

「ご飯探索マップ」は、ユーザーの気分を自然言語で入力するだけで、AI（Gemini）が適切な検索タグに変換し、Google Places APIを使って周辺の飲食店を検索できるWebアプリケーションです。

### 🌟 主な機能

- **気分入力**: 「疲れた時に食べたい温かいもの」などの自然な表現で検索
- **2つの検索モード**: 
  - 半径モード: 現在地から指定した半径内で検索
  - 駅数モード: 最寄り駅から指定した駅数分の範囲で検索
- **スマートフォン対応**: モバイルファーストのレスポンシブデザイン
- **Googleマップ連携**: 検索結果から直接Googleマップに遷移
- **アクセシビリティ対応**: スクリーンリーダー対応、キーボードナビゲーション

## 🚀 クイックスタート

### 前提条件

- [Docker](https://www.docker.com/get-started) 
- [Docker Compose](https://docs.docker.com/compose/install/)
- 以下のAPIキー:
  - [Google Places API キー](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
  - [Google Directions API キー](https://developers.google.com/maps/documentation/directions/get-api-key)
  - [Gemini API キー](https://ai.google.dev/gemini-api/docs/api-key)

### 🛠️ 開発環境セットアップ

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd food-exploration-map
```

2. **環境変数の設定**
```bash
cp .env.example .env
```

`.env`ファイルを編集して、取得したAPIキーを設定してください：
```bash
GOOGLE_PLACES_API_KEY=your_actual_google_places_api_key
GOOGLE_DIRECTIONS_API_KEY=your_actual_google_directions_api_key
GEMINI_API_KEY=your_actual_gemini_api_key
```

3. **Docker環境の起動**
```bash
docker-compose up --build
```

4. **アプリケーションへのアクセス**
ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス

## 📱 使用方法

1. **位置情報の許可**: ブラウザで位置情報の使用を許可
2. **検索モード選択**: 「半径モード」または「駅数モード」を選択
3. **気分入力**: 今の気分を自由に入力（例: 「疲れた時に食べたい温かいもの」）
4. **範囲設定**: 半径（500m〜5km）または駅数（1〜5駅）を設定
5. **検索実行**: 「飲食店を検索」ボタンをクリック
6. **結果確認**: 検索結果から「Googleマップで開く」で詳細確認

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router) - React フレームワーク
- **TypeScript** - 型安全性
- **TailwindCSS** - スタイリング
- **React Hooks** - 状態管理

### バックエンド
- **Next.js API Routes** - サーバーサイドAPI
- **Gemini API** - AI による気分変換
- **Google Places API** - 飲食店検索
- **Google Directions API** - 駅検索・ルート取得

### 開発・運用
- **Docker** - コンテナ化
- **Jest** - テストフレームワーク
- **React Testing Library** - コンポーネントテスト
- **MSW** - API モック
- **GitHub Actions** - CI/CD パイプライン

## 🧪 テスト

### テスト実行
```bash
# 全テスト実行
docker-compose run --rm app npm test

# ウォッチモード
docker-compose run --rm app npm run test:watch

# カバレッジ付きテスト
docker-compose run --rm app npm run test:coverage

# CI環境と同じテスト実行
docker-compose run --rm app npm run ci
```

### テスト構成
- **ユニットテスト**: ユーティリティ関数、カスタムフック
- **コンポーネントテスト**: React コンポーネント
- **統合テスト**: API エンドポイント、検索フロー

## 🔄 CI/CD

### GitHub Actions ワークフロー

このプロジェクトでは、mainブランチへのマージ前に必須のチェックを実行します：

#### 必須チェック項目
- ✅ **TypeScript型チェック** - `npm run type-check`
- ✅ **ESLintチェック** - `npm run lint`
- ✅ **セキュリティ監査** - `npm audit`
- ✅ **ユニットテスト** - `npm run test:ci`
- ✅ **ビルドテスト** - `npm run build`
- ✅ **インテグレーションテスト** - API動作確認

#### ブランチ保護ルール
- mainブランチへの直接プッシュは禁止
- プルリクエスト必須
- すべてのCIチェックが成功する必要がある
- 1人以上の承認が必要

#### ワークフロー構成
```
.github/workflows/
├── pr-checks.yml      # 必須チェック項目
├── ci.yml            # CIステータス統合
└── generate-lockfile.yml # package-lock.json生成
```

### ローカルでのCI確認
```bash
# CIと同じチェックをローカルで実行
npm run ci
```

## 🚢 本番環境デプロイ

### 本番環境用ビルド
```bash
# 本番用イメージのビルド
docker build -f Dockerfile.production -t food-exploration-map:latest .

# 本番環境での起動
docker-compose -f docker-compose.production.yml up -d
```

### 環境変数設定
本番環境では `.env.production` ファイルを作成し、適切な値を設定してください。

## 📊 パフォーマンス最適化

- **画像遅延読み込み**: Intersection Observer API を使用
- **コンポーネントメモ化**: React.memo による再レンダリング防止
- **バンドル最適化**: Next.js の自動最適化機能
- **キャッシュ戦略**: API レスポンスのメモリキャッシュ

## ♿ アクセシビリティ

- **WCAG 2.1 AA準拠**: スクリーンリーダー対応
- **キーボードナビゲーション**: 全機能をキーボードで操作可能
- **高コントラストモード**: システム設定に対応
- **動きを減らす設定**: prefers-reduced-motion 対応

## 🔒 セキュリティ

- **APIキー保護**: 環境変数による管理、フロントエンドに露出しない
- **CORS設定**: 適切なオリジン制限
- **入力値検証**: フロントエンド・バックエンド両方で実装
- **セキュリティヘッダー**: XSS、クリックジャッキング対策

## 📝 開発コマンド

```bash
# 開発サーバー起動
docker-compose up

# 型チェック
docker-compose run --rm app npm run type-check

# リント実行
docker-compose run --rm app npm run lint

# ビルド
docker-compose run --rm app npm run build

# コンテナ内でシェル実行
docker-compose exec app sh
```

## 🐛 トラブルシューティング

### よくある問題

**Q: 位置情報が取得できない**
- ブラウザの位置情報設定を確認
- HTTPS接続を使用（本番環境）
- プライベートブラウジングモードを無効化

**Q: API呼び出しが失敗する**
- `.env`ファイルのAPIキーを確認
- Google Cloud ConsoleでAPIが有効化されているか確認
- APIキーの使用制限設定を確認

**Q: Docker コンテナが起動しない**
```bash
# コンテナとイメージを削除して再ビルド
docker-compose down
docker system prune -f
docker-compose up --build
```

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題や質問がある場合は、[Issues](../../issues) でお気軽にお知らせください。

---

**Powered by Google Places API & Gemini AI** 🤖
