/**
 * @fileoverview 意見反饋路由（開發者 ↔ 教練）
 *
 * 定位：這是「開發者（我）↔ 教練」的內部溝通平台（類似歐捷 ERP 的 客戶↔開發者），
 * 一般學員登入後看不到、也存取不到。全部端點皆需 requireAdmin。
 *
 * 兩個角色都是 admin，共用同一個後台面板（/admin/feedback）：
 *   - 送出訊息（建串 / 回覆）時，前端「以 __ 身分」選擇器會帶 authorRole（developer|coach）
 *   - 後端驗證 authorRole ∈ {developer, coach}；若未帶則用 DEVELOPER_EMAIL 猜（預設 coach）
 *
 * 狀態機（feedback_threads.status）：
 *   waiting_coach     — 等待教練回應（開發者剛發問 / 回覆後）
 *   waiting_developer — 等待開發者回應（教練發問 / 回覆後）
 *   in_progress       — 處理中
 *   resolved          — 已完成
 *   發言後一律轉為「等待對方回應」：developer 發言 → waiting_coach；coach 發言 → waiting_developer。
 *
 * 圖片：
 *   - 私有 bucket `feedback-images`，路徑 `{thread_id}/{ts}-{rand}.{ext}`
 *   - 原檔不壓縮不裁切（不經 sharp），供截圖清晰檢視
 *   - 單訊息 ≤ 6 張、單檔 ≤ 10MB、mime jpeg/png/webp/gif
 *   - 前端透過 GET /api/feedback/images/:imageId/file 串流讀取（僅 admin 可讀）
 *
 * 路由順序注意：Express 依序比對，literal 前綴（/admin、/images、/messages）
 * 必須註冊在動態 `/:id` 之前，否則會被 `/:id` 攔截。
 *
 * DB 相依：035 建表 + 037 把 CHECK 改成 developer|coach / waiting_developer。
 * 037 套用前，若舊 CHECK（member|coach、waiting_member）還在，寫入新值會被 DB 擋下 500。
 */

import express, { Request, Response, Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { sanitizeSearchQuery } from "../utils/sanitizer.js";
import { logger } from "../utils/logger.js";
import { createNotification } from "../utils/notifications.js";

const router: Router = express.Router();

/** 私有 bucket（正式站已建立，原檔不壓縮） */
const FEEDBACK_BUCKET = "feedback-images";

/** thread 狀態白名單 */
const THREAD_STATUSES = [
  "waiting_developer",
  "waiting_coach",
  "in_progress",
  "resolved",
] as const;
type ThreadStatus = (typeof THREAD_STATUSES)[number];

/** 作者角色白名單 */
type AuthorRole = "developer" | "coach";

const TITLE_MAX = 200;
const CONTENT_MAX = 5000;
const MAX_IMAGES = 6;

// ===== 圖片上傳設定（memoryStorage，原檔不經 sharp）=====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.mimetype,
    );
    cb(null, ok);
  },
});

/** 發串 / 回覆限流：同 IP 每 5 分鐘最多 30 次 */
const feedbackWriteLimiter = createRateLimiter(
  5 * 60 * 1000,
  30,
  "操作過於頻繁，請稍後再試",
);

// ===========================================================
// Helpers
// ===========================================================

/** 目前 user 是否為白名單 admin（圖片串流授權用，該路由只掛 authenticateToken）*/
async function isAdminEmail(email: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabaseAdmin
    .from("admin_whitelist")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  return !!data;
}

/**
 * 判定這次送出訊息的身分（developer|coach）。
 * 1) 優先採用前端「以 __ 身分」選擇器帶來的 authorRole。
 * 2) 未帶或非法時，用 env DEVELOPER_EMAIL 對照登入 email：命中 → developer，否則 coach。
 * 兩人都是 admin，這只是決定氣泡左右與通知對象，語意上安全。
 */
