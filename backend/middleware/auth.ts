/**
 * 認證中介軟體
 *
 * 提供三種認證方式：
 * 1. authenticateToken - 需登入
 * 2. requireAdmin - 需管理員權限
 * 3. optionalAuth - 可選認證
 *
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/supabase.js";

/**
 * JWT Payload 介面
 */
interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 擴展 Express Request 加入 user 和 isAdmin
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      isAdmin?: boolean;
    }
  }
}

/**
 * 驗證 JWT Token
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ error: "未登入" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      res.status(500).json({ error: "伺服器配置錯誤" });
      return;
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err: jwt.VerifyErrors | null, decoded: unknown) => {
        if (err) {
          res.status(403).json({ error: "Token 無效或已過期" });
          return;
        }
        req.user = decoded as JWTPayload;
        next();
      }
    );
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "認證失敗" });
  }
};

/**
 * 驗證管理員權限
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      res.status(401).json({ error: "未登入" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("admin_whitelist")
      .select("*")
      .eq("email", userEmail)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      res.status(403).json({ error: "無管理員權限" });
      return;
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * 可選認證 - 有登入就解析，沒有也繼續
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.token;
  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  if (!process.env.JWT_SECRET) {
    req.user = undefined;
    next();
    return;
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err: jwt.VerifyErrors | null, decoded: unknown) => {
      req.user = err ? undefined : (decoded as JWTPayload);
      next();
    }
  );
};
