/**
 * @fileoverview 課程管理路由
 * 處理公開課程查詢及管理員課程 CRUD 操作
 *
 * @security 實施多層輸入驗證與消毒機制
 */

import express, { Request, Response, Router } from "express";
import sharp from "sharp";
import { supabaseAdmin } from "../config/supabase.js";
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";
import { UpdateCourseData } from "../types/database.js";
import {
  sanitizeComment,
  sanitizeRating,
  sanitizeId,
  sanitizeApiResponseArray,
  logSecurityEvent,
} from "../utils/sanitizer.js";
import { logger } from "../utils/logger.js";

const COURSE_IMAGE_BUCKET = "course-images";
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/";

const router: Router = express.Router();

// ===== 公開 API =====

/**
 * 取得所有已發布課程
 * 已登入使用者會附帶各課程的售價可見性
 * @route GET /api/courses
 */
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("courses")
        .select("*")
        .eq("status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 若已登入，附加該使用者的售價可見性
      const userId = req.user?.userId ? Number(req.user.userId) : null;
      if (userId && data) {
        const { data: vis } = await supabaseAdmin
          .from("user_course_price_visibility")
          .select("course_id, show_price")
          .eq("user_id", userId);

        const visMap = new Map(
          (vis || []).map((v: { course_id: number; show_price: boolean }) => [
            v.course_id,
            v.show_price,
          ]),
        );

        const enriched = data.map((c: Record<string, unknown>) => ({
          ...c,
          show_price: visMap.get(c.course_id as number) ?? false,
        }));
        res.json(enriched);
        return;
      }

      res.json(data);
    } catch (err) {
      console.error("Get courses error:", err);
      res.status(500).json({ error: "取得課程失敗" });
    }
  },
);

/**
 * 取得單一課程
 * 已登入使用者會附帶售價可見性
 * @route GET /api/courses/:id
 */
router.get(
  "/:id",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
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

      // 若已登入，附加售價可見性
      const userId = req.user?.userId ? Number(req.user.userId) : null;
      if (userId) {
        const { data: vis } = await supabaseAdmin
          .from("user_course_price_visibility")
          .select("show_price")
          .eq("user_id", userId)
          .eq("course_id", id)
          .single();

        res.json({ ...data, show_price: vis?.show_price ?? false });
        return;
      }

      res.json(data);
    } catch (err) {
      console.error("Get course error:", err);
      res.status(500).json({ error: "取得課程失敗" });
    }
  },
);

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
        course_banner_url,
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
          course_banner_url,
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

      // 為所有現存使用者建立售價可見性記錄（預設 false）
      try {
        const { data: allUsers } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .is("deleted_at", null);

        if (allUsers && allUsers.length > 0 && data?.course_id) {
          const rows = allUsers.map((u: { user_id: number }) => ({
            user_id: u.user_id,
            course_id: data.course_id,
            show_price: false,
          }));
          await supabaseAdmin
            .from("user_course_price_visibility")
            .upsert(rows, { onConflict: "user_id,course_id" });
        }
      } catch (visErr) {
        logger.error("建立課程售價可見性記錄失敗", visErr as Error);
      }

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
        "course_banner_url",
        "course_level",
        "course_category",
        "course_keywords",
        "category",
        "keywords",
        "price",
        "currency",
        "access_duration_days",
        "status",
        // SEO 專用欄位（032 migration；NULL 時前端 fallback 至 course_* 文案）
        "seo_title",
        "seo_description",
        "seo_keywords",
        "seo_title_en",
        "seo_description_en",
        "seo_keywords_en",
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

/**
 * 上傳課程圖片（封面/Banner）— base64 → WebP → Supabase Storage
 * @route POST /api/courses/upload-image
 * body: { image: string }  // "data:image/...;base64,..."
 * Bucket: course-images（需在 Supabase 後台建立，設為 public）
 */
router.post(
  "/upload-image",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { image } = req.body as { image?: string };
      if (!image || !image.startsWith("data:image/")) {
        res.status(400).json({ error: "請提供有效的圖片 (base64 data URL)" });
        return;
      }

      const base64 = image.replace(/^data:image\/\w+;base64,/, "");
      const inputBuffer = Buffer.from(base64, "base64");

      const webpBuffer = await sharp(inputBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const filename = `course_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(COURSE_IMAGE_BUCKET)
        .upload(filename, webpBuffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const { data } = supabaseAdmin.storage
        .from(COURSE_IMAGE_BUCKET)
        .getPublicUrl(filename);

      res.json({ url: data.publicUrl });
    } catch (err) {
      logger.error("上傳課程圖片失敗", err as Error);
      res.status(500).json({ error: "上傳圖片失敗" });
    }
  },
);

/**
 * 檢查圖片 URL 是否可存取（僅允許 Cloudinary）
 * @route POST /api/courses/check-image-url
 * body: { url: string }
 * response: { ok: boolean, error?: string }
 */
router.post(
  "/check-image-url",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body as { url?: string };
      if (!url) {
        res.status(400).json({ ok: false, error: "請提供圖片網址" });
        return;
      }
      if (!url.startsWith(CLOUDINARY_PREFIX)) {
        res.status(400).json({
          ok: false,
          error: `圖片網址必須以 ${CLOUDINARY_PREFIX} 開頭`,
        });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const resp = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (resp.ok) {
          res.json({ ok: true });
        } else {
          res.json({
            ok: false,
            error: `圖片無法存取（HTTP ${resp.status}）`,
          });
        }
      } catch {
        clearTimeout(timeout);
        res.json({ ok: false, error: "圖片網址無法連線，請確認連結是否正確" });
      }
    } catch (err) {
      logger.error("檢查圖片 URL 失敗", err as Error);
      res.status(500).json({ ok: false, error: "伺服器錯誤" });
    }
  },
);

export default router;
