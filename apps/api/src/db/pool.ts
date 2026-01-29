import { Pool } from "pg";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export const pool = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  database: config.pg.database,
  user: config.pg.user,
  password: config.pg.password,
  max: config.pg.poolMax,
  idleTimeoutMillis: config.pg.poolIdleTimeoutMs,
  connectionTimeoutMillis: config.pg.poolConnectionTimeoutMs,
});

pool.on("error", (err) => {
  // pool内のidle接続で起きたエラーなど
  logger.error("Unexpected Postgres pool error", err);
});
