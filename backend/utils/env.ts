/**
 * 環境變數驗證與型別安全
 *
 * 確保所有必要的環境變數都已設定且格式正確。
 *
 * @module utils/env
 */

import { logger } from "./logger.js";

/**
 * 環境變數介面
 */
export interface EnvConfig {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;

  // JWT
  JWT_SECRET: string;

  // Server
  PORT: number;
  NODE_ENV: "development" | "production" | "test";

  // CORS
  FRONTEND_URL?: string;
}

/**
 * 驗證 URL 格式
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 驗證並解析環境變數
 */
export const validateEnv = (): EnvConfig => {
  const errors: string[] = [];

  // 必要的環境變數
  const required = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  // 檢查必要變數
  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      errors.push(`❌ 缺少必要環境變數: ${key}`);
    }
  });

  // URL 格式驗證
  if (required.SUPABASE_URL && !isValidUrl(required.SUPABASE_URL)) {
    errors.push(`❌ SUPABASE_URL 格式錯誤: ${required.SUPABASE_URL}`);
  }

  if (process.env.FRONTEND_URL && !isValidUrl(process.env.FRONTEND_URL)) {
    errors.push(`❌ FRONTEND_URL 格式錯誤: ${process.env.FRONTEND_URL}`);
  }

  // JWT_SECRET 長度檢查
  if (required.JWT_SECRET && required.JWT_SECRET.length < 32) {
    errors.push(`❌ JWT_SECRET 長度不足（至少 32 字元）`);
  }

  // 如果有錯誤，拋出異常
  if (errors.length > 0) {
    errors.forEach((error) => logger.error(error));
    logger.error("請檢查 .env 檔案或環境變數設定");
    throw new Error("環境變數驗證失敗");
  }

  // 返回型別安全的環境變數
  const config: EnvConfig = {
    SUPABASE_URL: required.SUPABASE_URL!,
    SUPABASE_ANON_KEY: required.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_KEY: required.SUPABASE_SERVICE_KEY!,
    JWT_SECRET: required.JWT_SECRET!,
    PORT: parseInt(process.env.PORT || "5000", 10),
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    FRONTEND_URL: process.env.FRONTEND_URL,
  };

  // 記錄成功訊息
  logger.info("✅ 環境變數驗證通過", {
    port: config.PORT,
    environment: config.NODE_ENV,
    hasSupabase: !!config.SUPABASE_URL,
    hasFrontendUrl: !!config.FRONTEND_URL,
  });

  return config;
};
