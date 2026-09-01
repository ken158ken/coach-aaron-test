/**
 * @fileoverview 客戶筆記本（阿倫 × 客戶「雙人共筆」，Notion 式頁面樹 + /database 看板）
 *
 * 權限模型（DB 走 supabaseAdmin 繞過 RLS，存取控制全在這一層）：
 *   - coach 本人 / admin_whitelist → 所有筆記本完全存取（role: owner）
 *   - 客戶 → 僅 client_user_id = 自己的筆記本，且該 course_id 在 user_courses
 *     有有效授權（is_active 且未過期）→ 與教練同等編輯權（role: client）
 *   - 金流未接前用 POST /admin/grant-course 手動開通（= fake 購買）；
 *     之後真結帳寫同一張 user_courses，本模組不需任何改動。
 *
 * 端點：
 *   GET    /api/notes/notebooks                筆記本列表（依角色過濾）
 *   POST   /api/notes/notebooks                建立筆記本+root database 頁（僅 owner）
 *   DELETE /api/notes/notebooks/:id            軟刪筆記本（僅 owner）
 *   GET    /api/notes/notebooks/:id/tree       頁面樹（無 content 的輕量列表）
 *   GET    /api/notes/pages/:id                單頁完整內容
 *   POST   /api/notes/pages                    建立子頁
 *   PATCH  /api/notes/pages/:id                更新（content 帶 version 樂觀鎖）
 *   POST   /api/notes/pages/:id/move           搬移（重寫子樹 ancestors）
 *   DELETE /api/notes/pages/:id                軟刪頁+子樹
 *   POST   /api/notes/admin/grant-course       手動開通課程授權（fake 購買）
 *
 * 內容格式：content 為 BlockNote JSON block 陣列（非 HTML），前端由 BlockNote
 * 渲染，無 dangerouslySetInnerHTML 注入面；本層僅驗證型別與大小。
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  requireCoachOrAdmin,
  getActiveCoach,
  isAdminEmail,
} from "../middleware/coachAuth.js";
import { createNotification } from "../utils/notifications.js";
import { logger } from "../utils/logger.js";

const router: Router = express.Router();

// =======================================================
// 常數與驗證
// =======================================================

const LIMITS = {
  title: 300,
  icon: 16,
  categoryId: 64,
  categoryName: 50,
  categoryColor: 30,
  categoriesMax: 50,
  contentBytes: 1_500_000, // BlockNote JSON 字串上限（express json limit 10mb，此處保守）
  subtreeMax: 300, // move/delete 一次可處理的子樹上限（serverless 10s 預算）
};

type NoteRole = "owner" | "client";

interface NotebookRow {
  id: number;
  client_user_id: number;
  course_id: number;
  title: string;
  root_page_id: number | null;
}

interface PageCore {
  id: number;
  notebook_id: number;
  parent_id: number | null;
  ancestors: number[];
  type: "page" | "database";
  title: string;
}

/** PostgREST「資料表不存在」→ 給清楚的 503 而不是含糊 500（039 未貼時） */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  return /could not find the table|relation .* does not exist/i.test(e.message || "");
}

function missingTableRes(res: Response): void {
  res.status(503).json({
    error: "筆記本資料表或欄位尚未同步，請在 Supabase Dashboard 執行 database/migrations 內最新的 039/040 SQL",
  });
}

