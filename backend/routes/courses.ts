/**
 * @fileoverview 課程管理路由
 * 處理公開課程查詢及管理員課程 CRUD 操作
 *
 * @security 實施多層輸入驗證與消毒機制
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { UpdateCourseData } from "../types/database.js";
import {
  sanitizeComment,
  sanitizeRating,
  sanitizeId,
  sanitizeApiResponseArray,
  logSecurityEvent,
} from "../utils/sanitizer.js";
import { logger } from "../utils/logger.js";

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
 * @security 輸出內容經過消毒處理
 */
router.get(
  "/:id/reviews",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 驗證 ID 格式
      const idValidation = sanitizeId(id, "course_id");
      if (!idValidation.isValid) {
        res.status(400).json({ error: idValidation.errorMessage });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("course_reviews")
        .select(
          `
        *,
        users:user_id (display_name, avatar_url)
      `,
        )
        .eq("course_id", idValidation.numericValue)
        .eq("is_visible", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 消毒輸出內容，防止儲存型 XSS
      const sanitizedData = data
        ? sanitizeApiResponseArray(data as Record<string, unknown>[], [
            "comment",
          ])
        : [];

      res.json(sanitizedData);
    } catch (err) {
      logger.error("Get reviews error:", err);
      res.status(500).json({ error: "取得評論失敗" });
    }
  },
);

/**
 * 新增課程評論
 * @route POST /api/courses/:id/reviews
 * @security 多層輸入驗證與消毒
 * - ID 格式驗證
 * - 評分範圍驗證
 * - 評論內容 XSS/注入防護
 */
router.post(
  "/:id/reviews",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).user?.userId;
      const userIp = req.ip || req.socket.remoteAddress || "unknown";

      if (!userId) {
        res.status(401).json({ error: "未授權" });
        return;
      }

      // ===== 安全驗證層 =====

      // 1. 驗證課程 ID
      const idValidation = sanitizeId(id, "course_id");
      if (!idValidation.isValid) {
        logSecurityEvent("INVALID_COURSE_ID", {
          userId,
          ip: userIp,
          providedId: id,
          reason: idValidation.errorMessage,
        });
        res.status(400).json({ error: idValidation.errorMessage });
        return;
      }

      // 2. 驗證評分
      const ratingValidation = sanitizeRating(rating, "評分");
      if (!ratingValidation.isValid) {
        logSecurityEvent("INVALID_RATING", {
          userId,
          ip: userIp,
          courseId: idValidation.numericValue,
          providedRating: rating,
          reason: ratingValidation.errorMessage,
        });
        res.status(400).json({ error: ratingValidation.errorMessage });
        return;
      }

      // 3. 驗證並消毒評論內容（可選欄位）
      let sanitizedComment: string | null = null;
      if (comment !== undefined && comment !== null && comment !== "") {
        const commentValidation = sanitizeComment(comment, {
          maxLength: 2000,
          minLength: 0,
          allowNewlines: true,
          strictMode: true,
          fieldName: "評論內容",
        });

        if (!commentValidation.isValid) {
          // 如果偵測到潛在攻擊，記錄安全事件
          if (commentValidation.threatDetected) {
            logSecurityEvent("COMMENT_THREAT_DETECTED", {
              userId,
              ip: userIp,
              courseId: idValidation.numericValue,
              threatType: commentValidation.threatType,
              inputPreview:
                typeof comment === "string"
                  ? comment.substring(0, 100)
                  : "[non-string]",
            });
          }
          res.status(400).json({ error: commentValidation.errorMessage });
          return;
        }

        sanitizedComment = commentValidation.sanitizedValue || null;
      }

      // ===== 業務邏輯 =====

      const courseId = idValidation.numericValue;
      const validatedRating = Number(ratingValidation.sanitizedValue);

      // 檢查用戶是否已評論過此課程
      const { data: existingReview } = await supabaseAdmin
        .from("course_reviews")
        .select("review_id")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (existingReview) {
        // 更新現有評論
        const { data, error } = await supabaseAdmin
          .from("course_reviews")
          .update({
            rating: validatedRating,
            comment: sanitizedComment,
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

        logger.info("Course review updated", {
          userId,
          courseId,
          reviewId: existingReview.review_id,
        });

        res.json(data);
      } else {
        // 新增評論
        const { data, error } = await supabaseAdmin
          .from("course_reviews")
          .insert({
            course_id: courseId,
            user_id: userId,
            rating: validatedRating,
            comment: sanitizedComment,
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
        await updateCourseRatingStats(courseId);

        logger.info("Course review created", {
          userId,
          courseId,
          reviewId: (data as any)?.review_id,
        });

        res.json(data);
      }
    } catch (err) {
      logger.error("Add review error:", err);
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
        course_title,
        course_slug,
        course_description,
        course_content,
        course_video_url,
        course_thumbnail_url,
        course_level,
        category,
        keywords,
        price,
        currency,
        access_duration_days,
        status,
      } = req.body;

      const { data, error } = await supabaseAdmin
        .from("courses")
        .insert({
          course_title,
          course_slug,
          course_description,
          course_content,
          course_video_url,
          course_thumbnail_url,
          course_level: course_level || "beginner",
          course_category: category,
          course_keywords: keywords,
          price: price || 0,
          currency: currency || "TWD",
          access_duration_days,
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

      // 直接使用資料庫欄位名稱
      const allowedFields = [
        "course_title",
        "course_slug",
        "course_description",
        "course_content",
        "course_video_url",
        "course_thumbnail_url",
        "course_level",
        "course_category",
        "course_keywords",
        "category",
        "keywords",
        "price",
        "currency",
        "access_duration_days",
        "status",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          // 處理 category 和 keywords 的別名
          if (field === "category") {
            updateData.course_category = req.body[field];
          } else if (field === "keywords") {
            updateData.course_keywords = req.body[field];
          } else {
            updateData[field] = req.body[field];
          }
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
 * 檢查課程 slug 是否已存在
 * @route GET /api/courses/check-slug?slug=xxx&excludeId=xxx
 */
router.get(
  "/check-slug",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug, excludeId } = req.query;
      if (!slug || typeof slug !== "string") {
        res.status(400).json({ error: "請提供 slug 參數" });
        return;
      }

      let query = supabaseAdmin
        .from("courses")
        .select("course_id", { count: "exact", head: true })
        .eq("course_slug", slug)
        .is("deleted_at", null);

      // 編輯時排除自己
      if (excludeId && typeof excludeId === "string") {
        query = query.neq("course_id", excludeId);
      }

      const { count, error } = await query;
      if (error) throw error;

      res.json({ exists: (count ?? 0) > 0 });
    } catch (err) {
      console.error("Check course slug error:", err);
      res.status(500).json({ error: "檢查 slug 失敗" });
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
