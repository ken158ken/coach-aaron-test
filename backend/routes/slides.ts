/**
 * @fileoverview 幻燈片管理路由
 * 處理學員見證幻燈片（testimonial_slides）與相片輪播（gallery_slides）的 CRUD 操作
 *
 * 圖片來源：Cloudinary（不限帳號）或本站上傳（content-images bucket）
 *   - 見證：`content-images/{id}/photo_*.webp`
 *   - 輪播：`content-images/gallery_{id}/photo_*.webp`
 * 兩者都是硬刪除，刪 row 時會一併清掉整個資料夾。
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { isAllowedImageUrl, imageUrlErrorMessage } from "../utils/imageUrl.js";
import {
  deleteEntityImages,
  finalizeImageUrl,
  replaceCleanup,
} from "../utils/imageStorage.js";

const router: Router = express.Router();

/** image_url 是 NOT NULL 欄位 — 新增時必須有值且合法 */
const isValidSlideImage = (url: unknown): boolean =>
  typeof url === "string" && url.trim() !== "" && isAllowedImageUrl(url);

// =======================================================
// 公開 API
// =======================================================

/**
 * 取得啟用的學員見證幻燈片
 * @route GET /api/slides/testimonials
 */
router.get("/testimonials", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("testimonial_slides")
      .select("id, image_url, name, achievement, quote, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Get testimonial slides error:", err);
    res.status(500).json({ error: "取得學員見證失敗" });
  }
});

/**
 * 取得學員見證幻燈片設定（interval_ms、is_published）
 * @route GET /api/slides/testimonials/config
 */
router.get("/testimonials/config", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("testimonial_config")
      .select("interval_ms, is_published, card_layout")
      .eq("id", 1)
      .single();

    if (error) throw error;
    res.json(data || { interval_ms: 4000, is_published: true, card_layout: "portrait" });
  } catch (err) {
    console.error("Get testimonial config error:", err);
    res.status(500).json({ error: "取得幻燈片設定失敗" });
  }
});

/**
 * 取得啟用的相片輪播幻燈片
 * @route GET /api/slides/gallery
 */
router.get("/gallery", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("gallery_slides")
      .select("id, image_url, caption, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Get gallery slides error:", err);
    res.status(500).json({ error: "取得相片輪播失敗" });
  }
});

/**
 * 取得相片輪播設定（is_published）
 * @route GET /api/slides/gallery/config
 */
router.get("/gallery/config", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("gallery_config")
      .select("is_published")
      .eq("id", 1)
      .single();

    if (error) throw error;
    res.json(data || { is_published: true });
  } catch (err) {
    console.error("Get gallery config error:", err);
    res.status(500).json({ error: "取得相片輪播設定失敗" });
  }
});

// =======================================================
// 管理員 API — 學員見證幻燈片
// =======================================================

/**
 * 取得所有學員見證幻燈片（含停用的）
 * @route GET /api/slides/admin/testimonials
 */
router.get(
  "/admin/testimonials",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("testimonial_slides")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all testimonial slides error:", err);
      res.status(500).json({ error: "取得學員見證失敗" });
    }
  },
);

/**
 * 新增學員見證幻燈片
 * @route POST /api/slides/admin/testimonials
 */
router.post(
  "/admin/testimonials",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrl, name, achievement, quote, sortOrder } = req.body;

      if (!isValidSlideImage(imageUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("見證照片") });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("testimonial_slides")
        .insert({
          image_url: imageUrl,
          name: name || "",
          achievement: achievement || "",
          quote: quote || "",
          sort_order: sortOrder ?? 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // 拿到 id 後把暫存圖搬到 `{id}/`
      if (data?.id) {
        try {
          const finalUrl = await finalizeImageUrl({
            entity: "testimonial",
            entityKey: data.id,
            url: data.image_url as string,
            kind: "photo",
          });
          if (finalUrl !== data.image_url) {
            await supabaseAdmin
              .from("testimonial_slides")
              .update({ image_url: finalUrl })
              .eq("id", data.id);
            data.image_url = finalUrl;
          }
        } catch (imgErr) {
          logger.error("見證照片 finalize 失敗", imgErr as Error, { id: data.id });
        }
      }

      res.json(data);
    } catch (err) {
      console.error("Create testimonial slide error:", err);
      res.status(500).json({ error: "新增學員見證失敗" });
    }
  },
);

