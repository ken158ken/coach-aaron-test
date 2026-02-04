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

/**
 * 新增課程評論
 * @route POST /api/courses/:id/reviews
 */
router.post(
  "/:id/reviews",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      // 驗證評分範圍
      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ error: "評分必須在 1-5 之間" });
        return;
      }

      // 檢查用戶是否已評論過此課程
      const { data: existingReview } = await supabaseAdmin
        .from("course_reviews")
        .select("review_id")
        .eq("course_id", id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (existingReview) {
        // 更新現有評論
        const { data, error } = await supabaseAdmin
          .from("course_reviews")
          .update({
            rating,
            comment: comment || null,
            updated_at: new Date().toISOString(),
          })
          .eq("review_id", existingReview.review_id)
          .select(
            `
            *,
            users:user_id (display_name, avatar_url)
          `,
          )
          .single();

        if (error) throw error;
        res.json(data);
      } else {
        // 新增評論
        const { data, error } = await supabaseAdmin
          .from("course_reviews")
          .insert({
            course_id: Number(id),
            user_id: userId,
            rating,
            comment: comment || null,
            is_visible: true,
          })
          .select(
            `
            *,
            users:user_id (display_name, avatar_url)
          `,
          )
          .single();

        if (error) throw error;

        // 更新課程評分統計
        await updateCourseRatingStats(Number(id));

        res.json(data);
      }
    } catch (err) {
      console.error("Add review error:", err);
      res.status(500).json({ error: "新增評論失敗" });
    }
  },
);

/**
 * 更新課程評分統計
 * @param courseId 課程 ID
 */
async function updateCourseRatingStats(courseId: number): Promise<void> {
  try {
    // 計算平均評分和評論數
    const { data: reviews } = await supabaseAdmin
      .from("course_reviews")
      .select("rating")
      .eq("course_id", courseId)
      .eq("is_visible", true)
      .is("deleted_at", null);

    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await supabaseAdmin
        .from("courses")
        .update({
          rating_average: Math.round(avgRating * 10) / 10,
          rating_count: reviews.length,
        })
        .eq("course_id", courseId);
    }
  } catch (err) {
    console.error("Update course rating stats error:", err);
  }
}

// ===== 管理員 API =====

/**
 * 取得所有課程（含草稿、封存）
 * @route GET /api/courses/admin/all
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
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: Partial<Record<string, unknown>> = {};

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
          updateData[dbFields[index]] = req.body[field];
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