/** 該用戶對該課程是否有有效授權（user_courses：is_active 且未過期） */
async function hasActiveCourseAccess(
  userId: number,
  courseId: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_courses")
    .select("user_course_id, access_expires_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("is_active", true);
  if (error || !data) return false;
  const now = Date.now();
  return data.some(
    (r) => !r.access_expires_at || new Date(r.access_expires_at).getTime() > now,
  );
}

/** 呼叫者是否為 coach 本人或 admin（notes 的 owner 角色） */
async function isOwnerRequester(req: Request): Promise<boolean> {
  const userId = req.user?.userId;
  const email = req.user?.email;
  if (!userId) return false;
  const coach = await getActiveCoach();
  if (coach && Number(coach.userId) === Number(userId)) return true;
  if (email && (await isAdminEmail(email))) return true;
  return false;
}

/**
 * 解析呼叫者對某筆記本的角色。
 * 回 null = 無權限或筆記本不存在（呼叫端統一回 404，避免洩漏存在性）。
 */
async function resolveNotebookAccess(
  req: Request,
  notebookId: number,
): Promise<{ role: NoteRole; notebook: NotebookRow } | null> {
  const { data: nb, error } = await supabaseAdmin
    .from("notebooks")
    .select("id, client_user_id, course_id, title, root_page_id")
    .eq("id", notebookId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!nb) return null;

  if (await isOwnerRequester(req)) return { role: "owner", notebook: nb };

  const userId = Number(req.user?.userId);
  if (
    Number(nb.client_user_id) === userId &&
    (await hasActiveCourseAccess(userId, nb.course_id))
  ) {
    return { role: "client", notebook: nb };
  }
  return null;
}

/** 載入單頁核心欄位（不含 content），並解析其筆記本存取權 */
async function resolvePageAccess(
  req: Request,
  pageId: number,
): Promise<{ role: NoteRole; notebook: NotebookRow; page: PageCore } | null> {
  const { data: page, error } = await supabaseAdmin
    .from("note_pages")
    .select("id, notebook_id, parent_id, ancestors, type, title")
    .eq("id", pageId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!page) return null;
  const access = await resolveNotebookAccess(req, page.notebook_id);
  if (!access) return null;
  return { ...access, page: page as PageCore };
}

/** 驗證 database 頁的 categories 輸入 → 正規化，失敗回 null */
function parseCategories(
  raw: unknown,
): Array<{ id: string; name: string; color: string }> | null {
  if (!Array.isArray(raw) || raw.length > LIMITS.categoriesMax) return null;
  const out: Array<{ id: string; name: string; color: string }> = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const c = item as Record<string, unknown>;
    if (
      typeof c.id !== "string" ||
      !c.id ||
      c.id.length > LIMITS.categoryId ||
      typeof c.name !== "string" ||
      c.name.length > LIMITS.categoryName ||
      seen.has(c.id)
    ) {
      return null;
    }
    const color =
      typeof c.color === "string" && c.color.length <= LIMITS.categoryColor
        ? c.color
        : "";
    seen.add(c.id);
    out.push({ id: c.id, name: c.name, color });
  }
  return out;
}

/** 驗證 BlockNote content：必須是陣列且序列化大小在上限內 */
function validateContent(raw: unknown): { ok: boolean; error?: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "content 需為 block 陣列" };
  try {
    if (JSON.stringify(raw).length > LIMITS.contentBytes) {
      return { ok: false, error: "內容過大（上限約 1.5MB），請拆頁或改用圖片連結" };
    }
  } catch {
    return { ok: false, error: "content 無法序列化" };
  }
  return { ok: true };
}

