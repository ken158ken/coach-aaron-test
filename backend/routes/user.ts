/**
 * @fileoverview 使用者相關路由
 * 處理用戶資料、購買課程等功能
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";

const router: Router = express.Router();

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
          "user_id, username, email, display_name, phone_number, avatar_url, gender, created_at",
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

export default router;
