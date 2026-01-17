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
 */
const DANGEROUS_PATTERNS = {
  // XSS 常見模式
  xss: /<script[^>]*>[\s\S]*?<\/script>|<iframe[^>]*>|javascript:/gi,
  // SQL 注入常見模式（作為額外檢查，Supabase 已有保護）
  sql: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  // HTML 標籤（保留部分安全標籤）
  htmlTags: /<(?!\/?(b|i|u|strong|em|br|p)>)[^>]+>/gi,
};

/**
 * 清理字串值
 */
const sanitizeString = (value: string): string => {
  if (typeof value !== "string") return value;

  // 移除前後空白
  let cleaned = value.trim();

  // 移除 XSS 相關內容
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.xss, "");

  // 限制長度（防止 DoS）
  if (cleaned.length > 10000) {
    cleaned = cleaned.substring(0, 10000);
  }

  return cleaned;
};

/**
 * 遞迴清理物件
 */
const sanitizeObject = (obj: any): any => {
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
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
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
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // 清理 body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // 清理 query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // 清理 params
    if (req.params) {
      req.params = sanitizeObject(req.params);
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
 * 驗證密碼強度的中介軟體（可選）
 */
export const validatePasswordStrength = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "請提供密碼" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "密碼至少需要 6 個字元" });
    return;
  }

  next();
};

/**
 * 檢測可疑請求的中介軟體
 */
export const detectSuspiciousRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const bodyString = JSON.stringify(req.body);

  // 檢測 SQL 注入嘗試
  if (DANGEROUS_PATTERNS.sql.test(bodyString)) {
    logger.warn("偵測到可疑的 SQL 注入嘗試", {
      ip: req.ip,
      path: req.path,
      body: req.body,
    });
    res.status(400).json({ error: "請求包含不允許的內容" });
    return;
  }

  next();
};
