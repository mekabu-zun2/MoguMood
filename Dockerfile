# Node 20 Alpine ベース (要件 9.1)
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージマネージャーのキャッシュを活用するため、package.jsonを先にコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# Next.js の開発サーバーを起動 (ホットリロード対応)
EXPOSE 3000

# 開発モードで起動
CMD ["npm", "run", "dev"]