/**
 * @fileoverview 影片管理路由
 * 處理公開影片查詢及管理員影片 CRUD 操作
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { UpdateVideoData } from "../types/database.js";

const router: Router = express.Router();

// ===== 公開 API =====

/**
 * 取得所有可見影片
 * @route GET /api/videos
 * @param {Request} req - Express 請求物件
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 可見影片列表
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("videos")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

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
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 所有影片列表
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
 * 新增影片
 * @route POST /api/videos
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 新建立的影片資訊
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, url, type, sortOrder } = req.body;

      const { data, error } = await supabaseAdmin
        .from("videos")
        .insert({
          title,
          url,
          type: type || "instagram",
          sort_order: sortOrder || 0,
          is_visible: true,
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
 * 更新影片
 * @route PUT /api/videos/:id
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 更新後的影片資訊
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, url, type, sortOrder, isVisible } = req.body;

      const updateData: Partial<{
        title: string;
        url: string;
        type: string;
        sort_order: number;
        is_visible: boolean;
      }> = {};
      if (title !== undefined) updateData.title = title;
      if (url !== undefined) updateData.url = url;
      if (type !== undefined) updateData.type = type;
      if (sortOrder !== undefined) updateData.sort_order = sortOrder;
      if (isVisible !== undefined) updateData.is_visible = isVisible;

      const { data, error } = await supabaseAdmin
        .from("videos")
        .update(updateData)
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

/**
 * 批量更新排序
 * @route PUT /api/videos/admin/reorder
 * @param {Request} req - Express 請求物件（需要管理員權限）
 * @param {Response} res - Express 回應物件
 * @returns {Promise<void>} 排序更新結果
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

export default router;
