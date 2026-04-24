/**
 * @fileoverview 認證 / 成果 Marquee 路由
 *
 * 單一表 `marquee_items` 存兩種資料，用 `type` 欄區分：
 *   - 'cert' : 認證標章（icon + label + sub）
 *   - 'stat' : 成果數字（label = 數值, sub = 說明）
 *
 * 對應首頁元件 `CertificationMarquee.tsx`。
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router: Router = express.Router();

type MarqueeType = "cert" | "stat";
const isValidType = (t: unknown): t is MarqueeType =>
  t === "cert" || t === "stat";

// =======================================================
// 公開 API — 給首頁讀取
// =======================================================

/**
 * 取得啟用的 marquee 項目（同時回傳 cert 與 stat，前端自行 filter）
 * @route GET /api/marquee
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("marquee_items")
      .select("id, type, icon, label, sub, sort_order")
      .eq("is_active", true)
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Get marquee items error:", err);
    res.status(500).json({ error: "取得 Marquee 項目失敗" });
  }
});

// =======================================================
// 管理員 API
// =======================================================

/**
 * 取得所有項目（含停用）
 * @route GET /api/marquee/admin
 */
router.get(
  "/admin",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("marquee_items")
        .select("*")
        .order("type", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all marquee items error:", err);
      res.status(500).json({ error: "取得 Marquee 項目失敗" });
    }
  },
);

/**
 * 新增項目
 * @route POST /api/marquee/admin
 */
router.post(
  "/admin",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, icon, label, sub, sortOrder } = req.body;

      if (!isValidType(type)) {
        res.status(400).json({ error: "type 必須是 'cert' 或 'stat'" });
        return;
      }
      if (!label || typeof label !== "string" || label.trim() === "") {
        res.status(400).json({ error: "label 為必填" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("marquee_items")
        .insert({
          type,
          icon: icon || "",
          label: label.trim(),
          sub: sub || "",
          sort_order: sortOrder ?? 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create marquee item error:", err);
      res.status(500).json({ error: "新增 Marquee 項目失敗" });
    }
  },
);

/**
 * 更新項目
 * @route PUT /api/marquee/admin/:id
 */
router.put(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { type, icon, label, sub, sortOrder, isActive } = req.body;

      if (type !== undefined && !isValidType(type)) {
        res.status(400).json({ error: "type 必須是 'cert' 或 'stat'" });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (type !== undefined) updateData.type = type;
      if (icon !== undefined) updateData.icon = icon;
      if (label !== undefined) updateData.label = label;
      if (sub !== undefined) updateData.sub = sub;
      if (sortOrder !== undefined) updateData.sort_order = sortOrder;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabaseAdmin
        .from("marquee_items")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update marquee item error:", err);
      res.status(500).json({ error: "更新 Marquee 項目失敗" });
    }
  },
);

/**
 * 刪除項目
 * @route DELETE /api/marquee/admin/:id
 */
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("marquee_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete marquee item error:", err);
      res.status(500).json({ error: "刪除 Marquee 項目失敗" });
    }
  },
);

export default router;