function resolveAuthorRole(req: Request): AuthorRole {
  const raw = String(req.body.authorRole || req.body.author_role || "")
    .trim()
    .toLowerCase();
  if (raw === "developer" || raw === "coach") return raw;
  const email = (req.user?.email || "").toLowerCase();
  const devEmail = (process.env.DEVELOPER_EMAIL || "").toLowerCase();
  if (devEmail && email === devEmail) return "developer";
  return "coach";
}

/** 發言後的下一個狀態：等待「對方」回應 */
function nextStatusAfter(role: AuthorRole): ThreadStatus {
  return role === "developer" ? "waiting_coach" : "waiting_developer";
}

type MessageImage = {
  id: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  author_role: AuthorRole;
  author_user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
};

/** 取一批 user_id 的顯示名稱（admin 優先 admin_whitelist.display_name）*/
async function resolveAuthorNames(
  userIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const ids = Array.from(new Set(userIds)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) return map;

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("user_id, username, display_name, email")
    .in("user_id", ids);

  const emails = (users || [])
    .map((u) => u.email)
    .filter(Boolean) as string[];
  const adminNameByEmail = new Map<string, string>();
  if (emails.length) {
    const { data: admins } = await supabaseAdmin
      .from("admin_whitelist")
      .select("email, display_name")
      .in("email", emails)
      .eq("is_active", true);
    (admins || []).forEach((a) => {
      if (a.email && a.display_name)
        adminNameByEmail.set(a.email, a.display_name);
    });
  }

  (users || []).forEach((u) => {
    const adminName = u.email ? adminNameByEmail.get(u.email) : null;
    map.set(
      u.user_id,
      adminName || u.display_name || u.username || `用戶#${u.user_id}`,
    );
  });
  return map;
}

/** 取 thread 的訊息（含圖片、作者名），時間正序 */
async function loadThreadMessages(
  threadId: string,
): Promise<
  (MessageRow & { author_name: string; images: MessageImage[] })[]
> {
  const { data: messages, error } = await supabaseAdmin
    .from("feedback_messages")
    .select(
      "id, thread_id, author_role, author_user_id, content, created_at, updated_at",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (messages || []) as MessageRow[];
  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);
  const { data: images } = await supabaseAdmin
    .from("feedback_images")
    .select("id, message_id, original_name, mime_type, size, created_at")
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });

  const imagesByMsg = new Map<string, MessageImage[]>();
  (images || []).forEach((img) => {
    const list = imagesByMsg.get(img.message_id) || [];
    list.push({
      id: img.id,
      original_name: img.original_name,
      mime_type: img.mime_type,
      size: img.size,
    });
    imagesByMsg.set(img.message_id, list);
  });

  const nameMap = await resolveAuthorNames(rows.map((m) => m.author_user_id));

  return rows.map((m) => ({
    ...m,
    author_name: nameMap.get(m.author_user_id) || `用戶#${m.author_user_id}`,
    images: imagesByMsg.get(m.id) || [],
  }));
}

/** 上傳一組圖片並寫入 feedback_images（best-effort，回傳成功筆數）*/
async function attachImages(
  threadId: string,
  messageId: string,
  files: Express.Multer.File[],
): Promise<number> {
  let ok = 0;
  for (const file of files) {
    try {
      const ext = file.mimetype.split("/")[1] || "bin";
      const stamp = Date.now();
      const random = Math.random().toString(36).slice(2, 8);
      const filePath = `${threadId}/${stamp}-${random}.${ext}`;

      const { error: upErr } = await supabaseAdmin.storage
        .from(FEEDBACK_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "604800",
          upsert: false,
        });
      if (upErr) {
        logger.error("反饋圖片上傳失敗", upErr, { threadId, messageId });
        continue;
      }

      const { error: insErr } = await supabaseAdmin
        .from("feedback_images")
        .insert({
          message_id: messageId,
          file_path: filePath,
          original_name: file.originalname || null,
          mime_type: file.mimetype,
          size: file.size,
        });
      if (insErr) {
        logger.error("反饋圖片寫入失敗", insErr, { threadId, messageId });
        // 回收剛上傳的孤兒檔
        await supabaseAdmin.storage.from(FEEDBACK_BUCKET).remove([filePath]);
        continue;
      }
      ok += 1;
    } catch (err) {
      logger.error("反饋圖片處理例外", err as Error, { threadId, messageId });
    }
  }
  return ok;
}

