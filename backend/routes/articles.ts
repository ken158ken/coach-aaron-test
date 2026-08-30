/**
 * @fileoverview 文章管理路由
 * 處理公開文章查詢、文章評分、留言及管理員文章 CRUD 操作
 *
 * @security 實施多層輸入驗證與消毒機制
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import {
  sanitizeComment,
  sanitizeRating,
  sanitizeId,
  sanitizeApiResponse,
  sanitizeApiResponseArray,
  logSecurityEvent,
} from "../utils/sanitizer.js";
import { isAllowedImageUrl, imageUrlErrorMessage } from "../utils/imageUrl.js";
import { sanitizeSearchQuery } from "../utils/sanitizer.js";
import {
  finalizeHtmlImages,
  finalizeImageUrl,
  replaceCleanup,
  replaceHtmlCleanup,
} from "../utils/imageStorage.js";

const router: Router = express.Router();

// ===== 公開 API =====

/**
 * 取得所有已發布文章
 * @route GET /api/articles
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, category, featured } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 先嘗試簡單查詢，不使用 join（避免外鍵關係問題）
    let query = supabaseAdmin
      .from("articles")
      .select(
        `
        article_id,
        author_id,
        article_title,
        article_title_en,
        article_slug,
        article_description,
        article_description_en,
        article_thumbnail_url,
        article_category,
        article_category_en,
        view_count,
        rating_average,
        rating_count,
        comment_count,
        is_featured,
        published_at,
        created_at
      `,
        { count: "exact" },
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (category) {
      query = query.eq("article_category", category);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Articles query error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw error;
    }

    res.json({
      articles: data || [],
      total: count || 0,
      page: Number(page),
      totalPages: Math.ceil((count || 0) / Number(limit)),
    });
  } catch (err) {
    const error = err as { code?: string; message?: string; details?: string };
    logger.error("Get articles error:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    res.status(500).json({ error: "取得文章失敗" });
  }
});

/**
 * 取得單一文章（依 slug 或 id）
 * @route GET /api/articles/:identifier
 */
router.get(
  "/:identifier",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const identifier = req.params.identifier as string;

      // 判斷是 id 還是 slug
      const isNumeric = /^\d+$/.test(identifier);
      const column = isNumeric ? "article_id" : "article_slug";

      const { data, error } = await supabaseAdmin
        .from("articles")
        .select(
          `
        *,
        users:author_id (display_name, avatar_url)
      `,
        )
        .eq(column, identifier)
        .eq("status", "published")
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        res.status(404).json({ error: "文章不存在" });
        return;
      }

      // 增加瀏覽次數
      await supabaseAdmin
        .from("articles")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("article_id", data.article_id);

      res.json(data);
    } catch (err) {
      logger.error("Get article error:", err);
      res.status(500).json({ error: "取得文章失敗" });
    }
  },
);

/**
 * 取得文章評分
 * @route GET /api/articles/:id/ratings
 */
router.get(
  "/:id/ratings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from("article_ratings")
        .select(
          `
        *,
        users:user_id (display_name, avatar_url)
      `,
        )
        .eq("article_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      logger.error("Get article ratings error:", err);
      res.status(500).json({ error: "取得評分失敗" });
    }
  },
);

/**
 * 取得文章留言
 * @route GET /api/articles/:id/comments
 * @security 輸出內容經過消毒處理
 */
router.get(
  "/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 驗證 ID 格式
      const idValidation = sanitizeId(id, "article_id");
      if (!idValidation.isValid) {
        res.status(400).json({ error: idValidation.errorMessage });
        return;
      }

      const articleId = idValidation.numericValue;

      // 取得頂層留言（不含回覆）
      const { data, error } = await supabaseAdmin
        .from("article_comments")
        .select(
          `
        *,
        users:user_id (display_name, avatar_url)
      `,
        )
        .eq("article_id", articleId)
        .eq("is_visible", true)
        .is("parent_comment_id", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 取得所有回覆
      const { data: replies, error: repliesError } = await supabaseAdmin
        .from("article_comments")
        .select(
          `
        *,
        users:user_id (display_name, avatar_url)
      `,
        )
        .eq("article_id", articleId)
        .eq("is_visible", true)
        .not("parent_comment_id", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;

      // 消毒回覆內容
      const sanitizedReplies = replies
        ? sanitizeApiResponseArray(replies as Record<string, unknown>[], [
            "content",
          ])
        : [];

      // 組合留言和回覆，並消毒內容
      const commentsWithReplies = data?.map((comment) => {
        const sanitizedComment = sanitizeApiResponse(
          comment as Record<string, unknown>,
          ["content"],
        );
        return {
          ...sanitizedComment,
          replies:
            sanitizedReplies.filter(
              (r: Record<string, unknown>) =>
                r.parent_comment_id === comment.comment_id,
            ) || [],
        };
      });

      res.json(commentsWithReplies);
    } catch (err) {
      logger.error("Get article comments error:", err);
      res.status(500).json({ error: "取得留言失敗" });
    }
  },
);

