/**
 * Rate Limiting 中介軟體
 *
 * 為 API 端點提供速率限制，防止濫用。
 * 適配 Vercel Serverless 環境（基於記憶體的簡單實作）。
 *
 * 注意：在 Serverless 環境中，記憶體不共享。
 * 生產環境建議使用 Redis (如 Upstash) 實現分散式 rate limiting。
 *
 * @module middleware/rateLimiter
 */

import { Request, Response, NextFunction } from "express";

/**
 * 簡單的記憶體儲存（僅適用於單一實例）
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * 清理過期記錄
 */
const cleanup = (): void => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key]?.resetTime < now) {
      delete store[key];
    }
  });
};

// 每分鐘清理一次
setInterval(cleanup, 60000);

/**
 * 建立 Rate Limiter 中介軟體
 *
 * @param windowMs - 時間窗口（毫秒）
 * @param max - 最大請求次數
 * @param message - 超過限制時的訊息
 * @returns Express 中介軟體函數
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string = "請求次數過多，請稍後再試",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 使用 IP 作為識別
    const identifier = req.ip || req.socket.remoteAddress || "unknown";
    const key = `ratelimit:${identifier}`;
    const now = Date.now();

    // 初始化或取得現有記錄
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    // 增加計數
    store[key].count++;

    // 檢查是否超過限制
    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", store[key].resetTime.toString());

      res.status(429).json({
        error: message,
        retryAfter: retryAfter,
      });
      return;
    }

    // 設定 Rate Limit 標頭
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", (max - store[key].count).toString());
    res.setHeader("X-RateLimit-Reset", store[key].resetTime.toString());

    next();
  };
};

/**
 * 認證端點的 Rate Limiter（較嚴格）
 * 15 分鐘內最多 5 次嘗試
 */
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 分鐘
  5,
  "登入嘗試次數過多，請 15 分鐘後再試",
);

/**
 * 一般 API 的 Rate Limiter
 * 15 分鐘內最多 100 次請求
 */
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 分鐘
  100,
  "API 請求次數過多，請稍後再試",
);

/**
 * 嚴格的 Rate Limiter（用於敏感操作）
 * 1 分鐘內最多 3 次請求
 */
export const strictLimiter = createRateLimiter(
  60 * 1000, // 1 分鐘
  3,
  "操作過於頻繁，請稍後再試",
);