const toId = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** 開通課程授權（= fake 購買）：已有列就重新啟用，否則插入（order_id 留 null） */
async function grantCourseAccess(
  userId: number,
  courseId: number,
): Promise<{ reactivated: boolean }> {
  const { data: existing, error: exErr } = await supabaseAdmin
    .from("user_courses")
    .select("user_course_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .limit(1)
    .maybeSingle();
  if (exErr) throw exErr;
  if (existing) {
    const { error } = await supabaseAdmin
      .from("user_courses")
      .update({ is_active: true, access_expires_at: null })
      .eq("user_course_id", existing.user_course_id);
    if (error) throw error;
    return { reactivated: true };
  }
  const { error } = await supabaseAdmin.from("user_courses").insert({
    user_id: userId,
    course_id: courseId,
    order_id: null,
    is_active: true,
  });
  if (error) throw error;
  return { reactivated: false };
}

// =======================================================
// 筆記本
// =======================================================

/** GET /api/notes/notebooks — 依角色列出可見筆記本 */
router.get(
  "/notebooks",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const owner = await isOwnerRequester(req);
      const userId = Number(req.user?.userId);

      // sort_order 為 040 新欄位：未貼時整段退回 updated_at 排序（容錯，不 503）
      const buildQuery = (withSort: boolean) => {
        let q = supabaseAdmin
          .from("notebooks")
          .select(
            withSort
              ? "id, client_user_id, course_id, title, root_page_id, sort_order, updated_at, created_at"
              : "id, client_user_id, course_id, title, root_page_id, updated_at, created_at",
          )
          .is("deleted_at", null);
        q = withSort
          ? q.order("sort_order", { ascending: true }).order("id", { ascending: true })
          : q.order("updated_at", { ascending: false });
        if (!owner) q = q.eq("client_user_id", userId);
        return q;
      };
      let { data: notebooks, error } = await buildQuery(true);
      if (error && isMissingTable(error)) {
        ({ data: notebooks, error } = await buildQuery(false));
      }
      if (error) throw error;
      let rows = (notebooks || []) as unknown as Array<{
        id: number;
        client_user_id: number;
        course_id: number;
        title: string;
        root_page_id: number | null;
        sort_order?: number;
        updated_at: string;
      }>;

      // 客戶：過濾掉沒有有效課程授權的
      if (!owner && rows.length > 0) {
        const courseIds = [...new Set(rows.map((n) => n.course_id))];
        const { data: grants } = await supabaseAdmin
          .from("user_courses")
          .select("course_id, access_expires_at")
          .eq("user_id", userId)
          .eq("is_active", true)
          .in("course_id", courseIds);
        const now = Date.now();
        const ok = new Set(
          (grants || [])
            .filter(
              (g) =>
                !g.access_expires_at ||
                new Date(g.access_expires_at).getTime() > now,
            )
            .map((g) => g.course_id),
        );
        rows = rows.filter((n) => ok.has(n.course_id));
      }

      // 附上客戶與課程名稱（owner 端管理需要；client 端顯示課程名）
      const userIds = [...new Set(rows.map((n) => n.client_user_id))];
      const courseIds = [...new Set(rows.map((n) => n.course_id))];
      const [usersRes, coursesRes] = await Promise.all([
        userIds.length
          ? supabaseAdmin
              .from("users")
              .select("user_id, display_name, email")
              .in("user_id", userIds)
          : Promise.resolve({ data: [] as Array<{ user_id: number; display_name: string | null; email: string }> }),
        courseIds.length
          ? supabaseAdmin
              .from("courses")
              .select("course_id, course_title")
              .in("course_id", courseIds)
          : Promise.resolve({ data: [] as Array<{ course_id: number; course_title: string }> }),
      ]);
      const userMap = new Map(
        (usersRes.data || []).map((u) => [u.user_id, u]),
      );
      const courseMap = new Map(
        (coursesRes.data || []).map((c) => [c.course_id, c]),
      );

      res.json({
        role: owner ? "owner" : "client",
        notebooks: rows.map((n) => ({
          id: n.id,
          title: n.title,
          rootPageId: n.root_page_id,
          courseId: n.course_id,
          courseTitle: courseMap.get(n.course_id)?.course_title || "",
          clientUserId: n.client_user_id,
          clientName:
            userMap.get(n.client_user_id)?.display_name ||
            userMap.get(n.client_user_id)?.email ||
            "",
          sortOrder: n.sort_order ?? null,
          updatedAt: n.updated_at,
        })),
      });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("列出筆記本失敗", err as Error);
      res.status(500).json({ error: "列出筆記本失敗" });
    }
  },
);

