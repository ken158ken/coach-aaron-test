/**
 * @fileoverview 使用者認證路由
 * 處理註冊、登入、登出及個人資料管理功能
 */

import express, { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { authLimiter, oauthLimiter } from "../middleware/rateLimiter.js";
import { logger } from "../utils/logger.js";
import { validateEmail } from "../middleware/sanitize.js";
import { getOAuthStatus } from "../config/oauth.js";
import { verifyExchangeToken } from "../utils/oauth.js";

const router: Router = express.Router();

/**
 * OAuth Code Exchange - 交換最小 JWT 為完整 auth token
 * @route POST /api/auth/oauth-exchange
 *
 * OAuth 回呼後，前端帶著 URL 中的短 JWT 呼叫此端點，
 * 從 DB 查詢完整使用者資料，回傳 auth token。
 */
router.post(
  "/oauth-exchange",
  oauthLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body;

      if (!code || typeof code !== "string") {
        res.status(400).json({ error: "缺少 code" });
        return;
      }

      // 驗證最小 JWT，取得 userId
      const userId = verifyExchangeToken(code);
      if (!userId) {
        res.status(401).json({ error: "code 已過期或無效，請重新登入" });
        return;
      }

      // 從資料庫查詢完整使用者資料
      const { data: user, error: dbError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .single();

      if (dbError || !user) {
        res.status(401).json({ error: "使用者不存在" });
        return;
      }

      // 檢查管理員權限
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*")
        .eq("email", user.email)
        .eq("is_active", true)
        .single();

      const isAdmin = !!adminCheck;

      // 產生正式 auth JWT（7 天）
      const authToken = jwt.sign(
        {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          sex: user.sex,
          isAdmin,
        },
        process.env.JWT_SECRET || "",
        { expiresIn: "7d" },
      );

      const cookieOptions: import("express").CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      };
      if (process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
      }
      res.cookie("token", authToken, cookieOptions);

      logger.info("OAuth exchange 成功", {
        userId: user.user_id,
        email: user.email,
      });

      res.json({
        success: true,
        token: authToken,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_base64 || user.avatar_url,
          sex: user.sex,
          isAdmin,
        },
        isAdmin,
      });
    } catch (err) {
      logger.warn("OAuth exchange 失敗", {
        error: (err as Error).message,
      });
      res.status(500).json({ error: "交換 code 時發生錯誤" });
    }
  },
);

/**
 * 取得 OAuth 啟用狀態
 * @route GET /api/auth/providers
 *
 * 前端用此端點判斷要顯示哪些社交登入按鈕
 */
router.get("/providers", (_req: Request, res: Response): void => {
  const status = getOAuthStatus();
  res.json({
    local: true,
    google: status.google,
    line: status.line,
  });
});

/**
 * 取得已登入使用者的社交帳號綁定狀態
 * @route GET /api/auth/social-accounts
 */
router.get(
  "/social-accounts",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("user_social_accounts")
        .select(
          "social_account_id, provider, provider_email, provider_display_name, provider_avatar_url, created_at, last_login_at",
        )
        .eq("user_id", req.user?.userId);

      if (error) {
        logger.error("查詢社交帳號失敗", error as unknown as Error);
        res.status(500).json({ error: "查詢失敗" });
        return;
      }

      res.json({ socialAccounts: data || [] });
    } catch (err) {
      logger.error("取得社交帳號例外", err as Error);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  },
);

/**
 * 解除社交帳號綁定
 * @route DELETE /api/auth/social-accounts/:provider
 */
router.delete(
  "/social-accounts/:provider",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = req.params.provider as string;
      const userId = req.user?.userId;

      if (!["google", "line"].includes(provider)) {
        res.status(400).json({ error: "不支援的提供者" });
        return;
      }

      // 檢查使用者是否有密碼（避免解綁後無法登入）
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("password_hash")
        .eq("user_id", userId)
        .single();

      const { data: socialAccounts } = await supabaseAdmin
        .from("user_social_accounts")
        .select("provider")
        .eq("user_id", userId);

      const hasPassword = user?.password_hash && user.password_hash.length > 0;
      const otherSocialCount =
        socialAccounts?.filter(
          (a: { provider: string }) => a.provider !== provider,
        ).length || 0;

      if (!hasPassword && otherSocialCount === 0) {
        res.status(400).json({
          error:
            "無法解除綁定：這是你唯一的登入方式。請先設定密碼後再解除綁定。",
        });
        return;
      }

      const { error } = await supabaseAdmin
        .from("user_social_accounts")
        .delete()
        .eq("user_id", userId)
        .eq("provider", provider);

      if (error) {
        logger.error("解除社交帳號綁定失敗", error as unknown as Error);
        res.status(500).json({ error: "解除綁定失敗" });
        return;
      }

      logger.info("社交帳號解除綁定", { userId, provider });
      res.json({ success: true, message: `${provider} 帳號已解除綁定` });
    } catch (err) {
      logger.error("解除綁定例外", err as Error);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  },
);

/**
 * 註冊新使用者
 * @route POST /api/auth/register
 */