// ===== 需登入的 API =====

/**
 * 新增文章評分
 * @route POST /api/articles/:id/ratings
 * @security 多層輸入驗證
 */
router.post(
  "/:id/ratings",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = (req as Request & { user?: { userId: number } }).user
        ?.userId;
      const userIp = req.ip || req.socket.remoteAddress || "unknown";

      if (!userId) {
        res.status(401).json({ error: "請先登入" });
        return;
      }

      // ===== 安全驗證層 =====

      // 1. 驗證文章 ID
      const idValidation = sanitizeId(id, "article_id");
      if (!idValidation.isValid) {
        logSecurityEvent("INVALID_ARTICLE_ID", {
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
          articleId: idValidation.numericValue,
          providedRating: rating,
          reason: ratingValidation.errorMessage,
        });
        res.status(400).json({ error: ratingValidation.errorMessage });
        return;
      }

      const articleId = idValidation.numericValue;
      const validatedRating = Number(ratingValidation.sanitizedValue);

      // 使用 upsert 來處理新增或更新
      const { data, error } = await supabaseAdmin
        .from("article_ratings")
        .upsert(
          {
            article_id: articleId,
            user_id: userId,
            rating: validatedRating,
          },
          { onConflict: "article_id,user_id" },
        )
        .select()
        .single();

      if (error) throw error;

      // 更新文章平均分和評分數
      await updateArticleRatingStats(articleId);

      logger.info("Article rating updated", {
        userId,
        articleId,
        rating: validatedRating,
      });

      res.json(data);
    } catch (err) {
      logger.error("Create article rating error:", err);
      res.status(500).json({ error: "評分失敗" });
    }
  },
);

/**
 * 新增文章留言
 * @route POST /api/articles/:id/comments
 * @security 多層輸入驗證與消毒
 * - ID 格式驗證
 * - 留言內容 XSS/注入防護
 * - 父留言 ID 驗證
 */
router.post(
  "/:id/comments",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = (req as Request & { user?: { userId: number } }).user
        ?.userId;
      const userIp = req.ip || req.socket.remoteAddress || "unknown";

      if (!userId) {
        res.status(401).json({ error: "請先登入" });
        return;
      }

      // ===== 安全驗證層 =====

      // 1. 驗證文章 ID
      const idValidation = sanitizeId(id, "article_id");
      if (!idValidation.isValid) {
        logSecurityEvent("INVALID_ARTICLE_ID", {
          userId,
          ip: userIp,
          providedId: id,
          reason: idValidation.errorMessage,
        });
        res.status(400).json({ error: idValidation.errorMessage });
        return;
      }

      // 2. 驗證父留言 ID（如果有提供）
      let validatedParentId: number | null = null;
      if (parentCommentId !== undefined && parentCommentId !== null) {
        const parentIdValidation = sanitizeId(
          parentCommentId,
          "parent_comment_id",
        );
        if (!parentIdValidation.isValid) {
          logSecurityEvent("INVALID_PARENT_COMMENT_ID", {
            userId,
            ip: userIp,
            articleId: idValidation.numericValue,
            providedParentId: parentCommentId,
            reason: parentIdValidation.errorMessage,
          });
          res.status(400).json({ error: parentIdValidation.errorMessage });
          return;
        }
        validatedParentId = parentIdValidation.numericValue;
      }

      // 3. 驗證並消毒留言內容
      const contentValidation = sanitizeComment(content, {
        maxLength: 2000,
        minLength: 1,
        allowNewlines: true,
        strictMode: true,
        fieldName: "留言內容",
      });

      if (!contentValidation.isValid) {
        // 如果偵測到潛在攻擊，記錄安全事件
        if (contentValidation.threatDetected) {
          logSecurityEvent("COMMENT_THREAT_DETECTED", {
            userId,
            ip: userIp,
            articleId: idValidation.numericValue,
            threatType: contentValidation.threatType,
            inputPreview:
              typeof content === "string"
                ? content.substring(0, 100)
                : "[non-string]",
          });
        }
        res.status(400).json({ error: contentValidation.errorMessage });
        return;
      }

      // ===== 業務邏輯 =====

      const articleId = idValidation.numericValue;
      const sanitizedContent = contentValidation.sanitizedValue;

      const { data, error } = await supabaseAdmin
        .from("article_comments")
        .insert({
          article_id: articleId,
          user_id: userId,
          parent_comment_id: validatedParentId,
          content: sanitizedContent,
        })
        .select(
          `
        *,
        users:user_id (display_name, avatar_url)
      `,
        )
        .single();

      if (error) throw error;

      // 更新文章留言數
      await updateArticleCommentCount(articleId);

      logger.info("Article comment created", {
        userId,
        articleId,
        commentId: (data as any)?.comment_id,
        isReply: validatedParentId !== null,
      });

      res.json(data);
    } catch (err) {
      logger.error("Create article comment error:", err);
      res.status(500).json({ error: "留言失敗" });
    }
  },
);