/** 統一取得 multipart 圖片陣列（限 MAX_IMAGES 張）*/
function getUploadedFiles(req: Request): Express.Multer.File[] {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  return files.slice(0, MAX_IMAGES);
}

type ThreadRow = {
  id: string;
  user_id: number;
  title: string;
  status: ThreadStatus;
  created_at: string;
  updated_at: string;
};

/** 為列表卡片補上：訊息數、最後訊息摘要、是否有圖、發起者名 */
async function buildThreadSummaries(
  threads: ThreadRow[],
): Promise<unknown[]> {
  if (threads.length === 0) return [];
  const threadIds = threads.map((t) => t.id);

  // 每串的訊息（用於算數量 + 取最後一則預覽 + 首則內容）
  const { data: msgs } = await supabaseAdmin
    .from("feedback_messages")
    .select("id, thread_id, content, author_role, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  const countByThread = new Map<string, number>();
  const firstByThread = new Map<string, { content: string }>();
  const lastByThread = new Map<string, { id: string; content: string }>();
  (msgs || []).forEach((m) => {
    countByThread.set(m.thread_id, (countByThread.get(m.thread_id) || 0) + 1);
    if (!firstByThread.has(m.thread_id))
      firstByThread.set(m.thread_id, { content: m.content });
    lastByThread.set(m.thread_id, { id: m.id, content: m.content });
  });

  // 哪些訊息有圖（用於卡片縮圖標記）
  const msgIds = (msgs || []).map((m) => m.id);
  const imageByMsg = new Map<string, string>(); // message_id → 第一張 image id
  if (msgIds.length) {
    const { data: imgs } = await supabaseAdmin
      .from("feedback_images")
      .select("id, message_id, created_at")
      .in("message_id", msgIds)
      .order("created_at", { ascending: true });
    (imgs || []).forEach((img) => {
      if (!imageByMsg.has(img.message_id))
        imageByMsg.set(img.message_id, img.id);
    });
  }

  // 每串第一張圖（依訊息時間序找第一個有圖的訊息）
  const firstImageByThread = new Map<string, string>();
  (msgs || []).forEach((m) => {
    if (firstImageByThread.has(m.thread_id)) return;
    const imgId = imageByMsg.get(m.id);
    if (imgId) firstImageByThread.set(m.thread_id, imgId);
  });

  const nameMap = await resolveAuthorNames(threads.map((t) => t.user_id));

  return threads.map((t) => ({
    id: t.id,
    user_id: t.user_id,
    owner_name: nameMap.get(t.user_id) || `用戶#${t.user_id}`,
    title: t.title,
    status: t.status,
    created_at: t.created_at,
    updated_at: t.updated_at,
    message_count: countByThread.get(t.id) || 0,
    preview: firstByThread.get(t.id)?.content || "",
    last_message: lastByThread.get(t.id)?.content || "",
    first_image_id: firstImageByThread.get(t.id) || null,
  }));
}

/**
 * 推通知給對方（發言方是 developer → 通知教練們；是 coach → 通知開發者）。
 * 教練 = 所有 active admin；開發者 = env DEVELOPER_EMAIL 對應的 user。
 * 一律排除發言者本人；連結指向 /admin/feedback。
 */
async function notifyCounterpart(params: {
  threadId: string;
  title: string;
  content: string;
  authorRole: AuthorRole;
  authorUserId: number;
}): Promise<void> {
  const { threadId, title, content, authorRole, authorUserId } = params;
  const { data: whitelist } = await supabaseAdmin
    .from("admin_whitelist")
    .select("email")
    .eq("is_active", true);
  const emails = (whitelist || []).map((w) => w.email).filter(Boolean);
  if (!emails.length) return;

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("user_id, email")
    .in("email", emails);

  const devEmail = (process.env.DEVELOPER_EMAIL || "").toLowerCase();
  // 收件者：開發者發言 → 通知非開發者（教練）；教練發言 → 通知開發者。
  const recipients = (users || []).filter((u) => {
    if (Number(u.user_id) === authorUserId) return false; // 不通知自己
    const isDev = devEmail && String(u.email || "").toLowerCase() === devEmail;
    return authorRole === "developer" ? !isDev : isDev;
  });
  // 若無法辨識開發者（未設 DEVELOPER_EMAIL），退回通知所有其他 admin，避免漏訊。
  const targets = recipients.length
    ? recipients
    : (users || []).filter((u) => Number(u.user_id) !== authorUserId);

  const roleLabel = authorRole === "developer" ? "開發者" : "教練";
  const preview = (content || "").slice(0, 80);
  await Promise.all(
    targets.map((u) =>
      createNotification({
        userId: u.user_id,
        type: "feedback_reply",
        title: `${roleLabel}在意見反饋留言：${title}`,
        body: preview || "（附圖）",
        link: `/admin/feedback`,
        metadata: { thread_id: threadId },
      }).catch(() => {}),
    ),
  );
}

// ===========================================================
// 管理端 — 列表 / 統計 / 建立（literal 前綴，須在 /:id 之前）
// ===========================================================

/** GET /api/feedback/admin — 全部反饋列表（分頁 + 搜尋 + status 篩選）*/
router.get(
  "/admin",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;
      const statusFilter = String(req.query.status || "").trim();

      let query = supabaseAdmin
        .from("feedback_threads")
        .select("id, user_id, title, status, created_at, updated_at", {
          count: "exact",
        })
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (
        statusFilter &&
        (THREAD_STATUSES as readonly string[]).includes(statusFilter)
      ) {
        query = query.eq("status", statusFilter);
      }

      const safeSearch = sanitizeSearchQuery(req.query.search);
      if (safeSearch) {
        query = query.ilike("title", `%${safeSearch}%`);
      }

      const { data: threads, error, count } = await query;
      if (error) throw error;

      const summaries = await buildThreadSummaries((threads || []) as ThreadRow[]);

      res.json({
        threads: summaries,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      });
    } catch (err) {
      logger.error("取得反饋管理列表失敗", err as Error);
      res.status(500).json({ error: "取得反饋管理列表失敗" });
    }
  },
);