/** POST /api/notes/notebooks — 建立筆記本 + root database 頁（僅 owner） */
router.post(
  "/notebooks",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const clientUserId = toId(req.body?.clientUserId);
      const courseId = toId(req.body?.courseId);
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
      if (!clientUserId || !courseId || !title || title.length > LIMITS.title) {
        res.status(400).json({ error: "clientUserId / courseId / title 必填且格式正確" });
        return;
      }

      const [{ data: user }, { data: course }] = await Promise.all([
        supabaseAdmin.from("users").select("user_id, display_name").eq("user_id", clientUserId).maybeSingle(),
        supabaseAdmin.from("courses").select("course_id, course_title").eq("course_id", courseId).maybeSingle(),
      ]);
      if (!user) {
        res.status(400).json({ error: "客戶不存在" });
        return;
      }
      if (!course) {
        res.status(400).json({ error: "課程不存在" });
        return;
      }

      // sort_order 為 040 新欄位：未貼時退回不帶該欄位的插入（容錯）
      let ins = await supabaseAdmin
        .from("notebooks")
        .insert({ client_user_id: clientUserId, course_id: courseId, title, sort_order: Date.now() })
        .select("id, client_user_id, course_id, title, root_page_id")
        .single();
      if (ins.error && isMissingTable(ins.error)) {
        ins = await supabaseAdmin
          .from("notebooks")
          .insert({ client_user_id: clientUserId, course_id: courseId, title })
          .select("id, client_user_id, course_id, title, root_page_id")
          .single();
      }
      const { data: nb, error: nbErr } = ins;
      if (nbErr) {
        if (nbErr.code === "23505") {
          res.status(409).json({ error: "該客戶 × 課程的筆記本已存在" });
          return;
        }
        throw nbErr;
      }

      // root：database 頁（Notion 用法的「季方案」看板）
      const { data: root, error: rootErr } = await supabaseAdmin
        .from("note_pages")
        .insert({
          notebook_id: nb.id,
          parent_id: null,
          ancestors: [],
          type: "database",
          title,
          categories: [],
          created_by: req.user?.userId,
          updated_by: req.user?.userId,
        })
        .select("id")
        .single();
      if (rootErr) throw rootErr;

      await supabaseAdmin
        .from("notebooks")
        .update({ root_page_id: root.id })
        .eq("id", nb.id);

      void createNotification({
        userId: clientUserId,
        type: "note_shared",
        title: "📓 教練為你建立了課程筆記本",
        body: title,
        link: "/notes",
        metadata: { notebook_id: nb.id },
      }).catch(() => {});

      res.status(201).json({ ...nb, root_page_id: root.id });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("建立筆記本失敗", err as Error);
      res.status(500).json({ error: "建立筆記本失敗" });
    }
  },
);

/** DELETE /api/notes/notebooks/:id — 軟刪（僅 owner） */
router.delete(
  "/notebooks/:id",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "id 格式錯誤" });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("notebooks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        res.status(404).json({ error: "筆記本不存在" });
        return;
      }
      // 連帶軟刪整本的頁面——否則子頁的 deleted_at 恆為 null，
      // 讀取雖然都經過 notebook 過濾看不到，但資料會無人回收地累積
      await supabaseAdmin
        .from("note_pages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("notebook_id", id)
        .is("deleted_at", null);
      res.json({ ok: true });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("刪除筆記本失敗", err as Error);
      res.status(500).json({ error: "刪除筆記本失敗" });
    }
  },
);

/**
 * PATCH /api/notes/notebooks/:id — 改標題／轉移給另一個會員（僅 owner）
 *
 * 轉移（clientUserId）＝後台樹把整本筆記本拖到另一個會員底下：
 * 舊會員即刻失去存取、新會員取得（仍需其對該課程有有效授權才看得到；
 * grantCourse=true 順便開通）。撞 (client, course) 部分唯一索引 → 409。
 */
