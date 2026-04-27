/**
 * @fileoverview 教學影片（Loom）路由
 *
 * 公開：
 *   GET    /api/lessons             — 列表（已發佈）
 *   GET    /api/lessons/:id         — 單筆 + 增加 view_count
 *
 * Admin（需 authenticateToken + requireAdmin）：
 *   GET    /api/lessons/admin/all   — 含未發佈
 *   POST   /api/lessons             — 新增（給 loom_url + 選填 transcript_raw）
 *   PUT    /api/lessons/:id         — 更新
 *   DELETE /api/lessons/:id         — 軟刪除
 *
 * 注意：transcript 由 admin 提供 VTT/SRT，後端 parse 成 [{start,end,text}] JSON。
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import {
  extractLoomId,
  fetchLoomTranscript,
  parseTranscript,
  type TranscriptEntry,
} from "../utils/loom.js";

const router: Router = express.Router();

// ===== 公開 API =====

/** GET /api/lessons */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("lesson_videos")
      .select(
        "id, title, title_en, description, description_en, provider, loom_id, thumbnail_url, category, category_en, keywords, duration_seconds, view_count, sort_order, created_at",
      )
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    logger.error("取得教學影片列表失敗", err as Error);
    res.status(500).json({ error: "取得教學影片失敗" });
  }
});

/** GET /api/lessons/:id — 詳情，含 transcript */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "id 不合法" });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from("lesson_videos")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .is("deleted_at", null)
      .single();
    if (error || !data) {
      res.status(404).json({ error: "影片不存在" });
      return;
    }
    // 累計 view（不阻擋回應）
    void supabaseAdmin
      .from("lesson_videos")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id);
    res.json(data);
  } catch (err) {
    logger.error("取得教學影片失敗", err as Error);
    res.status(500).json({ error: "取得教學影片失敗" });
  }
});

// ===== Admin API =====

/** GET /api/lessons/admin/all — 含未發佈 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("lesson_videos")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      logger.error("admin 取得教學影片失敗", err as Error);
      res.status(500).json({ error: "取得教學影片失敗" });
    }
  },
);

interface UpsertBody {
  title?: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  loom_url?: string;
  thumbnail_url?: string | null;
  category?: string | null;
  category_en?: string | null;
  keywords?: string | null;
  duration_seconds?: number | null;
  sort_order?: number;
  is_published?: boolean;
  /** Admin 直接貼 VTT/SRT 文字 — 後端 parse 成 JSON 存 */
  transcript_raw?: string | null;
  /** 直接給 parsed entries（覆寫 raw） */
  transcript?: TranscriptEntry[] | null;
  transcript_lang?: string | null;
  /** 若未提供 transcript_raw，是否要嘗試從 Loom 抓 */
  fetch_transcript?: boolean;
}

interface InsertRow {
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  provider: "loom";
  loom_id: string;
  loom_url: string;
  thumbnail_url: string | null;
  category: string | null;
  category_en: string | null;
  keywords: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_published: boolean;
  transcript: TranscriptEntry[] | null;
  transcript_lang: string;
}

interface UpdateRow {
  title?: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  loom_id?: string;
  loom_url?: string;
  thumbnail_url?: string | null;
  category?: string | null;
  category_en?: string | null;
  keywords?: string | null;
  duration_seconds?: number | null;
  sort_order?: number;
  is_published?: boolean;
  transcript?: TranscriptEntry[] | null;
  transcript_lang?: string;
}

/** POST /api/lessons */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request<unknown, unknown, UpsertBody>, res: Response): Promise<void> => {
    try {
      const body = req.body || {};
      if (!body.title || !body.loom_url) {
        res.status(400).json({ error: "title 與 loom_url 必填" });
        return;
      }
      const loomId = extractLoomId(body.loom_url);
      if (!loomId) {
        res.status(400).json({ error: "loom_url 無法解析出影片 id" });
        return;
      }

      // 處理 transcript
      let transcript = await resolveTranscript(loomId, body);

      const row: InsertRow = {
        title: body.title.trim(),
        title_en: body.title_en?.trim() || null,
        description: body.description?.trim() || null,
        description_en: body.description_en?.trim() || null,
        provider: "loom",
        loom_id: loomId,
        loom_url: body.loom_url.trim(),
        thumbnail_url: body.thumbnail_url?.trim() || null,
        category: body.category?.trim() || null,
        category_en: body.category_en?.trim() || null,
        keywords: body.keywords?.trim() || null,
        duration_seconds: body.duration_seconds ?? null,
        sort_order: body.sort_order ?? 0,
        is_published: body.is_published ?? true,
        transcript,
        transcript_lang: body.transcript_lang || "zh-TW",
      };

      const { data, error } = await supabaseAdmin
        .from("lesson_videos")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      logger.error("新增教學影片失敗", err as Error);
      res.status(500).json({ error: "新增教學影片失敗" });
    }
  },
);

