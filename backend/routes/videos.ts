/**
 * @fileoverview 影片管理路由
 * 處理公開影片查詢及管理員影片 CRUD 操作
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router: Router = express.Router();

// ===== 工具函式 =====

/**
 * 從 HTML 字串解析 meta property="og:image" 的 content 值
 */
function parseOgImage(html: string): string | null {
  const match = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  ) ?? html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  );
  return match ? match[1] : null;
}

/**
 * 從 YouTube URL 取得影片 ID
 * 支援 youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 */
function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/**
 * 偵測 URL 平台
 */
function detectPlatform(url: string): "youtube" | "instagram" | "facebook" | "tiktok" | "other" {
  if (/youtu\.be|youtube\.com/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return "other";
}

/**
 * 從 Facebook URL 嘗試解析 reel/video ID（用於 log，非必要）
 */
function extractFacebookVideoId(url: string): string | null {
  const m = url.match(/(?:reel|videos|watch[/?]v=|v=)[\/?]?(\d{10,})/i);
  return m ? m[1] : null;
}

/**
 * 下載圖片並轉為 base64 data URL
 * @param extraHeaders 額外 headers（例如 IG CDN 需要 Referer）
 */
async function imageToBase64(
  imageUrl: string,
  extraHeaders: Record<string, string> = {},
): Promise<{ base64: string; contentType: string }> {
  const resp = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ...extraHeaders,
    },
  });
  if (!resp.ok) throw new Error(`圖片下載失敗: ${resp.status}`);
  const contentType = resp.headers.get("content-type") ?? "image/jpeg";
  const buffer = await resp.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64: `data:${contentType};base64,${base64}`, contentType };
}

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
 * 擷取影片縮圖並回傳 base64
 * @route POST /api/videos/fetch-thumbnail
 *
 * 策略：
 *   YouTube → 直接從 img.youtube.com 下載縮圖（100% 可靠）
 *   IG / TikTok / 其他 → 回傳 ig_manual 錯誤碼，告知前端改用手動上傳
 */
router.post(
  "/fetch-thumbnail",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, igSession } = req.body as { url?: string; igSession?: string };
      if (!url || typeof url !== "string") {
        res.status(400).json({ error: "缺少 url 參數" });
        return;
      }

      const platform = detectPlatform(url);

      // ── YouTube：直接用公開縮圖 API ──────────────────────
      if (platform === "youtube") {
        const videoId = extractYouTubeId(url);
        if (!videoId) {
          res.status(422).json({ error: "無法解析 YouTube 影片 ID" });
          return;
        }
        // 嘗試 maxresdefault → hqdefault fallback
        let thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        let testResp = await fetch(thumbUrl, { method: "HEAD" });
        if (!testResp.ok || testResp.headers.get("content-length") === "1176") {
          // 1176 bytes = YT 預設佔位圖，換 hqdefault
          thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        const { base64, contentType } = await imageToBase64(thumbUrl);
        res.json({ base64, contentType, source: thumbUrl, platform: "youtube" });
        return;
      }

      // ── TikTok：無法 scraping ──
      if (platform === "tiktok") {
        res.status(422).json({
          code: "manual_required",
          error: "TikTok 頁面為動態渲染，無法自動擷取截圖。請手動截圖後上傳。",
        });
        return;
      }

      // ── Instagram：需要 session cookie ──
      if (platform === "instagram") {
        if (!igSession || typeof igSession !== "string" || igSession.trim().length < 10) {
          res.status(422).json({
            code: "ig_session_required",
            error: "需要 IG Session 才能擷取截圖。請在管理面板設定 IG Session。",
          });
          return;
        }
        // 用 sessionid 以認證身份去抓頁面
        const igResp = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
              "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            "Cookie": `sessionid=${igSession.trim()}; ig_did=0; ig_nrcb=1`,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-TW,zh;q=0.9",
            "Referer": "https://www.instagram.com/",
          },
        });

        if (igResp.status === 401 || igResp.status === 403) {
          res.status(422).json({
            code: "ig_session_expired",
            error: "IG Session 已過期或無效，請重新設定。",
          });
          return;
        }

        if (!igResp.ok) {
          res.status(422).json({ error: `IG 頁面存取失敗 (${igResp.status})，請手動上傳截圖` });
          return;
        }

        const igHtml = await igResp.text();

        // 若被導回登入頁代表 session 失效
        if (igHtml.includes('"login_required"') || igHtml.includes('id="login-page"')) {
          res.status(422).json({
            code: "ig_session_expired",
            error: "IG Session 已過期，請重新在管理面板設定。",
          });
          return;
        }

        const igOgImage = parseOgImage(igHtml);
        if (!igOgImage) {
          res.status(422).json({ error: "IG 頁面找不到縮圖，請手動上傳截圖" });
          return;
        }

        // IG CDN 需要帶 Referer 才不會 403
        const { base64, contentType } = await imageToBase64(igOgImage, {
          "Referer": "https://www.instagram.com/",
          "Cookie": `sessionid=${igSession!.trim()}`,
        });
        res.json({ base64, contentType, source: igOgImage, platform: "instagram" });
        return;
      }

      // ── Facebook Reels / 影片 & 其他：嘗試 og:image scraping ──
      // Facebook 對爬蟲做 server-side render，og:image 通常可以抓到
      const scraperHeaders: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      };

      // Facebook 需要帶語系 cookie 避免被導向 login
      if (platform === "facebook") {
        scraperHeaders["Cookie"] = "locale=zh_TW; datr=; wd=1280x800";
        console.info(`[fetch-thumbnail] Facebook video ID: ${extractFacebookVideoId(url) ?? "unknown"}`);
      }

      const pageResp = await fetch(url, { headers: scraperHeaders });

      if (!pageResp.ok) {
        const hint = platform === "facebook"
          ? "Facebook 頁面存取失敗，請確認貼文為公開後手動上傳截圖"
          : `無法存取頁面 (${pageResp.status})，請手動上傳截圖`;
        res.status(422).json({ error: hint });
        return;
      }

      const html = await pageResp.text();
      const ogImage = parseOgImage(html);
      if (!ogImage) {
        const hint = platform === "facebook"
          ? "找不到縮圖（可能需要登入或貼文為私人）。請手動截圖後上傳。"
          : "找不到縮圖，請手動上傳截圖";
        res.status(422).json({ error: hint });
        return;
      }

      const { base64, contentType } = await imageToBase64(ogImage);
      res.json({ base64, contentType, source: ogImage, platform });
    } catch (err) {
      console.error("Fetch thumbnail error:", err);
      res.status(500).json({ error: "截圖擷取失敗，請手動上傳截圖" });
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
