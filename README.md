# ご飯探索マップ

気分に合わせて周辺の飲食店を検索できるスマートフォン対応Webアプリケーション

## 開発環境セットアップ

### 前提条件
- Docker
- Docker Compose

### 環境構築手順

1. **環境変数の設定**
```bash
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

2. **Docker環境の起動**
```bash
docker-compose up --build
```

3. **アプリケーションへのアクセス**
- ブラウザで http://localhost:3000 にアクセス

### 開発時の注意事項

- ホットリロード対応済み（ファイル変更時に自動更新）
- TypeScript厳密モード有効
- TailwindCSS設定済み
- モバイルファーストデザイン

### 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **スタイリング**: TailwindCSS
- **開発環境**: Docker, Node.js 20 Alpine
- **外部API**: Google Places API, Google Directions API, Gemini API