/** GET /api/feedback/admin/stats — 各狀態計數 */
router.get(
  "/admin/stats",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const results = await Promise.all(
        THREAD_STATUSES.map(async (status) => {
          const { count } = await supabaseAdmin
            .from("feedback_threads")
            .select("id", { count: "exact", head: true })
            .eq("status", status);
          return [status, count || 0] as const;
        }),
      );
      const { count: total } = await supabaseAdmin
        .from("feedback_threads")
        .select("id", { count: "exact", head: true });

      const byStatus = Object.fromEntries(results) as Record<
        ThreadStatus,
        number
      >;
      res.json({ total: total || 0, ...byStatus });
    } catch (err) {
      logger.error("取得反饋統計失敗", err as Error);
      res.status(500).json({ error: "取得反饋統計失敗" });
    }
  },
);

/**
 * POST /api/feedback/admin — 建立反饋串（開發者或教練皆可發起，multipart 附圖）
 * body: title, content, authorRole(developer|coach), images[]
 * 狀態：發言後轉為等待對方 → developer 建串=waiting_coach、coach 建串=waiting_developer
 */
router.post(
  "/admin",
  authenticateToken,
  requireAdmin,
  feedbackWriteLimiter,
  upload.array("images", MAX_IMAGES),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const authorRole = resolveAuthorRole(req);
      const title = String(req.body.title || "").trim();
      const content = String(req.body.content || "").trim();
      const files = getUploadedFiles(req);

      if (!title) {
        res.status(400).json({ error: "請填寫標題" });
        return;
      }
      if (title.length > TITLE_MAX) {
        res.status(400).json({ error: `標題需在 ${TITLE_MAX} 字以內` });
        return;
      }
      if (!content && files.length === 0) {
        res.status(400).json({ error: "請填寫內容或附上圖片" });
        return;
      }
      if (content.length > CONTENT_MAX) {
        res.status(400).json({ error: `內容需在 ${CONTENT_MAX} 字以內` });
        return;
      }

      const status = nextStatusAfter(authorRole);

      // 建立 thread（user_id = 發起者本人）
      const { data: thread, error: tErr } = await supabaseAdmin
        .from("feedback_threads")
        .insert({ user_id: userId, title, status })
        .select("id, user_id, title, status, created_at, updated_at")
        .single();
      if (tErr) throw tErr;

      // 首則訊息
      const { data: message, error: mErr } = await supabaseAdmin
        .from("feedback_messages")
        .insert({
          thread_id: thread.id,
          author_role: authorRole,
          author_user_id: userId,
          content,
        })
        .select("id")
        .single();
      if (mErr) throw mErr;

      if (files.length) {
        await attachImages(thread.id, message.id, files);
      }

      void notifyCounterpart({
        threadId: thread.id,
        title: thread.title,
        content,
        authorRole,
        authorUserId: userId,
      }).catch((e) =>
        logger.warn("通知反饋對方失敗", { error: (e as Error)?.message }),
      );

      res.status(201).json({ id: thread.id });
    } catch (err) {
      logger.error("建立反饋失敗", err as Error);
      res.status(500).json({ error: "建立反饋失敗" });
    }
  },
);