router.patch(
  "/notebooks/:id",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "id 格式錯誤" });
        return;
      }
      const { data: nb, error: nbErr } = await supabaseAdmin
        .from("notebooks")
        .select("id, client_user_id, course_id, title")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (nbErr) throw nbErr;
      if (!nb) {
        res.status(404).json({ error: "筆記本不存在" });
        return;
      }

      const b = req.body || {};
      const patch: Record<string, unknown> = {};

      if (b.title !== undefined) {
        if (
          typeof b.title !== "string" ||
          !b.title.trim() ||
          b.title.trim().length > LIMITS.title
        ) {
          res.status(400).json({ error: "標題格式錯誤或過長" });
          return;
        }
        patch.title = b.title.trim();
      }

      let newClientId: number | null = null;
      if (b.clientUserId !== undefined) {
        const cid = toId(b.clientUserId);
        if (!cid) {
          res.status(400).json({ error: "clientUserId 格式錯誤" });
          return;
        }
        if (cid !== Number(nb.client_user_id)) {
          const { data: user } = await supabaseAdmin
            .from("users")
            .select("user_id")
            .eq("user_id", cid)
            .maybeSingle();
          if (!user) {
            res.status(400).json({ error: "目標會員不存在" });
            return;
          }
          newClientId = cid;
          patch.client_user_id = cid;
        }
      }

      if (b.sortOrder !== undefined) {
        if (typeof b.sortOrder !== "number" || !Number.isFinite(b.sortOrder)) {
          res.status(400).json({ error: "sortOrder 格式錯誤" });
          return;
        }
        patch.sort_order = b.sortOrder; // 040 欄位；未貼時 update 會落入 503 容錯訊息
      }

      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: "沒有要更新的欄位" });
        return;
      }
      patch.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabaseAdmin
        .from("notebooks")
        .update(patch)
        .eq("id", id)
        .select("id, client_user_id, course_id, title, root_page_id")
        .single();
      if (error) {
        if (error.code === "23505") {
          res.status(409).json({ error: "目標會員已有此課程的筆記本" });
          return;
        }
        throw error;
      }

      if (newClientId) {
        if (b.grantCourse === true) {
          await grantCourseAccess(newClientId, nb.course_id);
        }
        void createNotification({
          userId: newClientId,
          type: "note_shared",
          title: "📓 教練為你建立了課程筆記本",
          body: updated.title,
          link: "/notes",
          metadata: { notebook_id: id },
        }).catch(() => {});
      }

      res.json(updated);
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("更新筆記本失敗", err as Error);
      res.status(500).json({ error: "更新筆記本失敗" });
    }
  },
);

/** GET /api/notes/notebooks/:id/tree — 頁面樹（輕量，無 content） */
router.get(
  "/notebooks/:id/tree",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "id 格式錯誤" });
        return;
      }
      const access = await resolveNotebookAccess(req, id);
      if (!access) {
        res.status(404).json({ error: "筆記本不存在或無權限" });
        return;
      }
      const { data: pages, error } = await supabaseAdmin
        .from("note_pages")
        .select("id, parent_id, type, title, icon, category_id, sort_order, version, updated_at")
        .eq("notebook_id", id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      res.json({
        role: access.role,
        notebook: {
          id: access.notebook.id,
          title: access.notebook.title,
          rootPageId: access.notebook.root_page_id,
          courseId: access.notebook.course_id,
          clientUserId: access.notebook.client_user_id,
        },
        pages: pages || [],
      });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("讀取頁面樹失敗", err as Error);
      res.status(500).json({ error: "讀取頁面樹失敗" });
    }
  },
);

// =======================================================
// 頁面
// =======================================================

/** GET /api/notes/pages/:id — 單頁完整內容 */
router.get(
  "/pages/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "id 格式錯誤" });
        return;
      }
      const access = await resolvePageAccess(req, id);
      if (!access) {
        res.status(404).json({ error: "頁面不存在或無權限" });
        return;
      }
      const { data: page, error } = await supabaseAdmin
        .from("note_pages")
        .select("id, notebook_id, parent_id, ancestors, type, title, icon, content, categories, category_id, sort_order, version, updated_at, updated_by")
        .eq("id", id)
        .single();
      if (error) throw error;
      res.json({ role: access.role, page });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("讀取頁面失敗", err as Error);
      res.status(500).json({ error: "讀取頁面失敗" });
    }
  },
);

