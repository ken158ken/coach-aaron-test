/**
 * 輸入驗證與清理中介軟體
 *
 * 防止 XSS、SQL Injection 和其他注入攻擊。
 *
 * @module middleware/sanitize
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * 危險字元的正則表達式
 *
 * 注意：帶 `g` flag 的 regex 在 `.test()` 後 `lastIndex` 不歸零，
 * 重複呼叫會產生不穩定結果。因此改用函式工廠，每次呼叫回傳全新 RegExp。
 */
const createDangerousPatterns = () => ({
  // XSS 常見模式
  xss: /<script[^>]*>[\s\S]*?<\/script>|<iframe[^>]*>|javascript:/gi,
  // SQL 注入常見模式（作為額外檢查，Supabase 已有保護）
  sql: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  // HTML 標籤（保留部分安全標籤）
  htmlTags: /<(?!\/?(b|i|u|strong|em|br|p)>)[^>]+>/gi,
});

/**
 * 清理字串值
 *
 * @param {string} value - 待清理字串
 * @returns {string} 清理後字串
 */
const sanitizeString = (value: string): string => {
  if (typeof value !== "string") return value;

  // 移除前後空白
  let cleaned = value.trim();

  // 移除 XSS 相關內容（每次建立新 regex 避免 lastIndex 問題）
  cleaned = cleaned.replace(createDangerousPatterns().xss, "");

  // 限制長度（防止 DoS）— base64 圖片可能很長，由各路由自行驗證
  if (cleaned.length > 500000) {
    cleaned = cleaned.substring(0, 500000);
  }

  return cleaned;
};

/**
 * 遞迴清理物件
 */
const sanitizeObject = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * 驗證 Email 格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 驗證手機號碼格式（台灣）
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^09\d{8}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ""));
};

/**
 * 輸入清理中介軟體
 * 注意: Express 5 中 req.query 和 req.params 是只讀的，只清理 req.body
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // 跳過頭像上傳路由（base64 資料不可被清理）
    if (req.path === "/api/user/avatar" && req.method === "POST") {
      return next();
    }

    // 清理 body（這是可寫的）
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    // Express 5 中 req.query 和 req.params 是只讀 getter，無法直接賦值
    // 改為在使用時進行清理，或在這裡遍歷清理各個屬性
    if (req.query && typeof req.query === "object") {
      for (const key of Object.keys(req.query)) {
        const value = req.query[key];
        if (typeof value === "string") {
          (req.query as Record<string, string>)[key] = sanitizeString(value);
        }
      }
    }

    next();
  } catch (error) {
    logger.error("輸入清理失敗", error as Error);
    res.status(400).json({ error: "輸入資料格式錯誤" });
  }
};

/**
 * 驗證 Email 的中介軟體
 */
export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "請提供 Email" });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Email 格式不正確" });
    return;
  }

  next();
};

/**
 * 檢測可疑請求
 *
 * 注意：僅記錄警告，不阻擋請求。
 * 使用工廠函式建立新 regex，避免全域 flag 的 lastIndex 問題。
 */
export const detectSuspiciousRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const body = JSON.stringify(req.body);
    const query = JSON.stringify(req.query);
    const path = req.path;

    // 每次建立新的 regex 實例，避免 g flag 的 lastIndex 問題
    const sqlPattern = createDangerousPatterns().sql;

    // 檢查是否包含 SQL 注入模式
    if (
      sqlPattern.test(body) ||
      sqlPattern.test(query) ||
      sqlPattern.test(path)
    ) {
      logger.warn("檢測到可疑 SQL 注入嘗試", {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
    }
  } catch (err) {
    // 偵測失敗不應阻擋正常請求
    logger.error("可疑請求偵測異常", err as Error);
  }

  next();
};
