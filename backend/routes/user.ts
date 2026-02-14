/**
 * @fileoverview 使用者相關路由
 * 處理用戶資料、購買課程、頭像上傳等功能
 */

import express, { Request, Response, Router } from "express";
import sharp from "sharp";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";

const router: Router = express.Router();

/** 頭像設定常數 */
const AVATAR_CONFIG = {
  /** 輸出尺寸 (px) */
  SIZE: 200,
  /** JPEG 畫質 (1-100) */
  QUALITY: 60,
  /** 最大上傳大小 (bytes) — 5MB */
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024,
} as const;

/**
 * 取得用戶已購買的課程列表
 * @route GET /api/user/courses
 */
router.get(
  "/courses",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("user_courses")
        .select(
          `
          *,
          course:course_id (
            course_id,
            course_title,
            course_slug,
            course_thumbnail_url,
            course_description
          )
        `,
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("access_granted_at", { ascending: false });

      if (error) throw error;

      res.json(data || []);
    } catch (err) {
      console.error("Get user courses error:", err);
      res.status(500).json({ error: "取得購買課程失敗" });
    }
  },
);

/**
 * 檢查用戶是否已購買指定課程
 * @route GET /api/user/courses/:courseId/access
 */
router.get(
  "/courses/:courseId/access",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      // 檢查是否為管理員
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_whitelist")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (adminCheck) {
        res.json({ hasAccess: true, isAdmin: true });
        return;
      }

      // 檢查是否已購買
      const { data: userCourse } = await supabaseAdmin
        .from("user_courses")
        .select("user_course_id, is_active, access_expires_at")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      if (!userCourse) {
        res.json({ hasAccess: false });
        return;
      }

      // 檢查是否過期
      const isExpired =
        userCourse.access_expires_at &&
        new Date(userCourse.access_expires_at) < new Date();

      res.json({
        hasAccess: userCourse.is_active && !isExpired,
        isExpired,
      });
    } catch (err) {
      console.error("Check course access error:", err);
      res.status(500).json({ error: "檢查課程權限失敗" });
    }
  },
);

/**
 * 取得用戶個人資料
 * @route GET /api/user/profile
 */
router.get(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .select(
          "user_id, username, email, display_name, phone_number, avatar_url, avatar_base64, gender, created_at",
        )
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        res.status(404).json({ error: "用戶不存在" });
        return;
      }

      res.json(data);
    } catch (err) {
      console.error("Get user profile error:", err);
      res.status(500).json({ error: "取得個人資料失敗" });
    }
  },
);

/**
 * 更新用戶個人資料
 * @route PUT /api/user/profile
 */
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { displayName, phoneNumber, avatarUrl, gender } = req.body;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (displayName !== undefined) updateData.display_name = displayName;
      if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
      if (gender !== undefined) updateData.gender = gender;

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("user_id", userId)
        .select(
          "user_id, username, email, display_name, phone_number, avatar_url, gender",
        )
        .single();

      if (error) throw error;

      res.json(data);
    } catch (err) {
      console.error("Update user profile error:", err);
      res.status(500).json({ error: "更新個人資料失敗" });
    }
  },
);

/**
 * 上傳/更新使用者頭像
 * 接收 base64 圖片 → 裁剪圓形 → 壓縮畫質 → 存入 DB
 *
 * @route POST /api/user/avatar
 * @body {string} image - base64 編碼的圖片資料（含或不含 data URI prefix）
 */
router.post(
  "/avatar",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { image } = req.body;
      if (!image || typeof image !== "string") {
        res.status(400).json({ error: "請提供圖片資料" });
        return;
      }

      // 移除 data URI prefix（如 "data:image/png;base64,"）
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      // 檢查大小
      if (imageBuffer.length > AVATAR_CONFIG.MAX_UPLOAD_SIZE) {
        res.status(400).json({ error: "圖片大小不可超過 5MB" });
        return;
      }

      // 取得圖片元資料
      const metadata = await sharp(imageBuffer).metadata();
      const minDim = Math.min(metadata.width || 200, metadata.height || 200);

      // 裁剪正方形 → 調整大小 → 套用圓形遮罩 → 壓縮 → 轉 base64
      const circleSize = AVATAR_CONFIG.SIZE;

      // 建立圓形 SVG 遮罩
      const circleMask = Buffer.from(
        `<svg width="${circleSize}" height="${circleSize}">
          <circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${circleSize / 2}" fill="white"/>
        </svg>`,
      );

      // 從中央裁剪正方形 → 縮放到目標尺寸 → 套用圓形遮罩
      const processedBuffer = await sharp(imageBuffer)
        .extract({
          left: Math.floor(((metadata.width || minDim) - minDim) / 2),
          top: Math.floor(((metadata.height || minDim) - minDim) / 2),
          width: minDim,
          height: minDim,
        })
        .resize(circleSize, circleSize)
        .composite([
          {
            input: circleMask,
            blend: "dest-in",
          },
        ])
        .png({ quality: AVATAR_CONFIG.QUALITY, compressionLevel: 8 })
        .toBuffer();

      // 轉為 data URI
      const avatarBase64 = `data:image/png;base64,${processedBuffer.toString("base64")}`;

      // 寫入 DB
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          avatar_base64: avatarBase64,
          avatar_url: avatarBase64,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("user_id, avatar_url, avatar_base64")
        .single();

      if (error) {
        console.error("更新頭像失敗:", error);
        throw error;
      }

      console.log(`[User] 使用者 ${userId} 頭像更新成功`);

      res.json({
        success: true,
        avatarUrl: data.avatar_base64 || data.avatar_url,
      });
    } catch (err) {
      console.error("Upload avatar error:", err);
      res.status(500).json({ error: "頭像上傳失敗" });
    }
  },
);

/**
 * 刪除使用者頭像
 *
 * @route DELETE /api/user/avatar
 */
router.delete(
  "/avatar",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          avatar_base64: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      console.log(`[User] 使用者 ${userId} 頭像已刪除`);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete avatar error:", err);
      res.status(500).json({ error: "刪除頭像失敗" });
    }
  },
);

export default router;