/**
 * 取得學員見證設定（管理員）— 必須在 /:id 路由之前定義，否則 "config" 會被當成 ID
 * @route GET /api/slides/admin/testimonials/config
 */
router.get(
  "/admin/testimonials/config",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("testimonial_config")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;
      res.json(data || { id: 1, interval_ms: 4000, is_published: true, card_layout: "portrait" });
    } catch (err) {
      console.error("Get testimonial config (admin) error:", err);
      res.status(500).json({ error: "取得幻燈片設定失敗" });
    }
  },
);

/**
 * 更新學員見證設定（interval_ms、is_published、card_layout）— 必須在 /:id 之前
 * @route PUT /api/slides/admin/testimonials/config
 */
router.put(
  "/admin/testimonials/config",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { intervalMs, isPublished, cardLayout } = req.body;

      const updateData: Record<string, unknown> = {};
      if (intervalMs !== undefined) {
        const ms = Number(intervalMs);
        if (isNaN(ms) || ms < 1000 || ms > 30000) {
          res.status(400).json({ error: "輪播間隔需在 1000～30000 毫秒之間" });
          return;
        }
        updateData.interval_ms = ms;
      }
      if (isPublished !== undefined) updateData.is_published = isPublished;
      if (cardLayout !== undefined) {
        if (!["portrait", "landscape", "quote-grid"].includes(cardLayout)) {
          res
            .status(400)
            .json({ error: "card_layout 只允許 portrait、landscape 或 quote-grid" });
          return;
        }
        updateData.card_layout = cardLayout;
      }

      const { data, error } = await supabaseAdmin
        .from("testimonial_config")
        .update(updateData)
        .eq("id", 1)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update testimonial config error:", err);
      res.status(500).json({ error: "更新幻燈片設定失敗" });
    }
  },
);

/**
 * 更新學員見證幻燈片
 * @route PUT /api/slides/admin/testimonials/:id
 */
router.put(
  "/admin/testimonials/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { imageUrl, name, achievement, quote, sortOrder, isActive } = req.body;

      if (imageUrl !== undefined && !isValidSlideImage(imageUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("見證照片") });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined)       updateData.name        = name;
      if (achievement !== undefined) updateData.achievement = achievement;
      if (quote !== undefined)      updateData.quote       = quote;
      if (sortOrder !== undefined)  updateData.sort_order  = sortOrder;
      if (isActive !== undefined)   updateData.is_active   = isActive;

      let previousImage: string | null = null;
      if (imageUrl !== undefined) {
        const { data: prev } = await supabaseAdmin
          .from("testimonial_slides")
          .select("image_url")
          .eq("id", id)
          .single();
        previousImage = prev?.image_url ?? null;

        updateData.image_url = await finalizeImageUrl({
          entity: "testimonial",
          entityKey: String(id),
          url: imageUrl,
          kind: "photo",
        });
      }

      const { data, error } = await supabaseAdmin
        .from("testimonial_slides")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (imageUrl !== undefined) {
        await replaceCleanup(previousImage, updateData.image_url);
      }

      res.json(data);
    } catch (err) {
      console.error("Update testimonial slide error:", err);
      res.status(500).json({ error: "更新學員見證失敗" });
    }
  },
);

/**
 * 刪除學員見證幻燈片
 * @route DELETE /api/slides/admin/testimonials/:id
 */
router.delete(
  "/admin/testimonials/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("testimonial_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 硬刪除 → 連整個 `content-images/{id}/` 資料夾一起清掉
      await deleteEntityImages("testimonial", String(id));

      res.json({ success: true });
    } catch (err) {
      console.error("Delete testimonial slide error:", err);
      res.status(500).json({ error: "刪除學員見證失敗" });
    }
  },
);

// =======================================================
// 管理員 API — 相片輪播
// =======================================================

/**
 * 取得所有相片輪播幻燈片（含停用的）
 * @route GET /api/slides/admin/gallery
 */
