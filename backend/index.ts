/**
 * Coach Aaron Backend Server
 * Express + TypeScript + Supabase
 *
 * @module index
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import coursesRoutes from "./routes/courses.js";
import videosRoutes from "./routes/videos.js";
import adminRoutes from "./routes/admin.js";
import { validateEnv } from "./utils/env.js";
import { logger } from "./utils/logger.js";
import {
  sanitizeInput,
  detectSuspiciousRequest,
} from "./middleware/sanitize.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

// 載入環境變數
dotenv.config();

/**
 * 驗證並取得環境變數
 */
const env = validateEnv();

const app: Express = express();
const PORT: number = env.PORT;

/**
 * 允許的 CORS origins
 */
const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:3000",
  env.FRONTEND_URL || "",
].filter(Boolean);

/**
 * Middleware 設定
 */

// 信任 proxy（Vercel 環境需要）
app.set("trust proxy", 1);

// CORS 設定
app.use(
  cors({
    origin: (origin, callback) => {
      // 允許沒有 origin 的請求（如 Postman、伺服器端請求）
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS 拒絕來源", { origin });
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// 安全性中介軟體
app.use(sanitizeInput);
app.use(detectSuspiciousRequest);

// 全域 Rate Limiting（較寬鬆）
app.use("/api", apiLimiter);

/**
 * API 路由註冊
 */
app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/admin", adminRoutes);

/**
 * 健康檢查端點
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: "1.0.0",
  });
});

/**
 * 全域錯誤處理
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error("伺服器錯誤", err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    error:
      env.NODE_ENV === "production" ? "伺服器錯誤，請稍後再試" : err.message,
  });
});

/**
 * 404 路由處理
 */
app.use((req: Request, res: Response) => {
  logger.warn("404 找不到路由", {
    path: req.path,
    method: req.method,
  });
  res.status(404).json({ error: "找不到該路由" });
});

/**
 * 伺服器啟動
 * Vercel serverless 環境會匯出 app，本地環境則啟動伺服器
 */
if (!process.env.VERCEL) {
  // 本地開發環境
  app.listen(PORT, () => {
    logger.info("🚀 伺服器啟動成功", {
      port: PORT,
      environment: env.NODE_ENV,
      supabaseUrl: env.SUPABASE_URL,
      corsOrigins: allowedOrigins,
    });
  });
}

// Vercel serverless 環境和本地都匯出 app
export default app;
