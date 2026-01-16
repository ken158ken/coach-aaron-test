/**
 * @fileoverview 使用者認證路由
 * 處理註冊、登入、登出及個人資料管理功能
 */

import express, { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * 註冊新使用者
 * @route POST /api/auth/register
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 註冊結果及 JWT Token
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
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
        sex: false,
      })
      .select()
      .single();

    if (error || !newUser) {
      console.error("Register error:", error);
      res.status(500).json({ error: "註冊失敗" });
      return;
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
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
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
    console.error("Register error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

/**
 * 使用者登入
 * @route POST /api/auth/login
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 登入結果及 JWT Token
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
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
      res.status(401).json({ error: "Email 或密碼錯誤" });
      return;
    }

    // 驗證密碼
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
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
        avatarUrl: user.avatar_url,
        sex: user.sex,
        isAdmin: !!adminCheck,
      },
      process.env.JWT_SECRET || "",
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        sex: user.sex,
        isAdmin: !!adminCheck,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

/**
 * 使用者登出
 * @route POST /api/auth/logout
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {void} 清除 Cookie 並回傳成功訊息
 */
router.post("/logout", (req: Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ success: true });
});

/**
 * 取得當前使用者資訊
 * @route GET /api/auth/me
 * @param {Request} req - Express 請求物件（含驗證 token）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 當前使用者資訊
 */
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select(
          "user_id, username, email, display_name, avatar_url, sex, phone_number, created_at"
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

      res.json({
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          phoneNumber: user.phone_number,
          sex: user.sex,
          isAdmin: !!adminCheck,
          createdAt: user.created_at,
        },
      });
    } catch (err) {
      console.error("Get me error:", err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  }
);

/**
 * 更新個人資料
 * @route PUT /api/auth/profile
 * @param {Request} req - Express 請求物件（含驗證 token）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 更新後的使用者資訊
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
        res.status(500).json({ error: "更新失敗" });
        return;
      }

      res.json({ success: true, user: data });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  }
);

export default router;