router.post(
  "/register",
  authLimiter,
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, displayName, phoneNumber } = req.body;

      // 驗證必填欄位
      if (!username || !email || !password) {
        res.status(400).json({ error: "請填寫所有必填欄位" });
        return;
      }

      // 檢查 email 是否已存在
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

      if (existingUser) {
        res.status(400).json({ error: "此 Email 已被註冊" });
        return;
      }

      // 檢查 username 是否已存在
      const { data: existingUsername } = await supabaseAdmin
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (existingUsername) {
        res.status(400).json({ error: "此使用者名稱已被使用" });
        return;
      }

      // 密碼加密
      const passwordHash = await bcrypt.hash(password, 10);

      // 建立使用者
      const { data: newUser, error } = await supabaseAdmin
        .from("users")
        .insert({
          username,
          email,
          password_hash: passwordHash,
          display_name: displayName || username,
          phone_number: phoneNumber || null,
          // 註：users.sex 欄位已於 migration 025 移除，這裡不可再帶（會 42703 導致註冊失敗）
        })
        .select()
        .single();

      if (error || !newUser) {
        logger.error("註冊失敗", error as Error, { email });
        res.status(500).json({ error: "註冊失敗" });
        return;
      }

      // 為新使用者建立所有課程的售價可見性記錄（預設 false）
      try {
        const { data: allCourses } = await supabaseAdmin
          .from("courses")
          .select("course_id")
          .is("deleted_at", null);

        if (allCourses && allCourses.length > 0) {
          const rows = allCourses.map((c: { course_id: number }) => ({
            user_id: newUser.user_id,
            course_id: c.course_id,
            show_price: false,
          }));
          await supabaseAdmin
            .from("user_course_price_visibility")
            .upsert(rows, { onConflict: "user_id,course_id" });
        }
      } catch (visErr) {
        logger.error("建立售價可見性記錄失敗", visErr as Error);
      }

      // 檢查是否為管理員
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      // 產生 JWT
      const token = jwt.sign(
        {
          userId: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.display_name,
          sex: newUser.sex,
          isAdmin: !!adminCheck,
        },
        process.env.JWT_SECRET || "",
        { expiresIn: "7d" },
      );

      const cookieOptions: import("express").CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      };
      // 僅在明確設定 COOKIE_DOMAIN 時才指定 domain
      if (process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
      }
      res.cookie("token", token, cookieOptions);

      logger.info("使用者註冊成功", { userId: newUser.user_id, email });

      res.json({
        success: true,
        token,
        user: {
          userId: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.display_name,
          sex: newUser.sex,
          isAdmin: !!adminCheck,
        },
      });
    } catch (err) {
      logger.error("註冊伺服器錯誤", err as Error);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  },
);

/**
 * 使用者登入
 * @route POST /api/auth/login
 */
router.post(
  "/login",
  authLimiter,
  validateEmail,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "請填寫 Email 和密碼" });
        return;
      }

      // 查詢使用者
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .is("deleted_at", null)
        .single();

      if (error || !user) {
        logger.warn("登入失敗 - 使用者不存在", { email });
        res.status(401).json({ error: "Email 或密碼錯誤" });
        return;
      }

      // 驗證密碼
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        logger.warn("登入失敗 - 密碼錯誤", { email });
        res.status(401).json({ error: "Email 或密碼錯誤" });
        return;
      }

      // 更新最後登入時間
      await supabaseAdmin
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("user_id", user.user_id);

      // 檢查是否為管理員
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      // 產生 JWT
      const token = jwt.sign(
        {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          sex: user.sex,
          isAdmin: !!adminCheck,
        },
        process.env.JWT_SECRET || "",
        { expiresIn: "7d" },
      );

      const cookieOptions: import("express").CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      };
      if (process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
      }
      res.cookie("token", token, cookieOptions);

      logger.info("使用者登入成功", { userId: user.user_id, email });

      res.json({
        success: true,
        token,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_base64 || user.avatar_url,
          sex: user.sex,
          isAdmin: !!adminCheck,
        },
        isAdmin: !!adminCheck,
      });
    } catch (err) {
      logger.error("登入伺服器錯誤", err as Error);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  },
);

/**
 * 使用者登出
 * @route POST /api/auth/logout
 */
router.post("/logout", (req: Request, res: Response): void => {
  logger.info("使用者登出");
  const clearOptions: import("express").CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
    path: "/",
  };
  if (process.env.COOKIE_DOMAIN) {
    clearOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.clearCookie("token", clearOptions);
  res.json({ success: true });
});

/**
 * 取得當前使用者資訊
 * @route GET /api/auth/me
 */
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select(
          "user_id, username, email, display_name, avatar_url, avatar_base64, phone_number, created_at",
        )
        .eq("user_id", req.user?.userId)
        .single();

      if (error || !user) {
        res.status(404).json({ error: "使用者不存在" });
        return;
      }

      // 檢查是否為管理員
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*")
        .eq("email", user.email)
        .eq("is_active", true)
        .single();

      const isAdmin = !!adminCheck;

      // 重新簽發 token（讓前端頁面重整後可恢復 Bearer token）
      const freshToken = jwt.sign(
        {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          isAdmin,
        },
        process.env.JWT_SECRET || "",
        { expiresIn: "7d" },
      );

      res.json({
        token: freshToken,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_base64 || user.avatar_url,
          phoneNumber: user.phone_number,
          isAdmin,
          createdAt: user.created_at,
        },
        isAdmin,
      });
    } catch (err) {
      logger.error("取得使用者資訊失敗", err as Error, {
        userId: req.user?.userId,
      });
      res.status(500).json({ error: "伺服器錯誤" });
    }
  },
);

/**
 * 更新個人資料
 * @route PUT /api/auth/profile
 */
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { displayName, avatarUrl, phoneNumber } = req.body;

      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          phone_number: phoneNumber,
        })
        .eq("user_id", req.user?.userId)
        .select()
        .single();

      if (error) {
        logger.error("更新個人資料失敗", error as Error, {
          userId: req.user?.userId,
        });
        res.status(500).json({ error: "更新失敗" });
        return;
      }

      logger.info("更新個人資料成功", { userId: req.user?.userId });
      res.json({ success: true, user: data });
    } catch (err) {
      logger.error("更新個人資料伺服器錯誤", err as Error, {
        userId: req.user?.userId,
      });
      res.status(500).json({ error: "伺服器錯誤" });
    }
  },
);

export default router;
