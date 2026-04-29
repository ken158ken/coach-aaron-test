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
      const { data } = await supabaseAdmin
        .from("users")
        .select("user_id, username, display_name, email, phone, sex, is_active, email_verified, created_at")
        .order("created_at", { ascending: false });
      return (data || []).map((r) => ({
        用戶ID: r.user_id,
        帳號: r.username || "",
        顯示名稱: r.display_name || "",
        Email: r.email,
        電話: r.phone || "",
        性別: r.sex === "male" ? "男" : r.sex === "female" ? "女" : r.sex || "",
        帳號狀態: r.is_active ? "啟用" : "停用",
        Email驗證: r.email_verified ? "已驗證" : "未驗證",
        加入時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 課程 ----------
    case "courses": {
      const { data } = await supabaseAdmin
        .from("courses")
        .select("course_id, title, category, level, price, status, created_at")
        .order("created_at", { ascending: false });
      return (data || []).map((r) => ({
        課程ID: r.course_id,
        課程名稱: r.title,
        分類: r.category || "",
        難度: r.level || "",
        價格: r.price ?? "",
        狀態: r.status === "published" ? "已發布" : "草稿",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 文章 ----------
    case "articles": {
      const { data } = await supabaseAdmin
        .from("articles")
        .select("article_id, title, slug, category, status, view_count, created_at")
        .order("created_at", { ascending: false });
      return (data || []).map((r) => ({
        文章ID: r.article_id,
        標題: r.title,
        Slug: r.slug || "",
        分類: r.category || "",
        狀態: r.status === "published" ? "已發布" : "草稿",
        瀏覽數: r.view_count ?? 0,
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- Reels 影片 ----------
    case "videos": {
      const { data } = await supabaseAdmin
        .from("videos")
        .select("id, title, platform, category, url, is_active, created_at")
        .order("created_at", { ascending: false });
      return (data || []).map((r) => ({
        ID: r.id,
        標題: r.title || "",
        平台: r.platform || "",
        分類: r.category || "",
        網址: r.url || "",
        顯示狀態: r.is_active ? "顯示" : "隱藏",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 教學影片 ----------
    case "lessons": {
      const { data } = await supabaseAdmin
        .from("lesson_videos")
        .select("id, title, loom_id, duration_seconds, keywords, is_published, created_at")
        .order("created_at", { ascending: false });
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
      const { data } = await supabaseAdmin
        .from("bookings")
        .select(
          `id, status, starts_at, ends_at, notes, created_at,
           users:user_id(display_name, email)`,
        )
        .order("starts_at", { ascending: false });
      return (data || []).map((r) => {
        const u = r.users as { display_name?: string; email?: string } | null;
        return {
          預約ID: r.id,
          預約者: u?.display_name || u?.email || "",
          Email: u?.email || "",
          開始時間: fmtTime(r.starts_at),
          結束時間: fmtTime(r.ends_at),
          狀態: translateBookingStatus(r.status),
          備註: r.notes || "",
          建立時間: fmtTime(r.created_at),
        };
      });
    }

    // ---------- 所有聊天記錄 ----------
    case "chat_all": {
      const { data } = await supabaseAdmin
        .from("chat_messages")
        .select(
          `id, conversation_id, content, message_type, created_at,
           users:sender_id(display_name, email)`,
        )
        .order("created_at", { ascending: false })
        .limit(5000); // 避免太大
      return (data || []).map((r) => {
        const u = r.users as { display_name?: string; email?: string } | null;
        return {
          訊息ID: r.id,
          對話ID: r.conversation_id,
          發送者: u?.display_name || u?.email || "",
          Email: u?.email || "",
          內容: r.content || "",
          訊息類型: r.message_type === "system" ? "系統訊息" : "一般訊息",
          發送時間: fmtTime(r.created_at),
        };
      });
    }

    // ---------- 跑馬燈 ----------
    case "marquee": {
      const { data } = await supabaseAdmin
        .from("marquee_items")
        .select("id, text, type, sort_order, is_active, created_at")
        .order("sort_order", { ascending: true });
      return (data || []).map((r) => ({
        ID: r.id,
        文字內容: r.text,
        類型: r.type || "",
        排序: r.sort_order ?? "",
        顯示狀態: r.is_active ? "顯示" : "隱藏",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- Podcast ----------
    case "podcast": {
      const { data } = await supabaseAdmin
        .from("podcast_episodes")
        .select("id, title, description, url, platform, published_at, is_active, created_at")
        .order("published_at", { ascending: false });
      return (data || []).map((r) => ({
        ID: r.id,
        標題: r.title,
        描述: r.description || "",
        連結: r.url || "",
        平台: r.platform || "",
        發布日期: r.published_at ? fmtTime(r.published_at) : "",
        顯示狀態: r.is_active ? "顯示" : "隱藏",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- 通知記錄 ----------
    case "notifications": {
      const { data } = await supabaseAdmin
        .from("notifications")
        .select(
          `id, type, title, body, is_read, created_at,
           users:user_id(display_name, email)`,
        )
        .order("created_at", { ascending: false })
        .limit(3000);
      return (data || []).map((r) => {
        const u = r.users as { display_name?: string; email?: string } | null;
        return {
          通知ID: r.id,
          接收者: u?.display_name || u?.email || "",
          Email: u?.email || "",
          類型: r.type || "",
          標題: r.title || "",
          內容: r.body || "",
          已讀: r.is_read ? "已讀" : "未讀",
          發送時間: fmtTime(r.created_at),
        };
      });
    }

    // ---------- 站內文案 ----------
    case "site_content": {
      const { data } = await supabaseAdmin
        .from("site_content")
        .select("id, key, value, type, updated_at")
        .order("key", { ascending: true });
      return (data || []).map((r) => ({
        ID: r.id,
        鍵名: r.key,
        內容值: typeof r.value === "object" ? JSON.stringify(r.value) : String(r.value ?? ""),
        類型: r.type || "",
        最後更新: fmtTime(r.updated_at),
      }));
    }

    // ---------- 管理員白名單 ----------
    case "whitelist": {
      const { data } = await supabaseAdmin
        .from("admin_whitelist")
        .select("id, email, display_name, is_active, created_at")
        .order("created_at", { ascending: true });
      return (data || []).map((r) => ({
        ID: r.id,
        Email: r.email,
        顯示名稱: r.display_name || "",
        狀態: r.is_active ? "啟用" : "停用",
        建立時間: fmtTime(r.created_at),
      }));
    }

    // ---------- Landing Pages ----------
    case "landing_pages": {
      const { data } = await supabaseAdmin
        .from("lp_projects")
        .select("id, name, slug, template_id, is_published, created_at")
        .order("created_at", { ascending: false });
      return (data || []).map((r) => ({
        專案ID: r.id,
        專案名稱: r.name || "",
        Slug: r.slug || "",
        模板ID: r.template_id ?? "",
        發布狀態: r.is_published ? "已發布" : "草稿",
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

// ===== GET /api/admin/export/full =====

router.get("/full", ...guard, async (_req: Request, res: Response) => {
  const dateStr = dateFmt(new Date(), "yyyyMMdd");
  const filename = `Aaron教練系統_全站資料_${dateStr}.xlsx`;

  try {
    const modules: ModuleExport[] = [];
    for (const { key, name } of MODULE_LIST) {
      const rows = await fetchModule(key);
      modules.push({ name, rows });
    }

    const buf = await toFullXlsx(modules);
    setDownloadHeaders(res, filename, "xlsx");
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