/** POST /api/notes/pages — 建立子頁（parentId 必填；root 只在建筆記本時產生） */
router.post(
  "/pages",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const notebookId = toId(req.body?.notebookId);
      const parentId = toId(req.body?.parentId);
      const type = req.body?.type === "database" ? "database" : "page";
      const title = typeof req.body?.title === "string" ? req.body.title.slice(0, LIMITS.title) : "";
      const categoryId =
        typeof req.body?.categoryId === "string" && req.body.categoryId.length <= LIMITS.categoryId
          ? req.body.categoryId
          : null;
      if (!notebookId || !parentId) {
        res.status(400).json({ error: "notebookId 與 parentId 必填" });
        return;
      }
      const access = await resolveNotebookAccess(req, notebookId);
      if (!access) {
        res.status(404).json({ error: "筆記本不存在或無權限" });
        return;
      }
      const { data: parent, error: pErr } = await supabaseAdmin
        .from("note_pages")
        .select("id, notebook_id, ancestors")
        .eq("id", parentId)
        .is("deleted_at", null)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!parent || Number(parent.notebook_id) !== notebookId) {
        res.status(400).json({ error: "父頁不存在或不屬於此筆記本" });
        return;
      }

      const sortOrder =
        typeof req.body?.sortOrder === "number" && Number.isFinite(req.body.sortOrder)
          ? req.body.sortOrder
          : Date.now();

      const { data: page, error } = await supabaseAdmin
        .from("note_pages")
        .insert({
          notebook_id: notebookId,
          parent_id: parentId,
          ancestors: [...(parent.ancestors || []), parentId],
          type,
          title,
          category_id: categoryId,
          categories: type === "database" ? [] : null,
          sort_order: sortOrder,
          created_by: req.user?.userId,
          updated_by: req.user?.userId,
        })
        .select("id, parent_id, type, title, icon, category_id, sort_order, version, updated_at")
        .single();
      if (error) throw error;
      res.status(201).json(page);
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("建立頁面失敗", err as Error);
      res.status(500).json({ error: "建立頁面失敗" });
    }
  },
);

/**
 * PATCH /api/notes/pages/:id — 更新
 *
 * - content 更新必須帶 version（樂觀鎖）：不符 → 409 + currentVersion，
 *   前端提示重載。version 只隨 content 遞增，metadata 不動它——
 *   否則改個標題就會讓另一端的自動儲存誤撞 409。
 * - metadata（title/icon/categoryId/sortOrder/categories）last-write-wins。
 */
