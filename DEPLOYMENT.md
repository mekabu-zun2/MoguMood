# デプロイメントガイド 🚀

このドキュメントでは、「ご飯探索マップ」アプリケーションを本番環境にデプロイする方法について説明します。

## 📋 デプロイメント前チェックリスト

### 必須要件
- [ ] Google Places API キーの取得と設定
- [ ] Google Directions API キーの取得と設定  
- [ ] Gemini API キーの取得と設定
- [ ] ドメイン名の取得（HTTPS必須）
- [ ] SSL証明書の準備
- [ ] Docker と Docker Compose のインストール

### セキュリティチェック
- [ ] APIキーの権限設定（必要最小限に制限）
- [ ] CORS設定の確認
- [ ] 環境変数の適切な管理
- [ ] セキュリティヘッダーの設定

## 🔧 API設定

### Google Cloud Console設定

1. **Google Cloud Consoleにアクセス**
   - [Google Cloud Console](https://console.cloud.google.com/) にログイン
   - 新しいプロジェクトを作成または既存のプロジェクトを選択

2. **必要なAPIを有効化**
   ```
   - Places API (New)
   - Places API  
   - Directions API
   - Maps JavaScript API（将来の拡張用）
   ```

3. **APIキーの作成**
   - 「認証情報」→「認証情報を作成」→「APIキー」
   - 作成されたAPIキーを安全に保管

4. **APIキーの制限設定**
   ```
   アプリケーションの制限:
   - HTTPリファラー: https://your-domain.com/*
   
   API制限:
   - Places API (New)
   - Places API
   - Directions API
   ```

### Gemini API設定

1. **Google AI Studioにアクセス**
   - [Google AI Studio](https://ai.google.dev/) にアクセス
   - Googleアカウントでログイン

2. **APIキーの生成**
   - 「Get API Key」をクリック
   - 新しいAPIキーを生成
   - APIキーを安全に保管

## 🐳 Docker デプロイメント

### 1. 環境変数の設定

本番環境用の環境変数ファイルを作成：

```bash
# .env.production ファイルを作成
cp .env.example .env.production
```

`.env.production` を編集：
```bash
# 本番環境設定
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# APIキー
GOOGLE_PLACES_API_KEY=your_production_google_places_api_key
GOOGLE_DIRECTIONS_API_KEY=your_production_google_directions_api_key
GEMINI_API_KEY=your_production_gemini_api_key
```

### 2. 本番用イメージのビルド

```bash
# 本番用Dockerイメージをビルド
docker build -f Dockerfile.production -t food-exploration-map:latest .
```

### 3. 本番環境での起動

```bash
# 本番環境用docker-composeで起動
docker-compose -f docker-compose.production.yml up -d
```

### 4. ヘルスチェック

```bash
# アプリケーションの健全性を確認
curl http://localhost:3000/api/health
```

## 🌐 クラウドプラットフォーム別デプロイ

### Vercel デプロイ

1. **Vercelアカウント作成**
   - [Vercel](https://vercel.com/) でアカウント作成
   - GitHubリポジトリと連携

2. **環境変数設定**
   ```
   Vercel Dashboard → Settings → Environment Variables
   
   GOOGLE_PLACES_API_KEY=your_key
   GOOGLE_DIRECTIONS_API_KEY=your_key  
   GEMINI_API_KEY=your_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **デプロイ**
   ```bash
   # Vercel CLIを使用
   npm i -g vercel
   vercel --prod
   ```

### AWS ECS デプロイ

1. **ECRリポジトリ作成**
   ```bash
   aws ecr create-repository --repository-name food-exploration-map
   ```

2. **イメージのプッシュ**
   ```bash
   # ECRにログイン
   aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com
   
   # イメージにタグ付け
   docker tag food-exploration-map:latest <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/food-exploration-map:latest
   
   # プッシュ
   docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/food-exploration-map:latest
   ```

3. **ECSサービス作成**
   - ECSクラスターを作成
   - タスク定義を作成（環境変数を設定）
   - サービスを作成してデプロイ

### Google Cloud Run デプロイ

1. **gcloudの設定**
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   ```

2. **Container Registryにプッシュ**
   ```bash
   # イメージにタグ付け
   docker tag food-exploration-map:latest gcr.io/your-project-id/food-exploration-map
   
   # プッシュ
   docker push gcr.io/your-project-id/food-exploration-map
   ```

3. **Cloud Runにデプロイ**
   ```bash
   gcloud run deploy food-exploration-map \
     --image gcr.io/your-project-id/food-exploration-map \
     --platform managed \
     --region asia-northeast1 \
     --allow-unauthenticated \
     --set-env-vars GOOGLE_PLACES_API_KEY=your_key,GOOGLE_DIRECTIONS_API_KEY=your_key,GEMINI_API_KEY=your_key
   ```

## 🔒 セキュリティ設定

### SSL/TLS証明書

1. **Let's Encrypt使用（推奨）**
   ```bash
   # Certbotのインストール
   sudo apt-get install certbot python3-certbot-nginx
   
   # 証明書の取得
   sudo certbot --nginx -d your-domain.com
   ```

2. **Nginx設定例**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### セキュリティヘッダー

Next.js設定（`next.config.js`）でセキュリティヘッダーを設定済み：
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff  
- Referrer-Policy: origin-when-cross-origin
- Permissions-Policy: geolocation=(self)

## 📊 監視とログ

### ヘルスチェック設定

アプリケーションは `/api/health` エンドポイントでヘルスチェックを提供：

```bash
# 定期的なヘルスチェック
curl -f http://your-domain.com/api/health || exit 1
```

### ログ監視

```bash
# Dockerログの確認
docker-compose -f docker-compose.production.yml logs -f app

# ログローテーション設定
docker-compose -f docker-compose.production.yml logs --tail=1000 app
```

## 🚀 パフォーマンス最適化

### CDN設定

1. **CloudFlare設定**
   - DNS設定でCloudFlareを経由
   - キャッシュルールの設定
   - 画像最適化の有効化

2. **AWS CloudFront設定**
   - ディストリビューション作成
   - オリジンの設定
   - キャッシュビヘイビアの設定

### データベース（将来の拡張）

現在はステートレスですが、将来的にデータベースを追加する場合：

1. **PostgreSQL**
   ```bash
   # Docker Composeにデータベースを追加
   services:
     db:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: food_exploration_map
         POSTGRES_USER: app_user
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   ```

2. **Redis（キャッシュ用）**
   ```bash
   services:
     redis:
       image: redis:7-alpine
       command: redis-server --appendonly yes
       volumes:
         - redis_data:/data
   ```

## 🔄 CI/CD パイプライン

### GitHub Actions設定例

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -f Dockerfile.production -t food-exploration-map .
      
      - name: Run tests
        run: docker run --rm food-exploration-map npm test
      
      - name: Deploy to production
        run: |
          # デプロイスクリプトを実行
          ./deploy.sh
```

## 📈 スケーリング

### 水平スケーリング

```yaml
# docker-compose.production.yml
services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### ロードバランサー設定

```nginx
upstream app_servers {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    location / {
        proxy_pass http://app_servers;
    }
}
```

## 🆘 トラブルシューティング

### よくある問題

1. **APIキーエラー**
   ```bash
   # ヘルスチェックでAPIキーの状態確認
   curl http://your-domain.com/api/health
   ```

2. **メモリ不足**
   ```bash
   # メモリ使用量の確認
   docker stats
   
   # メモリ制限の調整
   docker-compose -f docker-compose.production.yml up -d --scale app=2
   ```

3. **SSL証明書エラー**
   ```bash
   # 証明書の更新
   sudo certbot renew
   
   # Nginxの再起動
   sudo systemctl reload nginx
   ```

## 📞 サポート

デプロイメントに関する問題や質問がある場合は、以下のリソースを参照してください：

- [Next.js デプロイメントドキュメント](https://nextjs.org/docs/deployment)
- [Docker 公式ドキュメント](https://docs.docker.com/)
- [Google Cloud API ドキュメント](https://cloud.google.com/apis/docs)

---

**Happy Deploying! 🚀**