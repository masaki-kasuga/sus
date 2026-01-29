import dotenv from 'dotenv';

dotenv.config();

function mustNumber(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  pg: {
    host: process.env.PGHOST ?? "127.0.0.1",
    port: mustNumber(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE ?? "waste_management",
    user: process.env.PGUSER ?? "wm_app",
    password: process.env.PGPASSWORD ?? "",
    pgSsl: process.env.PGSSL === "true",

    poolMax: mustNumber(process.env.PGPOOL_MAX, 10),
    poolIdleTimeoutMs: mustNumber(process.env.PGPOOL_IDLE_TIMEOUT_MS, 30_000),
    poolConnectionTimeoutMs: mustNumber(
      process.env.PGPOOL_CONNECTION_TIMEOUT_MS,
      2_000
    ),
  },
} as const;