router.patch(
  "/pages/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "id 格式錯誤" });
        return;
      }
      const access = await resolvePageAccess(req, id);
      if (!access) {
        res.status(404).json({ error: "頁面不存在或無權限" });
        return;
      }

      const b = req.body || {};
      const meta: Record<string, unknown> = {};
      if (b.title !== undefined) {
        if (typeof b.title !== "string" || b.title.length > LIMITS.title) {
          res.status(400).json({ error: "標題格式錯誤或過長" });
          return;
        }
        meta.title = b.title;
      }
      if (b.icon !== undefined) {
        if (b.icon !== null && (typeof b.icon !== "string" || b.icon.length > LIMITS.icon)) {
          res.status(400).json({ error: "icon 格式錯誤" });
          return;
        }
        meta.icon = b.icon;
      }
      if (b.categoryId !== undefined) {
        if (b.categoryId !== null && (typeof b.categoryId !== "string" || b.categoryId.length > LIMITS.categoryId)) {
          res.status(400).json({ error: "categoryId 格式錯誤" });
          return;
        }
        meta.category_id = b.categoryId;
      }
      if (b.sortOrder !== undefined) {
        if (typeof b.sortOrder !== "number" || !Number.isFinite(b.sortOrder)) {
          res.status(400).json({ error: "sortOrder 格式錯誤" });
          return;
        }
        meta.sort_order = b.sortOrder;
      }
      if (b.categories !== undefined) {
        if (access.page.type !== "database") {
          res.status(400).json({ error: "只有 database 頁可設定 categories" });
          return;
        }
        const cats = parseCategories(b.categories);
        if (!cats) {
          res.status(400).json({ error: "categories 格式錯誤" });
          return;
        }
        meta.categories = cats;
      }

      const hasContent = b.content !== undefined;
      if (!hasContent && Object.keys(meta).length === 0) {
        res.status(400).json({ error: "沒有要更新的欄位" });
        return;
      }

      const stamp = {
        updated_at: new Date().toISOString(),
        updated_by: req.user?.userId,
      };

      if (hasContent) {
        const check = validateContent(b.content);
        if (!check.ok) {
          res.status(400).json({ error: check.error });
          return;
        }
        const version = Number(b.version);
        if (!Number.isInteger(version) || version < 1) {
          res.status(400).json({ error: "content 更新必須帶當前 version" });
          return;
        }
        const { data: updated, error } = await supabaseAdmin
          .from("note_pages")
          .update({ ...meta, ...stamp, content: b.content, version: version + 1 })
          .eq("id", id)
          .eq("version", version)
          .select("id, version, updated_at")
          .maybeSingle();
        if (error) throw error;
        if (!updated) {
          const { data: cur } = await supabaseAdmin
            .from("note_pages")
            .select("version, updated_by")
            .eq("id", id)
            .single();
          res.status(409).json({
            error: "內容已被對方更新，請重新載入後再編輯",
            currentVersion: cur?.version ?? null,
          });
          return;
        }
        res.json(updated);
        return;
      }

      const { data: updated, error } = await supabaseAdmin
        .from("note_pages")
        .update({ ...meta, ...stamp })
        .eq("id", id)
        .select("id, version, updated_at")
        .single();
      if (error) throw error;
      res.json(updated);
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("更新頁面失敗", err as Error);
      res.status(500).json({ error: "更新頁面失敗" });
    }
  },
);

/** POST /api/notes/pages/:id/move — 搬移（同筆記本內；重寫子樹 ancestors） */
router.post(
  "/pages/:id/move",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      const parentId = toId(req.body?.parentId);
      if (!id || !parentId) {
        res.status(400).json({ error: "id 與 parentId 必填" });
        return;
      }
      const access = await resolvePageAccess(req, id);
      if (!access) {
        res.status(404).json({ error: "頁面不存在或無權限" });
        return;
      }
      if (access.page.parent_id === null) {
        res.status(400).json({ error: "root 頁不可搬移" });
        return;
      }
      if (parentId === id) {
        res.status(400).json({ error: "不可移到自己底下" });
        return;
      }
      const { data: parent, error: pErr } = await supabaseAdmin
        .from("note_pages")
        .select("id, notebook_id, ancestors")
        .eq("id", parentId)
        .is("deleted_at", null)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!parent || Number(parent.notebook_id) !== access.page.notebook_id) {
        res.status(400).json({ error: "目標父頁不存在或不屬於同一筆記本" });
        return;
      }
      if ((parent.ancestors || []).includes(id)) {
        res.status(400).json({ error: "不可移到自己的子頁底下" });
        return;
      }

      const newAncestors = [...(parent.ancestors || []), parentId];
      const patch: Record<string, unknown> = {
        parent_id: parentId,
        ancestors: newAncestors,
        updated_at: new Date().toISOString(),
        updated_by: req.user?.userId,
      };
      if (typeof req.body?.sortOrder === "number" && Number.isFinite(req.body.sortOrder)) {
        patch.sort_order = req.body.sortOrder;
      }
      if (req.body?.categoryId !== undefined) {
        patch.category_id =
          typeof req.body.categoryId === "string" && req.body.categoryId.length <= LIMITS.categoryId
            ? req.body.categoryId
            : null;
      }
      const { error: upErr } = await supabaseAdmin
        .from("note_pages")
        .update(patch)
        .eq("id", id);
      if (upErr) throw upErr;

      // 子樹 ancestors 前綴替換：[...舊前綴, id, ...尾段] → [...newAncestors, id, ...尾段]
      const { data: subtree, error: sErr } = await supabaseAdmin
        .from("note_pages")
        .select("id, ancestors")
        .contains("ancestors", [id])
        .is("deleted_at", null);
      if (sErr) throw sErr;
      const nodes = subtree || [];
      if (nodes.length > LIMITS.subtreeMax) {
        res.status(400).json({ error: `子樹過大（>${LIMITS.subtreeMax} 頁），請分段搬移` });
        return;
      }
      for (const node of nodes) {
        const anc: number[] = node.ancestors || [];
        const idx = anc.indexOf(id);
        if (idx < 0) continue;
        const next = [...newAncestors, ...anc.slice(idx)];
        const { error: nErr } = await supabaseAdmin
          .from("note_pages")
          .update({ ancestors: next })
          .eq("id", node.id);
        if (nErr) throw nErr;
      }

      res.json({ ok: true, movedSubtreePages: nodes.length });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("搬移頁面失敗", err as Error);
      res.status(500).json({ error: "搬移頁面失敗" });
    }
  },
);

