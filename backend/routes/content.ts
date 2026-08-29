/**
 * @fileoverview 網站內容管理路由
 * 處理 site_content 與 site_popups 的 CRUD 操作
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router: Router = express.Router();

/** 圖片型內容網址限定 Cloudinary（與 slides.ts 對齊） */
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/daejq0zo9/";
const isValidCloudinaryUrl = (url: unknown): boolean =>
  typeof url === "string" && url.startsWith(CLOUDINARY_PREFIX);

// ===== 公開 API =====

/**
 * 取得所有啟用的網站內容
 * @route GET /api/content
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_content")
      .select("content_key, content_name, content_value, content_type")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // 轉為 key-value 格式方便前端使用
    const contentMap: Record<string, string> = {};
    for (const item of data || []) {
      contentMap[item.content_key] = item.content_value;
    }

    res.json(contentMap);
  } catch (err) {
    console.error("Get site content error:", err);
    res.status(500).json({ error: "取得網站內容失敗" });
  }
});

/**
 * 取得目前啟用的彈窗
 * @route GET /api/content/popup/active
 */
router.get(
  "/popup/active",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from("site_popups")
        .select("popup_id, popup_title, popup_content, show_once")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      res.json(data || null);
    } catch (err) {
      console.error("Get active popup error:", err);
      res.status(500).json({ error: "取得彈窗失敗" });
    }
  },
);

// ===== 管理員 API =====

/**
 * 取得所有網站內容（管理員）
 * @route GET /api/content/admin/all
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("site_content")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all site content error:", err);
      res.status(500).json({ error: "取得網站內容失敗" });
    }
  },
);

/**
 * 更新網站內容（管理員）
 * @route PUT /api/content/admin/:id
 */
router.put(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { contentValue, contentName, contentType, isActive } = req.body;

      // image 型內容：驗證必須是 Cloudinary URL
      // 決策 content_type 後再驗 value：若本次一併改 type，以新的 type 為準
      const effectiveType =
        contentType !== undefined
          ? contentType
          : (
              await supabaseAdmin
                .from("site_content")
                .select("content_type")
                .eq("content_id", id)
                .single()
            ).data?.content_type;

      if (
        effectiveType === "image" &&
        contentValue !== undefined &&
        contentValue !== "" &&
        !isValidCloudinaryUrl(contentValue)
      ) {
        res.status(400).json({
          error: `圖片網址必須使用 Cloudinary（${CLOUDINARY_PREFIX}...）`,
        });
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (contentValue !== undefined) updateData.content_value = contentValue;
      if (contentName !== undefined) updateData.content_name = contentName;
      if (contentType !== undefined) updateData.content_type = contentType;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabaseAdmin
        .from("site_content")
        .update(updateData)
        .eq("content_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update site content error:", err);
      res.status(500).json({ error: "更新網站內容失敗" });
    }
  },
);

/**
 * 新增網站內容（管理員）
 * @route POST /api/content/admin
 */
router.post(
  "/admin",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contentKey, contentName, contentValue, contentType, sortOrder } =
        req.body;

      if (
        contentType === "image" &&
        contentValue &&
        !isValidCloudinaryUrl(contentValue)
      ) {
        res.status(400).json({
          error: `圖片網址必須使用 Cloudinary（${CLOUDINARY_PREFIX}...）`,
        });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("site_content")
        .insert({
          content_key: contentKey,
          content_name: contentName,
          content_value: contentValue || "",
          content_type: contentType || "text",
          sort_order: sortOrder || 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create site content error:", err);
      res.status(500).json({ error: "新增網站內容失敗" });
    }
  },
);

/**
 * 刪除網站內容（管理員）
 * @route DELETE /api/content/admin/:id
 */
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("site_content")
        .delete()
        .eq("content_id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete site content error:", err);
      res.status(500).json({ error: "刪除網站內容失敗" });
    }
  },
);

// ===== 彈窗管理 =====

/**
 * 取得所有彈窗（管理員）
 * @route GET /api/content/admin/popups
 */
router.get(
  "/admin/popups",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("site_popups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all popups error:", err);
      res.status(500).json({ error: "取得彈窗失敗" });
    }
  },
);

/**
 * 新增彈窗（管理員）
 * @route POST /api/content/admin/popups
 */
router.post(
  "/admin/popups",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { popupTitle, popupContent, showOnce, startDate, endDate } =
        req.body;

      const { data, error } = await supabaseAdmin
        .from("site_popups")
        .insert({
          popup_title: popupTitle || "",
          popup_content: popupContent || "",
          is_active: false,
          show_once: showOnce !== undefined ? showOnce : true,
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create popup error:", err);
      res.status(500).json({ error: "新增彈窗失敗" });
    }
  },
);

/**
 * 更新彈窗（管理員）
 * @route PUT /api/content/admin/popups/:id
 */
router.put(
  "/admin/popups/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        popupTitle,
        popupContent,
        isActive,
        showOnce,
        startDate,
        endDate,
      } = req.body;

      const updateData: Record<string, unknown> = {};
      if (popupTitle !== undefined) updateData.popup_title = popupTitle;
      if (popupContent !== undefined) updateData.popup_content = popupContent;
      if (showOnce !== undefined) updateData.show_once = showOnce;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;

      // 若啟用此彈窗，先停用其他所有彈窗
      if (isActive === true) {
        await supabaseAdmin
          .from("site_popups")
          .update({ is_active: false })
          .neq("popup_id", id);
        updateData.is_active = true;
      } else if (isActive === false) {
        updateData.is_active = false;
      }

      const { data, error } = await supabaseAdmin
        .from("site_popups")
        .update(updateData)
        .eq("popup_id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update popup error:", err);
      res.status(500).json({ error: "更新彈窗失敗" });
    }
  },
);

/**
 * 刪除彈窗（管理員）
 * @route DELETE /api/content/admin/popups/:id
 */
router.delete(
  "/admin/popups/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("site_popups")
        .delete()
        .eq("popup_id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete popup error:", err);
      res.status(500).json({ error: "刪除彈窗失敗" });
    }
  },
);

export default router;