/** GET /api/feedback/admin/:id — 反饋詳情（任何串）*/
router.get(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || "");
      const { data: thread } = await supabaseAdmin
        .from("feedback_threads")
        .select("id, user_id, title, status, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      if (!thread) {
        res.status(404).json({ error: "反饋不存在" });
        return;
      }
      const nameMap = await resolveAuthorNames([thread.user_id]);
      const messages = await loadThreadMessages(id);
      res.json({
        ...thread,
        owner_name: nameMap.get(thread.user_id) || `用戶#${thread.user_id}`,
        messages,
      });
    } catch (err) {
      logger.error("取得反饋詳情失敗（admin）", err as Error);
      res.status(500).json({ error: "取得反饋詳情失敗" });
    }
  },
);

/**
 * POST /api/feedback/admin/:id/messages — 回覆（帶 authorRole）
 * developer 回覆 → waiting_coach；coach 回覆 → waiting_developer
 */
router.post(
  "/admin/:id/messages",
  authenticateToken,
  requireAdmin,
  feedbackWriteLimiter,
  upload.array("images", MAX_IMAGES),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const authorRole = resolveAuthorRole(req);
      const id = String(req.params.id || "");
      const content = String(req.body.content || "").trim();
      const files = getUploadedFiles(req);

      if (!content && files.length === 0) {
        res.status(400).json({ error: "請填寫內容或附上圖片" });
        return;
      }
      if (content.length > CONTENT_MAX) {
        res.status(400).json({ error: `內容需在 ${CONTENT_MAX} 字以內` });
        return;
      }

      const { data: thread } = await supabaseAdmin
        .from("feedback_threads")
        .select("id, user_id, title")
        .eq("id", id)
        .maybeSingle();
      if (!thread) {
        res.status(404).json({ error: "反饋不存在" });
        return;
      }

      const { data: message, error: mErr } = await supabaseAdmin
        .from("feedback_messages")
        .insert({
          thread_id: id,
          author_role: authorRole,
          author_user_id: userId,
          content,
        })
        .select("id")
        .single();
      if (mErr) throw mErr;

      if (files.length) await attachImages(id, message.id, files);

      // 回覆後 → 等待對方回應
      await supabaseAdmin
        .from("feedback_threads")
        .update({
          status: nextStatusAfter(authorRole),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      void notifyCounterpart({
        threadId: id,
        title: thread.title,
        content,
        authorRole,
        authorUserId: userId,
      }).catch(() => {});

      res.status(201).json({ id: message.id });
    } catch (err) {
      logger.error("反饋回覆失敗", err as Error);
      res.status(500).json({ error: "回覆失敗" });
    }
  },
);