/** DELETE /api/notes/pages/:id — 軟刪頁 + 子樹（root 不可刪） */
router.delete(
  "/pages/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = toId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "id 格式錯誤" });
        return;
      }
      const access = await resolvePageAccess(req, id);
      if (!access) {
        res.status(404).json({ error: "頁面不存在或無權限" });
        return;
      }
      if (access.page.parent_id === null) {
        res.status(400).json({ error: "root 頁不可刪除（請改刪整本筆記本）" });
        return;
      }
      const now = new Date().toISOString();
      const { error: e1 } = await supabaseAdmin
        .from("note_pages")
        .update({ deleted_at: now, updated_by: req.user?.userId })
        .eq("id", id);
      if (e1) throw e1;
      const { error: e2 } = await supabaseAdmin
        .from("note_pages")
        .update({ deleted_at: now })
        .contains("ancestors", [id])
        .is("deleted_at", null);
      if (e2) throw e2;
      res.json({ ok: true });
    } catch (err) {
      if (isMissingTable(err)) return missingTableRes(res);
      logger.error("刪除頁面失敗", err as Error);
      res.status(500).json({ error: "刪除頁面失敗" });
    }
  },
);

// =======================================================
// 管理：手動開通課程授權（= 金流未接前的 fake 購買）
// =======================================================

/** POST /api/notes/admin/grant-course — {userId, courseId}（僅 coach/admin） */
router.post(
  "/admin/grant-course",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = toId(req.body?.userId);
      const courseId = toId(req.body?.courseId);
      if (!userId || !courseId) {
        res.status(400).json({ error: "userId 與 courseId 必填" });
        return;
      }
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("user_courses")
        .select("user_course_id, is_active")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .limit(1)
        .maybeSingle();
      if (exErr) throw exErr;

      if (existing) {
        const { error } = await supabaseAdmin
          .from("user_courses")
          .update({ is_active: true, access_expires_at: null })
          .eq("user_course_id", existing.user_course_id);
        if (error) throw error;
        res.json({ ok: true, reactivated: true });
        return;
      }
      const { error } = await supabaseAdmin.from("user_courses").insert({
        user_id: userId,
        course_id: courseId,
        order_id: null, // 手動開通（fake 購買）：不掛訂單；真金流上線後由結帳流程寫入
        is_active: true,
      });
      if (error) throw error;
      res.status(201).json({ ok: true, granted: true });
    } catch (err) {
      logger.error("開通課程授權失敗", err as Error);
      res.status(500).json({ error: "開通課程授權失敗" });
    }
  },
);

export default router;
