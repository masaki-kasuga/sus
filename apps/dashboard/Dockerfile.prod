FROM node:20-alpine

WORKDIR /app

# package.jsonをコピー
COPY package.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# ポートを公開
EXPOSE 5173

# 開発モードで起動
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

