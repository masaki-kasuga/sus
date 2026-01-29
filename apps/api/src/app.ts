import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { requestLogger } from './middlewares/logger.js';
import { securityMiddleware, apiLimiter, compressionMiddleware } from './middlewares/security.js';
import { errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// セキュリティミドルウェア
app.use(securityMiddleware);
app.use(compressionMiddleware);

// CORS設定
app.use(cors(corsOptions));

// purser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// レート制限（将来デプロイしたとき用のセキュリティ対策）
app.use('/api', apiLimiter);

// ロガー
app.use(requestLogger);

// ルーティング
app.use('/api', routes);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// エラーハンドリング
app.use(errorHandler);

export default app;