// ===== 管理員 API =====

/**
 * 取得所有文章（管理員）
 * @route GET /api/articles/admin/all
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // 簡化查詢，不使用 join（避免外鍵關係問題）
      let query = supabaseAdmin
        .from("articles")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const safeSearch = sanitizeSearchQuery(search);
      if (safeSearch) {
        query = query.or(
          `article_title.ilike.%${safeSearch}%,article_description.ilike.%${safeSearch}%`,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error("Admin articles query error:", {
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      res.json({
        articles: data || [],
        total: count || 0,
        page: Number(page),
        totalPages: Math.ceil((count || 0) / Number(limit)),
      });
    } catch (err) {
      const error = err as { code?: string; message?: string };
      logger.error("Get all articles error:", {
        code: error.code,
        message: error.message,
      });
      res.status(500).json({ error: "取得文章失敗" });
    }
  },
);

/**
 * 建立文章（管理員）
 * @route POST /api/articles
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        slug,
        description,
        content,
        thumbnailUrl,
        bannerUrl,
        keywords,
        category,
        status,
        isFeatured,
      } = req.body;
      const userId = (req as Request & { user?: { userId: number } }).user
        ?.userId;

      if (!title) {
        res.status(400).json({ error: "標題為必填" });
        return;
      }
      if (!isAllowedImageUrl(thumbnailUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("文章封面") });
        return;
      }
      if (!isAllowedImageUrl(bannerUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("文章橫幅") });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("articles")
        .insert({
          author_id: userId,
          article_title: title,
          article_slug: slug || generateSlug(title),
          article_description: description,
          article_content: content,
          article_thumbnail_url: thumbnailUrl,
          article_banner_url: bannerUrl,
          article_keywords: keywords,
          article_category: category,
          status: status || "draft",
          is_featured: isFeatured || false,
          published_at:
            status === "published" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // 拿到 article_id 後，把封面／橫幅／內文插圖從 temp 搬到 `{article_id}/`
      if (data?.article_id) {
        try {
          const finalized: Record<string, unknown> = {};

          const cover = await finalizeImageUrl({
            entity: "article",
            entityKey: data.article_id,
            url: data.article_thumbnail_url as string | null,
            kind: "cover",
          });
          if (cover !== data.article_thumbnail_url) {
            finalized.article_thumbnail_url = cover;
          }

          const banner = await finalizeImageUrl({
            entity: "article",
            entityKey: data.article_id,
            url: data.article_banner_url as string | null,
            kind: "banner",
          });
          if (banner !== data.article_banner_url) {
            finalized.article_banner_url = banner;
          }

          const html = await finalizeHtmlImages({
            entity: "article",
            entityKey: data.article_id,
            html: data.article_content as string | null,
          });
          if (html !== data.article_content) finalized.article_content = html;

          if (Object.keys(finalized).length > 0) {
            await supabaseAdmin
              .from("articles")
              .update(finalized)
              .eq("article_id", data.article_id);
            Object.assign(data, finalized);
          }
        } catch (imgErr) {
          logger.error("文章圖片 finalize 失敗", imgErr, {
            articleId: data.article_id,
          });
        }
      }

      res.json(data);
    } catch (err) {
      logger.error("Create article error:", err);
      res.status(500).json({ error: "建立文章失敗" });
    }
  },
);

/**
 * 更新文章（管理員）
 * @route PUT /api/articles/:id
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        description,
        content,
        thumbnailUrl,
        bannerUrl,
        keywords,
        category,
        status,
        isFeatured,
      } = req.body;

      if (thumbnailUrl !== undefined && !isAllowedImageUrl(thumbnailUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("文章封面") });
        return;
      }
      if (bannerUrl !== undefined && !isAllowedImageUrl(bannerUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("文章橫幅") });
        return;
      }

      // 取得現有文章狀態 + 舊圖片值（更新成功後才拿來刪舊檔）
      const { data: existing } = await supabaseAdmin
        .from("articles")
        .select(
          "status, published_at, article_thumbnail_url, article_banner_url, article_content",
        )
        .eq("article_id", id)
        .single();

      const updateData: Record<string, unknown> = {};

      if (title !== undefined) updateData.article_title = title;
      if (slug !== undefined) updateData.article_slug = slug;
      if (description !== undefined)
        updateData.article_description = description;
      if (content !== undefined) {
        updateData.article_content = await finalizeHtmlImages({
          entity: "article",
          entityKey: String(id),
          html: content,
        });
      }
      if (thumbnailUrl !== undefined) {
        updateData.article_thumbnail_url = await finalizeImageUrl({
          entity: "article",
          entityKey: String(id),
          url: thumbnailUrl,
          kind: "cover",
        });
      }
      if (bannerUrl !== undefined) {
        updateData.article_banner_url = await finalizeImageUrl({
          entity: "article",
          entityKey: String(id),
          url: bannerUrl,
          kind: "banner",
        });
      }
      if (keywords !== undefined) updateData.article_keywords = keywords;
      if (category !== undefined) updateData.article_category = category;
      if (status !== undefined) updateData.status = status;
      if (isFeatured !== undefined) updateData.is_featured = isFeatured;

      // 如果狀態從非發布變為發布，設定發布時間
      if (
        status === "published" &&
        existing?.status !== "published" &&
        !existing?.published_at
      ) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from("articles")
        .update(updateData)
        .eq("article_id", id)
        .select()
        .single();

      if (error) throw error;

      // DB 更新成功才刪舊檔（含內文被移除的插圖）
      try {
        if (updateData.article_thumbnail_url !== undefined) {
          await replaceCleanup(
            existing?.article_thumbnail_url,
            updateData.article_thumbnail_url,
          );
        }
        if (updateData.article_banner_url !== undefined) {
          await replaceCleanup(
            existing?.article_banner_url,
            updateData.article_banner_url,
          );
        }
        if (updateData.article_content !== undefined) {
          await replaceHtmlCleanup(
            existing?.article_content,
            updateData.article_content,
          );
        }
      } catch (imgErr) {
        // 舊檔沒刪掉不影響資料正確性，cron 孤兒掃描會補刀
        logger.error("文章舊圖清理失敗", imgErr, { articleId: id });
      }

      res.json(data);
    } catch (err) {
      logger.error("Update article error:", err);
      res.status(500).json({ error: "更新文章失敗" });
    }
  },
);

/**
 * 刪除文章（軟刪除，管理員）
 * @route DELETE /api/articles/:id
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("articles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("article_id", id);

      if (error) throw error;
      res.json({ message: "文章已刪除" });
    } catch (err) {
      logger.error("Delete article error:", err);
      res.status(500).json({ error: "刪除文章失敗" });
    }
  },
);

/**
 * 管理留言可見性（管理員）
 * @route PUT /api/articles/comments/:commentId/visibility
 */
