/**
 * @fileoverview 課程管理路由
 * 處理公開課程查詢及管理員課程 CRUD 操作
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { UpdateCourseData } from "../types/database.js";

const router: Router = express.Router();

// ===== 公開 API =====

/**
 * 取得所有已發布課程
 * @route GET /api/courses
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 已發布課程列表
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get courses error:", err);
    res.status(500).json({ error: "取得課程失敗" });
  }
});

/**
 * 取得單一課程
 * @route GET /api/courses/:id
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 課程詳細資訊
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("course_id", id)
      .eq("status", "published")
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "課程不存在" });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error("Get course error:", err);
    res.status(500).json({ error: "取得課程失敗" });
  }
});

/**
 * 取得課程評論
 * @route GET /api/courses/:id/reviews
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 課程評論列表
 */
router.get(
  "/:id/reviews",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { data, error } = await supabaseAdmin
        .from("course_reviews")
        .select(
          `
        *,
        users:user_id (display_name, avatar_url)
      `,
        )
        .eq("course_id", id)
        .eq("is_visible", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Get reviews error:", err);
      res.status(500).json({ error: "取得評論失敗" });
    }
  },
);

// ===== 管理員 API =====

/**
 * 取得所有課程（含草稿、封存）
 * @route GET /api/courses/admin/all
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 所有課程列表
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("courses")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Get all courses error:", err);
      res.status(500).json({ error: "取得課程失敗" });
    }
  },
);

/**
 * 新增課程
 * @route POST /api/courses
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 新建立的課程資訊
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        courseTitle,
        courseSlug,
        courseDescription,
        courseContent,
        courseVideoUrl,
        courseThumbnailUrl,
        courseKeywords,
        courseCategory,
        price,
        currency,
        accessDurationDays,
        status,
      } = req.body;

      const { data, error } = await supabaseAdmin
        .from("courses")
        .insert({
          course_title: courseTitle,
          course_slug: courseSlug,
          course_description: courseDescription,
          course_content: courseContent,
          course_video_url: courseVideoUrl,
          course_thumbnail_url: courseThumbnailUrl,
          course_keywords: courseKeywords,
          course_category: courseCategory,
          price: price || 0,
          currency: currency || "TWD",
          access_duration_days: accessDurationDays,
          status: status || "draft",
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create course error:", err);
      res.status(500).json({ error: "新增課程失敗" });
    }
  },
);

/**
 * 更新課程
 * @route PUT /api/courses/:id
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 更新後的課程資訊
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: Partial<Record<keyof UpdateCourseData, any>> = {};

      const fields = [
        "courseTitle",
        "courseSlug",
        "courseDescription",
        "courseContent",
        "courseVideoUrl",
        "courseThumbnailUrl",
        "courseKeywords",
        "courseCategory",
        "price",
        "currency",
        "accessDurationDays",
        "status",
      ];

      const dbFields = [
        "course_title",
        "course_slug",
        "course_description",
        "course_content",
        "course_video_url",
        "course_thumbnail_url",
        "course_keywords",
        "course_category",
        "price",
        "currency",
        "access_duration_days",
        "status",
      ];

      fields.forEach((field, index) => {
        if (req.body[field] !== undefined) {
          updateData[dbFields[index] as keyof UpdateCourseData] =
            req.body[field];
        }
      });

      const { data, error } = await supabaseAdmin
        .from("courses")
        .update(updateData)
        .eq("course_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update course error:", err);
      res.status(500).json({ error: "更新課程失敗" });
    }
  },
);

/**
 * 刪除課程（軟刪除）
 * @route DELETE /api/courses/:id
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 刪除結果
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("courses")
        .update({ deleted_at: new Date().toISOString() })
        .eq("course_id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete course error:", err);
      res.status(500).json({ error: "刪除課程失敗" });
    }
  },
);

export default router;
