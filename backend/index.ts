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

// 載入環境變數
dotenv.config();

/**
 * 驗證必要的環境變數
 */
const requiredEnvVars: string[] = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_KEY",
  "JWT_SECRET",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  console.error("Please create a .env file based on .env.example");
  process.exit(1);
}

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

/**
 * 允許的 CORS origins
 */
const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL || "",
].filter(Boolean);

/**
 * Middleware 設定
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // 允許沒有 origin 的請求（如 Postman、伺服器端請求）
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

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
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * 全域錯誤處理
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "伺服器錯誤" });
});

/**
 * 404 路由處理
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "找不到該路由" });
});

/**
 * 伺服器啟動
 * Vercel serverless 環境會匯出 app，本地環境則啟動伺服器
 */
if (!process.env.VERCEL) {
  // 本地開發環境
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔐 CORS enabled for: ${allowedOrigins.join(", ")}`);
  });
}

// Vercel serverless 環境和本地都匯出 app
export default app;