router.get(
  "/admin/gallery",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("gallery_slides")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all gallery slides error:", err);
      res.status(500).json({ error: "取得相片輪播失敗" });
    }
  },
);

/**
 * 新增相片輪播幻燈片
 * @route POST /api/slides/admin/gallery
 */
router.post(
  "/admin/gallery",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUrl, caption, sortOrder } = req.body;

      if (!isValidSlideImage(imageUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("輪播相片") });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("gallery_slides")
        .insert({
          image_url: imageUrl,
          caption: caption || "",
          sort_order: sortOrder ?? 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // 拿到 id 後把暫存圖搬到 `gallery_{id}/`
      if (data?.id) {
        try {
          const finalUrl = await finalizeImageUrl({
            entity: "gallery",
            entityKey: data.id,
            url: data.image_url as string,
            kind: "photo",
          });
          if (finalUrl !== data.image_url) {
            await supabaseAdmin
              .from("gallery_slides")
              .update({ image_url: finalUrl })
              .eq("id", data.id);
            data.image_url = finalUrl;
          }
        } catch (imgErr) {
          logger.error("輪播相片 finalize 失敗", imgErr as Error, { id: data.id });
        }
      }

      res.json(data);
    } catch (err) {
      console.error("Create gallery slide error:", err);
      res.status(500).json({ error: "新增相片失敗" });
    }
  },
);

/**
 * 取得相片輪播設定（管理員）— 必須在 /:id 路由之前定義
 * @route GET /api/slides/admin/gallery/config
 */
router.get(
  "/admin/gallery/config",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("gallery_config")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;
      res.json(data || { id: 1, is_published: true });
    } catch (err) {
      console.error("Get gallery config (admin) error:", err);
      res.status(500).json({ error: "取得相片輪播設定失敗" });
    }
  },
);

/**
 * 更新相片輪播設定（is_published）— 必須在 /:id 之前
 * @route PUT /api/slides/admin/gallery/config
 */
router.put(
  "/admin/gallery/config",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { isPublished } = req.body;

      const { data, error } = await supabaseAdmin
        .from("gallery_config")
        .update({ is_published: isPublished })
        .eq("id", 1)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update gallery config error:", err);
      res.status(500).json({ error: "更新相片輪播設定失敗" });
    }
  },
);

/**
 * 更新相片輪播幻燈片
 * @route PUT /api/slides/admin/gallery/:id
 */
router.put(
  "/admin/gallery/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { imageUrl, caption, sortOrder, isActive } = req.body;

      if (imageUrl !== undefined && !isValidSlideImage(imageUrl)) {
        res.status(400).json({ error: imageUrlErrorMessage("輪播相片") });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (caption !== undefined)   updateData.caption    = caption;
      if (sortOrder !== undefined) updateData.sort_order = sortOrder;
      if (isActive !== undefined)  updateData.is_active  = isActive;

      let previousImage: string | null = null;
      if (imageUrl !== undefined) {
        const { data: prev } = await supabaseAdmin
          .from("gallery_slides")
          .select("image_url")
          .eq("id", id)
          .single();
        previousImage = prev?.image_url ?? null;

        updateData.image_url = await finalizeImageUrl({
          entity: "gallery",
          entityKey: String(id),
          url: imageUrl,
          kind: "photo",
        });
      }

      const { data, error } = await supabaseAdmin
        .from("gallery_slides")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (imageUrl !== undefined) {
        await replaceCleanup(previousImage, updateData.image_url);
      }

      res.json(data);
    } catch (err) {
      console.error("Update gallery slide error:", err);
      res.status(500).json({ error: "更新相片失敗" });
    }
  },
);

/**
 * 刪除相片輪播幻燈片
 * @route DELETE /api/slides/admin/gallery/:id
 */
router.delete(
  "/admin/gallery/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("gallery_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 硬刪除 → 連整個 `content-images/gallery_{id}/` 資料夾一起清掉
      await deleteEntityImages("gallery", String(id));

      res.json({ success: true });
    } catch (err) {
      console.error("Delete gallery slide error:", err);
      res.status(500).json({ error: "刪除相片失敗" });
    }
  },
);

export default router;