/** PUT /api/feedback/admin/:id/status — 切換狀態 */
router.put(
  "/admin/:id/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || "");
      const status = String(req.body.status || "");
      if (!(THREAD_STATUSES as readonly string[]).includes(status)) {
        res.status(400).json({ error: "狀態值無效" });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("feedback_threads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, status, updated_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "反饋不存在" });
        return;
      }
      res.json(data);
    } catch (err) {
      logger.error("切換反饋狀態失敗", err as Error);
      res.status(500).json({ error: "切換狀態失敗" });
    }
  },
);

/** PUT /api/feedback/admin/:id/title — 編輯標題 */
router.put(
  "/admin/:id/title",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || "");
      const title = String(req.body.title || "").trim();
      if (!title) {
        res.status(400).json({ error: "標題不可為空" });
        return;
      }
      if (title.length > TITLE_MAX) {
        res.status(400).json({ error: `標題需在 ${TITLE_MAX} 字以內` });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("feedback_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, title, updated_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "反饋不存在" });
        return;
      }
      res.json(data);
    } catch (err) {
      logger.error("編輯反饋標題失敗", err as Error);
      res.status(500).json({ error: "編輯標題失敗" });
    }
  },
);

/** DELETE /api/feedback/admin/:id — 刪整串（連帶清 bucket `{thread_id}/`）*/
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || "");
      const { data: thread } = await supabaseAdmin
        .from("feedback_threads")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (!thread) {
        res.status(404).json({ error: "反饋不存在" });
        return;
      }

      // 先清 bucket 內 `{thread_id}/` 前綴所有檔（best-effort）
      await deleteThreadImages(id);

      // 刪 DB：先刪 messages（feedback_images 若無 FK cascade 則一併處理）
      const { data: msgs } = await supabaseAdmin
        .from("feedback_messages")
        .select("id")
        .eq("thread_id", id);
      const msgIds = (msgs || []).map((m) => m.id);
      if (msgIds.length) {
        await supabaseAdmin
          .from("feedback_images")
          .delete()
          .in("message_id", msgIds);
      }
      await supabaseAdmin.from("feedback_messages").delete().eq("thread_id", id);
      const { error } = await supabaseAdmin
        .from("feedback_threads")
        .delete()
        .eq("id", id);
      if (error) throw error;

      res.json({ success: true });
    } catch (err) {
      logger.error("刪除反饋失敗", err as Error);
      res.status(500).json({ error: "刪除失敗" });
    }
  },
);

/** 清空某 thread 在 bucket 的所有圖片（best-effort）*/
async function deleteThreadImages(threadId: string): Promise<void> {
  try {
    const { data: list } = await supabaseAdmin.storage
      .from(FEEDBACK_BUCKET)
      .list(threadId, { limit: 1000 });
    const paths = (list || []).map((f) => `${threadId}/${f.name}`);
    if (paths.length) {
      await supabaseAdmin.storage.from(FEEDBACK_BUCKET).remove(paths);
    }
  } catch (err) {
    logger.warn("清除反饋圖片失敗（不阻擋刪除）", {
      error: (err as Error)?.message,
      threadId,
    });
  }
}

// ===========================================================
// 圖片串流（literal 前綴，須在 /:id 之前；僅 admin 可讀）
// ===========================================================

