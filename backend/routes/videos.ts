/**
 * @fileoverview 影片管理路由
 * 處理公開影片查詢及管理員影片 CRUD 操作
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router: Router = express.Router();


// ===== 公開 API =====

/**
 * 取得所有可見影片
 * @route GET /api/videos
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("videos")
      .select("*")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get videos error:", err);
    res.status(500).json({ error: "取得影片失敗" });
  }
});

// ===== 管理員 API =====

/**
 * 取得所有影片
 * @route GET /api/videos/admin/all
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("videos")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Get all videos error:", err);
      res.status(500).json({ error: "取得影片失敗" });
    }
  },
);


/**
 * 批量新增影片
 * @route POST /api/videos/batch
 * body: { videos: Array<{ title, url, type, description?, thumbnail?, sortOffset? }> }
 */
router.post(
  "/batch",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { videos: items } = req.body as {
        videos: Array<{
          title: string;
          url: string;
          type?: string;
          description?: string;
          thumbnail?: string;
          sortOffset?: number;
        }>;
      };

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "videos 陣列不可為空" });
        return;
      }

      // 取得目前最大 sort_order，新影片接在後面
      const { data: maxRow } = await supabaseAdmin
        .from("videos")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      const baseOrder = (maxRow?.sort_order ?? 0) as number;

      const rows = items.map((item, i) => ({
        title: item.title,
        url: item.url,
        type: item.type ?? "instagram",
        is_visible: true,
        sort_order: baseOrder + i + 1,
        ...(item.description ? { description: item.description } : {}),
        ...(item.thumbnail ? { thumbnail_url: item.thumbnail } : {}),
      }));

      const { data, error } = await supabaseAdmin
        .from("videos")
        .insert(rows)
        .select();

      if (error) throw error;
      res.json({ inserted: data?.length ?? 0, data: data ?? [] });
    } catch (err) {
      console.error("Batch create videos error:", err);
      res.status(500).json({ error: "批量新增失敗" });
    }
  },
);

/**
 * 新增影片
 * @route POST /api/videos
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, url, type, sortOrder, description, thumbnail } = req.body;

      const { data, error } = await supabaseAdmin
        .from("videos")
        .insert({
          title,
          url,
          type: type || "instagram",
          sort_order: sortOrder || 0,
          is_visible: true,
          ...(description !== undefined && { description }),
          ...(thumbnail !== undefined && { thumbnail_url: thumbnail }),
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create video error:", err);
      res.status(500).json({ error: "新增影片失敗" });
    }
  },
);

/**
 * 批量更新排序 — 必須在 /:id 之前，否則 Express 會把 "admin" 當 id
 * @route PUT /api/videos/admin/reorder
 */
router.put(
  "/admin/reorder",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orders } = req.body; // [{ id: 1, sortOrder: 0 }, ...]

      for (const item of orders) {
        await supabaseAdmin
          .from("videos")
          .update({ sort_order: item.sortOrder })
          .eq("video_id", item.id);
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Reorder videos error:", err);
      res.status(500).json({ error: "更新排序失敗" });
    }
  },
);

/**
 * 更新影片
 * @route PUT /api/videos/:id
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, url, type, sortOrder, isVisible, description, thumbnail } = req.body;

      const { data, error } = await supabaseAdmin
        .from("videos")
        .update({
          ...(title !== undefined && { title }),
          ...(url !== undefined && { url }),
          ...(type !== undefined && { type }),
          ...(sortOrder !== undefined && { sort_order: sortOrder }),
          ...(isVisible !== undefined && { is_visible: isVisible }),
          ...(description !== undefined && { description }),
          ...(thumbnail !== undefined && { thumbnail_url: thumbnail }),
        })
        .eq("video_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update video error:", err);
      res.status(500).json({ error: "更新影片失敗" });
    }
  },
);

/**
 * 刪除影片
 * @route DELETE /api/videos/:id
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("videos")
        .delete()
        .eq("video_id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete video error:", err);
      res.status(500).json({ error: "刪除影片失敗" });
    }
  },
);

export default router;