router.put(
  "/comments/:commentId/visibility",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params;
      const { isVisible } = req.body;

      const { data, error } = await supabaseAdmin
        .from("article_comments")
        .update({ is_visible: isVisible })
        .eq("comment_id", commentId)
        .select()
        .single();

      if (error) throw error;

      // 更新文章留言數
      if (data?.article_id) {
        await updateArticleCommentCount(data.article_id);
      }

      res.json(data);
    } catch (err) {
      logger.error("Update comment visibility error:", err);
      res.status(500).json({ error: "更新留言失敗" });
    }
  },
);

// ===== 輔助函數 =====

/**
 * 檢查文章 slug 是否已存在
 * @route GET /api/articles/check-slug?slug=xxx&excludeId=xxx
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
        .from("articles")
        .select("article_id", { count: "exact", head: true })
        .eq("article_slug", slug)
        .is("deleted_at", null);

      // 編輯時排除自己
      if (excludeId && typeof excludeId === "string") {
        query = query.neq("article_id", excludeId);
      }

      const { count, error } = await query;
      if (error) throw error;

      res.json({ exists: (count ?? 0) > 0 });
    } catch (err) {
      logger.error("Check slug error:", err);
      res.status(500).json({ error: "檢查 slug 失敗" });
    }
  },
);

/**
 * 更新文章評分統計
 */
async function updateArticleRatingStats(articleId: number): Promise<void> {
  const { data } = await supabaseAdmin
    .from("article_ratings")
    .select("rating")
    .eq("article_id", articleId);

  if (data && data.length > 0) {
    const sum = data.reduce(
      (acc: number, r: { rating: number }) => acc + r.rating,
      0,
    );
    const avg = sum / data.length;

    await supabaseAdmin
      .from("articles")
      .update({
        rating_average: Math.round(avg * 100) / 100,
        rating_count: data.length,
      })
      .eq("article_id", articleId);
  }
}

/**
 * 更新文章留言數
 */
async function updateArticleCommentCount(articleId: number): Promise<void> {
  const { count } = await supabaseAdmin
    .from("article_comments")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId)
    .eq("is_visible", true)
    .is("deleted_at", null);

  await supabaseAdmin
    .from("articles")
    .update({ comment_count: count || 0 })
    .eq("article_id", articleId);
}

/**
 * 生成 slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

export default router;
