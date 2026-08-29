/**
 * @fileoverview 幻燈片管理路由
 * 處理學員見證幻燈片（testimonial_slides）與相片輪播（gallery_slides）的 CRUD 操作
 * 圖片網址限定使用 Cloudinary（res.cloudinary.com/daejq0zo9/）
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router: Router = express.Router();

/** 限定只允許指定 Cloudinary 帳號的網址 */
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/daejq0zo9/";

const isValidCloudinaryUrl = (url: unknown): boolean =>
  typeof url === "string" && url.startsWith(CLOUDINARY_PREFIX);

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

      if (!isValidCloudinaryUrl(imageUrl)) {
        res.status(400).json({ error: "圖片網址必須使用 Cloudinary（daejq0zo9）" });
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

      if (imageUrl !== undefined && !isValidCloudinaryUrl(imageUrl)) {
        res.status(400).json({ error: "圖片網址必須使用 Cloudinary（daejq0zo9）" });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (imageUrl !== undefined)   updateData.image_url   = imageUrl;
      if (name !== undefined)       updateData.name        = name;
      if (achievement !== undefined) updateData.achievement = achievement;
      if (quote !== undefined)      updateData.quote       = quote;
      if (sortOrder !== undefined)  updateData.sort_order  = sortOrder;
      if (isActive !== undefined)   updateData.is_active   = isActive;

      const { data, error } = await supabaseAdmin
        .from("testimonial_slides")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
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

      if (!isValidCloudinaryUrl(imageUrl)) {
        res.status(400).json({ error: "圖片網址必須使用 Cloudinary（daejq0zo9）" });
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

      if (imageUrl !== undefined && !isValidCloudinaryUrl(imageUrl)) {
        res.status(400).json({ error: "圖片網址必須使用 Cloudinary（daejq0zo9）" });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (imageUrl !== undefined)  updateData.image_url  = imageUrl;
      if (caption !== undefined)   updateData.caption    = caption;
      if (sortOrder !== undefined) updateData.sort_order = sortOrder;
      if (isActive !== undefined)  updateData.is_active  = isActive;

      const { data, error } = await supabaseAdmin
        .from("gallery_slides")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
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
      res.json({ success: true });
    } catch (err) {
      console.error("Delete gallery slide error:", err);
      res.status(500).json({ error: "刪除相片失敗" });
    }
  },
);

export default router;
