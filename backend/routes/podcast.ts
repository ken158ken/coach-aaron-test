/**
 * @fileoverview Podcast 單集路由
 *
 * 表 `podcast_episodes` — 對應首頁元件 `PodcastExpandable.tsx`。
 * 欄位：title / description / full_description / duration / episode_date / category
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router: Router = express.Router();

const VALID_CATEGORIES = ["training", "nutrition", "mindset"] as const;
type EpisodeCategory = (typeof VALID_CATEGORIES)[number];
const isValidCategory = (v: unknown): v is EpisodeCategory =>
  typeof v === "string" && (VALID_CATEGORIES as readonly string[]).includes(v);

// =======================================================
// 公開 API
// =======================================================

/**
 * 取得啟用的 podcast 單集
 * @route GET /api/podcast
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("podcast_episodes")
      .select(
        "id, title, description, full_description, duration, episode_date, category, sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Get podcast episodes error:", err);
    res.status(500).json({ error: "取得 Podcast 單集失敗" });
  }
});

// =======================================================
// 管理員 API
// =======================================================

/**
 * 取得所有單集（含停用）
 * @route GET /api/podcast/admin
 */
router.get(
  "/admin",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("podcast_episodes")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all podcast episodes error:", err);
      res.status(500).json({ error: "取得 Podcast 單集失敗" });
    }
  },
);

/**
 * 新增單集
 * @route POST /api/podcast/admin
 */
router.post(
  "/admin",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        fullDescription,
        duration,
        episodeDate,
        category,
        sortOrder,
      } = req.body;

      if (!title || typeof title !== "string" || title.trim() === "") {
        res.status(400).json({ error: "title 為必填" });
        return;
      }
      if (category !== undefined && !isValidCategory(category)) {
        res.status(400).json({
          error: `category 必須是 ${VALID_CATEGORIES.join(" / ")}`,
        });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("podcast_episodes")
        .insert({
          title: title.trim(),
          description: description || "",
          full_description: fullDescription || "",
          duration: duration || "",
          episode_date: episodeDate || "",
          category: category || "training",
          sort_order: sortOrder ?? 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create podcast episode error:", err);
      res.status(500).json({ error: "新增 Podcast 單集失敗" });
    }
  },
);

/**
 * 更新單集
 * @route PUT /api/podcast/admin/:id
 */
router.put(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        fullDescription,
        duration,
        episodeDate,
        category,
        sortOrder,
        isActive,
      } = req.body;

      if (category !== undefined && !isValidCategory(category)) {
        res.status(400).json({
          error: `category 必須是 ${VALID_CATEGORIES.join(" / ")}`,
        });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (fullDescription !== undefined)
        updateData.full_description = fullDescription;
      if (duration !== undefined) updateData.duration = duration;
      if (episodeDate !== undefined) updateData.episode_date = episodeDate;
      if (category !== undefined) updateData.category = category;
      if (sortOrder !== undefined) updateData.sort_order = sortOrder;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabaseAdmin
        .from("podcast_episodes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update podcast episode error:", err);
      res.status(500).json({ error: "更新 Podcast 單集失敗" });
    }
  },
);

/**
 * 刪除單集
 * @route DELETE /api/podcast/admin/:id
 */
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("podcast_episodes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete podcast episode error:", err);
      res.status(500).json({ error: "刪除 Podcast 單集失敗" });
    }
  },
);

export default router;