/** GET /api/feedback/images/:imageId/file — 串流原檔（僅 admin）*/
router.get(
  "/images/:imageId/file",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const email = req.user?.email || "";
      const imageId = String(req.params.imageId || "");

      // 意見反饋是開發者↔教練的內部平台，一律限 admin 讀取
      const admin = await isAdminEmail(email);
      if (!admin) {
        res.status(403).json({ error: "無權存取此圖片" });
        return;
      }

      const { data: img } = await supabaseAdmin
        .from("feedback_images")
        .select("id, message_id, file_path, mime_type, original_name")
        .eq("id", imageId)
        .maybeSingle();
      if (!img) {
        res.status(404).json({ error: "圖片不存在" });
        return;
      }

      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from(FEEDBACK_BUCKET)
        .download(img.file_path);
      if (dlErr || !blob) {
        logger.error("下載反饋圖片失敗", dlErr || new Error("no blob"), {
          imageId,
        });
        res.status(404).json({ error: "圖片不存在" });
        return;
      }

      const buf = Buffer.from(await blob.arrayBuffer());
      res.setHeader("Content-Type", img.mime_type || "application/octet-stream");
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(img.original_name || "image")}"`,
      );
      res.send(buf);
    } catch (err) {
      logger.error("串流反饋圖片失敗", err as Error);
      res.status(500).json({ error: "讀取圖片失敗" });
    }
  },
);

// ===========================================================
// 訊息編輯 / 刪除（literal 前綴，須在 /:id 之前；僅作者本人）
// ===========================================================

/** PUT /api/feedback/messages/:messageId — 編輯自己的訊息 */
router.put(
  "/messages/:messageId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const messageId = String(req.params.messageId || "");
      const content = String(req.body.content || "").trim();
      if (!content) {
        res.status(400).json({ error: "內容不可為空" });
        return;
      }
      if (content.length > CONTENT_MAX) {
        res.status(400).json({ error: `內容需在 ${CONTENT_MAX} 字以內` });
        return;
      }

      const { data: msg } = await supabaseAdmin
        .from("feedback_messages")
        .select("id, author_user_id")
        .eq("id", messageId)
        .maybeSingle();
      if (!msg) {
        res.status(404).json({ error: "訊息不存在" });
        return;
      }
      // 只能改自己送出的訊息
      if (Number(msg.author_user_id) !== userId) {
        res.status(403).json({ error: "無權編輯此訊息" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("feedback_messages")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", messageId)
        .select("id, content, updated_at")
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      logger.error("編輯反饋訊息失敗", err as Error);
      res.status(500).json({ error: "編輯訊息失敗" });
    }
  },
);

/** DELETE /api/feedback/messages/:messageId — 刪除自己的訊息（連帶刪圖）*/
router.delete(
  "/messages/:messageId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const messageId = String(req.params.messageId || "");

      const { data: msg } = await supabaseAdmin
        .from("feedback_messages")
        .select("id, thread_id, author_user_id")
        .eq("id", messageId)
        .maybeSingle();
      if (!msg) {
        res.status(404).json({ error: "訊息不存在" });
        return;
      }
      if (Number(msg.author_user_id) !== userId) {
        res.status(403).json({ error: "無權刪除此訊息" });
        return;
      }

      // 清該訊息的圖（DB + storage best-effort）
      const { data: imgs } = await supabaseAdmin
        .from("feedback_images")
        .select("id, file_path")
        .eq("message_id", messageId);
      const paths = (imgs || []).map((i) => i.file_path).filter(Boolean);
      if (paths.length) {
        await supabaseAdmin.storage.from(FEEDBACK_BUCKET).remove(paths);
        await supabaseAdmin
          .from("feedback_images")
          .delete()
          .eq("message_id", messageId);
      }

      const { error } = await supabaseAdmin
        .from("feedback_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;

      res.json({ success: true });
    } catch (err) {
      logger.error("刪除反饋訊息失敗", err as Error);
      res.status(500).json({ error: "刪除訊息失敗" });
    }
  },
);

export default router;
