/**
 * 後台管理匯出路由
 *
 * GET /api/admin/export/modules         → 列出可匯出模組清單
 * GET /api/admin/export/full            → 全站 Excel（所有模組多 Sheet）
 * GET /api/admin/export/:module?format= → 單一模組匯出（md/txt/html/xlsx/docx）
 *
 * 全部需要 authenticateToken + requireAdmin
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import {
  setDownloadHeaders,
  toMd,
  toTxt,
  toHtml,
  toXlsx,
  toDocx,
  toFullXlsx,
  toFullMd,
  toFullTxt,
  toFullHtml,
  toFullDocx,
  type ExportRow,
  type ModuleExport,
} from "../utils/exportHelpers.js";
import { format as dateFmt } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const router: Router = express.Router();
const TZ = "Asia/Taipei";

const guard = [authenticateToken, requireAdmin];

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return dateFmt(toZonedTime(new Date(iso), TZ), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
}

// ===== 模組定義 =====

const MODULE_NAMES: Record<string, string> = {
  users:         "使用者名單",
  courses:       "課程",
  articles:      "文章",
  videos:        "Reels 影片",
  lessons:       "教學影片",
  bookings:      "預約記錄",
  chat_all:      "所有聊天記錄",
  marquee:       "跑馬燈",
  podcast:       "Podcast",
  notifications: "通知記錄",
  site_content:  "站內文案",
  whitelist:     "管理員白名單",
  landing_pages: "Landing Pages",
};

const MODULE_LIST = Object.entries(MODULE_NAMES).map(([key, name]) => ({ key, name }));

// ===== 各模組資料抓取函式 =====

async function fetchModule(key: string): Promise<ExportRow[]> {
  switch (key) {
    // ---------- 使用者（排除密碼）----------
    case "users": {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("user_id, username, display_name, email, phone_number, is_active, email_verified, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        用戶ID: r.user_id,
        帳號: r.username || "",
        顯示名稱: r.display_name || "",
        Email: r.email,
        電話: r.phone_number || "",
        帳號狀態: r.is_active ? "啟用" : "停用",
        Email驗證: r.email_verified ? "已驗證" : "未驗證",
        加入時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 課程 ----------
    case "courses": {
      const { data, error } = await supabaseAdmin
        .from("courses")
        .select("course_id, course_title, course_category, course_level, price, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        課程ID: r.course_id,
        課程名稱: r.course_title,
        分類: r.course_category || "",
        難度: r.course_level || "",
        價格: r.price ?? "",
        狀態: r.status === "published" ? "已發布" : "草稿",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 文章 ----------
    case "articles": {
      const { data, error } = await supabaseAdmin
        .from("articles")
        .select("article_id, article_title, article_slug, article_category, status, view_count, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        文章ID: r.article_id,
        標題: r.article_title,
        Slug: r.article_slug || "",
        分類: r.article_category || "",
        狀態: r.status === "published" ? "已發布" : "草稿",
        瀏覽數: r.view_count ?? 0,
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- Reels 影片 ----------
    case "videos": {
      const { data, error } = await supabaseAdmin
        .from("videos")
        .select("video_id, title, url, type, description, is_visible, sort_order, thumbnail_url")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({
        影片ID: r.video_id,
        標題: r.title || "",
        類型: r.type || "",
        連結: r.url || "",
        描述: r.description || "",
        顯示狀態: r.is_visible ? "顯示" : "隱藏",
        排序: r.sort_order ?? "",
        縮圖連結: r.thumbnail_url || "",
      }));
    }

    // ---------- 教學影片 ----------
    case "lessons": {
      const { data, error } = await supabaseAdmin
        .from("lesson_videos")
        .select("id, title, loom_id, duration_seconds, keywords, is_published, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        ID: r.id,
        標題: r.title,
        LoomID: r.loom_id || "",
        時長秒數: r.duration_seconds ?? "",
        關鍵字: Array.isArray(r.keywords) ? r.keywords.join(", ") : "",
        發布狀態: r.is_published ? "已發布" : "草稿",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 預約記錄 ----------
    case "bookings": {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select(
          `id, status, start_at, end_at, user_note, contact_email, created_at,
           user:users(display_name, email)`,
        )
        .order("start_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => {
        const u = r.user as { display_name?: string; email?: string } | null;
        return {
          預約ID: r.id,
          預約者: u?.display_name || u?.email || "",
          Email: u?.email || r.contact_email || "",
          開始時間: fmtTime(r.start_at),
          結束時間: fmtTime(r.end_at),
          狀態: translateBookingStatus(r.status),
          備註: r.user_note || "",
          建立時間: fmtTime(r.created_at),
        };
      });
    }

    // ---------- 所有聊天記錄 ----------
    case "chat_all": {
      const { data, error } = await supabaseAdmin
        .from("chat_messages")
        .select("id, conversation_id, sender_id, content, message_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data || []).map((r) => ({
        訊息ID: r.id,
        對話ID: r.conversation_id,
        發送者ID: r.sender_id,
        內容: r.content || "",
        訊息類型: r.message_type === "system" ? "系統訊息" : "一般訊息",
        發送時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 跑馬燈 ----------
    case "marquee": {
      const { data, error } = await supabaseAdmin
        .from("marquee_items")
        .select("id, type, icon, label, sub, sort_order, is_active")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({
        ID: r.id,
        類型: r.type || "",
        圖示: r.icon || "",
        標題文字: r.label || "",
        副文字: r.sub || "",
        排序: r.sort_order ?? "",
        顯示狀態: r.is_active ? "顯示" : "隱藏",
      }));
    }

    // ---------- Podcast ----------
    case "podcast": {
      const { data, error } = await supabaseAdmin
        .from("podcast_episodes")
        .select("id, title, description, duration, episode_date, category, sort_order, is_active")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({
        ID: r.id,
        標題: r.title,
        描述: r.description || "",
        時長: r.duration || "",
        發布日期: r.episode_date || "",
        分類: r.category || "",
        排序: r.sort_order ?? "",
        顯示狀態: r.is_active ? "顯示" : "隱藏",
      }));
    }

    // ---------- 通知記錄 ----------
    case "notifications": {
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("id, user_id, type, title, body, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(3000);
      if (error) throw error;
      return (data || []).map((r) => ({
        通知ID: r.id,
        接收者ID: r.user_id,
        類型: r.type || "",
        標題: r.title || "",
        內容: r.body || "",
        已讀: r.is_read ? "已讀" : "未讀",
        發送時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 站內文案 ----------
    case "site_content": {
      const { data, error } = await supabaseAdmin
        .from("site_content")
        .select("content_id, content_key, content_value, content_type, updated_at")
        .order("content_key", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({
        ID: r.content_id,
        鍵名: r.content_key,
        內容值: typeof r.content_value === "object" ? JSON.stringify(r.content_value) : String(r.content_value ?? ""),
        類型: r.content_type || "",
        最後更新: fmtTime(r.updated_at),
      }));
    }

    // ---------- 管理員白名單 ----------
    case "whitelist": {
      const { data, error } = await supabaseAdmin
        .from("admin_whitelist")
        .select("whitelist_id, email, display_name, is_active, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({
        ID: r.whitelist_id,
        Email: r.email,
        顯示名稱: r.display_name || "",
        狀態: r.is_active ? "啟用" : "停用",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- Landing Pages ----------
    case "landing_pages": {
      const { data, error } = await supabaseAdmin
        .from("lp_projects")
        .select("id, project_code, project_name, customer_name, status, custom_slug, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        專案ID: r.id,
        專案代碼: r.project_code || "",
        專案名稱: r.project_name || "",
        客戶名稱: r.customer_name || "",
        狀態: r.status === "published" ? "已發布" : r.status || "草稿",
        Slug: r.custom_slug || "",
        建立時間: fmtTime(r.created_at),
      }));
    }

    default:
      return [];
  }
}

function translateBookingStatus(s: string): string {
  const map: Record<string, string> = {
    pending:   "待確認",
    confirmed: "已確認",
    rejected:  "已拒絕",
    cancelled: "已取消",
    completed: "已完成",
  };
  return map[s] || s;
}

// ===== GET /api/admin/export/modules =====

router.get("/modules", ...guard, (_req: Request, res: Response) => {
  res.json({ modules: MODULE_LIST });
});

// ===== GET /api/admin/export/full?format= =====

router.get("/full", ...guard, async (req: Request, res: Response) => {
  const format = ((req.query.format as string) || "xlsx").toLowerCase();
  if (!["md", "txt", "html", "xlsx", "docx"].includes(format)) {
    return res
      .status(400)
      .json({ error: "format 必須是 md / txt / html / xlsx / docx" });
  }

  const dateStr = dateFmt(new Date(), "yyyyMMdd");
  const filename = `Aaron教練系統_全站資料_${dateStr}.${format}`;

  try {
    const modules: ModuleExport[] = [];
    for (const { key, name } of MODULE_LIST) {
      const rows = await fetchModule(key);
      modules.push({ name, rows });
    }

    setDownloadHeaders(res, filename, format);
    let buf: Buffer;
    switch (format) {
      case "md":   buf = toFullMd(modules);          break;
      case "txt":  buf = toFullTxt(modules);         break;
      case "html": buf = toFullHtml(modules);        break;
      case "xlsx": buf = await toFullXlsx(modules);  break;
      case "docx": buf = await toFullDocx(modules);  break;
      default:     buf = toFullTxt(modules);
    }
    res.send(buf);
  } catch (err) {
    logger.error("全站匯出失敗", { error: (err as Error).message });
    res.status(500).json({ error: "匯出失敗，請稍後再試" });
  }
});

// ===== GET /api/admin/export/:module?format= =====

router.get("/:module", ...guard, async (req: Request, res: Response) => {
  const module = req.params["module"] as string;
  const format = ((req.query.format as string) || "xlsx").toLowerCase();

  if (!MODULE_NAMES[module]) {
    return res.status(404).json({ error: "找不到此模組" });
  }
  if (!["md", "txt", "html", "xlsx", "docx"].includes(format)) {
    return res.status(400).json({ error: "format 必須是 md / txt / html / xlsx / docx" });
  }

  const moduleName = MODULE_NAMES[module];
  const dateStr = dateFmt(new Date(), "yyyyMMdd");
  const filename = `${moduleName}_${dateStr}.${format}`;

  try {
    const rows = await fetchModule(module);

    setDownloadHeaders(res, filename, format);
    let buf: Buffer;
    switch (format) {
      case "md":   buf = toMd(rows, moduleName);          break;
      case "txt":  buf = toTxt(rows, moduleName);         break;
      case "html": buf = toHtml(rows, moduleName);        break;
      case "xlsx": buf = await toXlsx(rows, moduleName);  break;
      case "docx": buf = await toDocx(rows, moduleName);  break;
      default:     buf = toTxt(rows, moduleName);
    }
    res.send(buf);
  } catch (err) {
    logger.error(`匯出模組 ${module} 失敗`, { error: (err as Error).message });
    res.status(500).json({ error: "匯出失敗，請稍後再試" });
  }
});

export default router;