/** PUT /api/lessons/:id */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request<{ id: string }, unknown, UpsertBody>, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "id 不合法" });
        return;
      }
      const body = req.body || {};

      const update: UpdateRow = {};
      if (body.title !== undefined) update.title = body.title.trim();
      if (body.title_en !== undefined)
        update.title_en = body.title_en?.trim() || null;
      if (body.description !== undefined)
        update.description = body.description?.trim() || null;
      if (body.description_en !== undefined)
        update.description_en = body.description_en?.trim() || null;
      if (body.thumbnail_url !== undefined)
        update.thumbnail_url = body.thumbnail_url?.trim() || null;
      if (body.category !== undefined)
        update.category = body.category?.trim() || null;
      if (body.category_en !== undefined)
        update.category_en = body.category_en?.trim() || null;
      if (body.keywords !== undefined)
        update.keywords = body.keywords?.trim() || null;
      if (body.duration_seconds !== undefined)
        update.duration_seconds = body.duration_seconds;
      if (body.sort_order !== undefined) update.sort_order = body.sort_order;
      if (body.is_published !== undefined)
        update.is_published = body.is_published;
      if (body.transcript_lang !== undefined && body.transcript_lang)
        update.transcript_lang = body.transcript_lang;

      // 換 Loom URL → 重新解析
      let loomIdForFetch: string | null = null;
      if (body.loom_url !== undefined && body.loom_url) {
        const newId = extractLoomId(body.loom_url);
        if (!newId) {
          res.status(400).json({ error: "loom_url 無法解析" });
          return;
        }
        update.loom_id = newId;
        update.loom_url = body.loom_url.trim();
        loomIdForFetch = newId;
      }

      // Transcript：只有當有提供 transcript_raw / transcript / fetch_transcript 才動
      if (
        body.transcript_raw !== undefined ||
        body.transcript !== undefined ||
        body.fetch_transcript === true
      ) {
        // 拿 loom id 給 fetch 用：優先用 update 中的新 id，否則撈舊的
        if (!loomIdForFetch) {
          const { data: cur } = await supabaseAdmin
            .from("lesson_videos")
            .select("loom_id")
            .eq("id", id)
            .single();
          loomIdForFetch = cur?.loom_id || null;
        }
        update.transcript = await resolveTranscript(loomIdForFetch || "", body);
      }

      const { data, error } = await supabaseAdmin
        .from("lesson_videos")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      logger.error("更新教學影片失敗", err as Error);
      res.status(500).json({ error: "更新教學影片失敗" });
    }
  },
);

/** DELETE /api/lessons/:id — 軟刪除 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "id 不合法" });
        return;
      }
      const { error } = await supabaseAdmin
        .from("lesson_videos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("刪除教學影片失敗", err as Error);
      res.status(500).json({ error: "刪除教學影片失敗" });
    }
  },
);

// ===========================================================
// helpers
// ===========================================================

async function resolveTranscript(
  loomId: string,
  body: UpsertBody,
): Promise<TranscriptEntry[] | null> {
  // 1. 直接給 parsed JSON：最高優先
  if (Array.isArray(body.transcript)) {
    return body.transcript;
  }
  // 2. 給 raw VTT/SRT：parse
  if (body.transcript_raw && body.transcript_raw.trim()) {
    const parsed = parseTranscript(body.transcript_raw);
    return parsed.length > 0 ? parsed : null;
  }
  // 3. 要求自動抓
  if (body.fetch_transcript === true && loomId) {
    return await fetchLoomTranscript(loomId);
  }
  return null;
}

export default router;
