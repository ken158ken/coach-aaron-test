/**
 * @fileoverview 聊天系統路由
 *
 * 涵蓋：1v1 DM + 群組 + 圖片上傳 + 已讀標記 + Realtime 廣播
 *
 * 權限：
 *   - 所有 endpoint 需登入（authenticateToken）
 *   - 1v1 DM：任何兩個用戶都能開（無角色限制）
 *   - 群組：只有 admin_whitelist 成員能建立 / 加成員 / 移成員
 *   - 訊息：只有對話的 participant 能讀寫
 *
 * Realtime：寫入訊息後，後端在 channel `conv-{uuid}` broadcast 'new_message'
 */

import express, { Request, Response, Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router: Router = express.Router();

// ===== 圖片上傳設定 =====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.mimetype,
    );
    cb(null, ok);
  },
});

// ===== Helpers =====

/** 確認 user 是該對話的 participant */
async function ensureParticipant(
  conversationId: string,
  userId: number,
): Promise<{ ok: boolean; role?: "member" | "admin" }> {
  const { data } = await supabaseAdmin
    .from("chat_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { ok: false };
  return { ok: true, role: data.role as "member" | "admin" };
}

/** 取目前 user 是否為 admin（會員 vs 白名單） */
async function isAdminEmail(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("admin_whitelist")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  return !!data;
}

/** 廣播 Realtime 事件 */
async function broadcast(
  conversationId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const ch = supabaseAdmin.channel(`conv-${conversationId}`);
    // 必須 subscribe 後才能 send（service_role 可以）
    await ch.send({ type: "broadcast", event, payload });
  } catch (err) {
    logger.warn("Realtime 廣播失敗（不阻擋訊息送出）", {
      error: (err as Error)?.message,
      conversationId,
      event,
    });
  }
}

/** 把 admin display_name 解析進 user 物件，供前端顯示用 */
type RawUser = {
  user_id: number;
  name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
};
async function enrichUsersWithAdminName(
  users: RawUser[],
): Promise<(RawUser & { admin_display_name: string | null })[]> {
  const emails = users.map((u) => u.email).filter(Boolean) as string[];
  if (!emails.length) return users.map((u) => ({ ...u, admin_display_name: null }));
  const { data: admins } = await supabaseAdmin
    .from("admin_whitelist")
    .select("email, display_name")
    .in("email", emails)
    .eq("is_active", true);
  const map = new Map<string, string>();
  (admins || []).forEach((a) => {
    if (a.email && a.display_name) map.set(a.email, a.display_name);
  });
  return users.map((u) => ({
    ...u,
    admin_display_name: u.email ? map.get(u.email) || null : null,
  }));
}

// ===========================================================
// 對話相關
// ===========================================================

/** GET /api/chat/conversations — 我的所有對話清單 */
router.get(
  "/conversations",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);

      // 找出我有參與的對話 IDs
      const { data: parts, error: pErr } = await supabaseAdmin
        .from("chat_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);
      if (pErr) throw pErr;

      const convIds = (parts || []).map((p) => p.conversation_id);
      if (convIds.length === 0) {
        res.json([]);
        return;
      }

      // 對話 metadata
      const { data: convs, error: cErr } = await supabaseAdmin
        .from("chat_conversations")
        .select("id, type, title, created_by, last_message_at, created_at")
        .in("id", convIds)
        .order("last_message_at", { ascending: false });
      if (cErr) throw cErr;

      // 所有相關 participant + user info
      const { data: allParts } = await supabaseAdmin
        .from("chat_participants")
        .select(
          "conversation_id, user_id, role, user:users!inner(user_id, name:username, display_name, email, avatar_url)",
        )
        .in("conversation_id", convIds);

      // 各對話最後一則訊息（preview）
      const { data: lastMsgs } = await supabaseAdmin
        .from("chat_messages")
        .select("id, conversation_id, sender_id, content, image_url, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      type LastMsgRow = NonNullable<typeof lastMsgs>[number];
      const lastByConv = new Map<string, LastMsgRow>();
      (lastMsgs || []).forEach((m) => {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
      });

      // 未讀計算
      const lastReadByConv = new Map<string, string>();
      (parts || []).forEach((p) =>
        lastReadByConv.set(p.conversation_id, p.last_read_at),
      );

      const unreadResults = await Promise.all(
        convIds.map(async (cid) => {
          const lastRead = lastReadByConv.get(cid);
          if (!lastRead) return [cid, 0] as const;
          const { count } = await supabaseAdmin
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", cid)
            .gt("created_at", lastRead)
            .neq("sender_id", userId);
          return [cid, count || 0] as const;
        }),
      );
      const unreadByConv = new Map(unreadResults);

      // 整理 participant 並 enrich admin display_name
      const partsByConv = new Map<string, RawUser[]>();
      (allParts || []).forEach((p: unknown) => {
        const row = p as {
          conversation_id: string;
          user: RawUser | RawUser[];
        };
        const u = Array.isArray(row.user) ? row.user[0] : row.user;
        if (!u) return;
        const list = partsByConv.get(row.conversation_id) || [];
        list.push(u);
        partsByConv.set(row.conversation_id, list);
      });

      const allUsers = Array.from(partsByConv.values()).flat();
      const enriched = await enrichUsersWithAdminName(allUsers);
      const enrichedById = new Map(enriched.map((u) => [u.user_id, u]));

      const result = (convs || []).map((c) => {
        const participants = (partsByConv.get(c.id) || []).map(
          (u) => enrichedById.get(u.user_id) || u,
        );
        const last = lastByConv.get(c.id);
        return {
          ...c,
          participants,
          last_message: last
            ? {
                id: last.id,
                content: last.content,
                has_image: !!last.image_url,
                sender_id: last.sender_id,
                created_at: last.created_at,
              }
            : null,
          unread_count: unreadByConv.get(c.id) || 0,
        };
      });

      res.json(result);
    } catch (err) {
      logger.error("取得對話清單失敗", err as Error);
      res.status(500).json({ error: "取得對話清單失敗" });
    }
  },
);

/** POST /api/chat/conversations — 建立 / 取得 1v1 DM */
router.post(
  "/conversations",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const { partnerId } = req.body;
      if (!partnerId || Number(partnerId) === userId) {
        res.status(400).json({ error: "partnerId 無效" });
        return;
      }

      // 找看看是否已存在 DM
      const { data: mine } = await supabaseAdmin
        .from("chat_participants")
        .select("conversation_id")
        .eq("user_id", userId);
      const myConvIds = (mine || []).map((p) => p.conversation_id);

      if (myConvIds.length > 0) {
        const { data: shared } = await supabaseAdmin
          .from("chat_participants")
          .select("conversation_id")
          .eq("user_id", Number(partnerId))
          .in("conversation_id", myConvIds);

        const sharedIds = (shared || []).map((p) => p.conversation_id);
        if (sharedIds.length > 0) {
          const { data: dmConv } = await supabaseAdmin
            .from("chat_conversations")
            .select("id, type, title, created_by, last_message_at, created_at")
            .in("id", sharedIds)
            .eq("type", "dm")
            .maybeSingle();
          if (dmConv) {
            res.json({ ...dmConv, _existing: true });
            return;
          }
        }
      }

      // 建立新 DM
      const { data: conv, error: cErr } = await supabaseAdmin
        .from("chat_conversations")
        .insert({ type: "dm", created_by: userId })
        .select()
        .single();
      if (cErr) throw cErr;

      const { error: pErr } = await supabaseAdmin
        .from("chat_participants")
        .insert([
          { conversation_id: conv.id, user_id: userId, role: "member" },
          {
            conversation_id: conv.id,
            user_id: Number(partnerId),
            role: "member",
          },
        ]);
      if (pErr) throw pErr;

      res.json(conv);
    } catch (err) {
      logger.error("建立 DM 失敗", err as Error);
      res.status(500).json({ error: "建立 DM 失敗" });
    }
  },
);

/** POST /api/chat/conversations/group — admin 建群組 */
router.post(
  "/conversations/group",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const email = req.user?.email || "";
      if (!(await isAdminEmail(email))) {
        res.status(403).json({ error: "僅白名單管理員可建立群組" });
        return;
      }
      const { title, memberIds } = req.body;
      if (!title || !Array.isArray(memberIds) || memberIds.length === 0) {
        res.status(400).json({ error: "title 與 memberIds 為必填" });
        return;
      }

      const { data: conv, error: cErr } = await supabaseAdmin
        .from("chat_conversations")
        .insert({ type: "group", title, created_by: userId })
        .select()
        .single();
      if (cErr) throw cErr;

      const uniqueIds = Array.from(
        new Set([userId, ...memberIds.map((x) => Number(x))]),
      );
      const rows = uniqueIds.map((uid) => ({
        conversation_id: conv.id,
        user_id: uid,
        role: uid === userId ? "admin" : "member",
      }));
      const { error: pErr } = await supabaseAdmin
        .from("chat_participants")
        .insert(rows);
      if (pErr) throw pErr;

      res.json(conv);
    } catch (err) {
      logger.error("建立群組失敗", err as Error);
      res.status(500).json({ error: "建立群組失敗" });
    }
  },
);

/** GET /api/chat/conversations/:id — 對話 metadata */
router.get(
  "/conversations/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const id = String(req.params.id || "");
      const { ok } = await ensureParticipant(id, userId);
      if (!ok) {
        res.status(403).json({ error: "未參與此對話" });
        return;
      }

      const { data: conv } = await supabaseAdmin
        .from("chat_conversations")
        .select("id, type, title, created_by, last_message_at, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!conv) {
        res.status(404).json({ error: "對話不存在" });
        return;
      }

      const { data: parts } = await supabaseAdmin
        .from("chat_participants")
        .select(
          "user_id, role, joined_at, user:users!inner(user_id, name:username, display_name, email, avatar_url)",
        )
        .eq("conversation_id", id);

      const users: RawUser[] = (parts || [])
        .map((p: unknown) => {
          const row = p as { user: RawUser | RawUser[] };
          return Array.isArray(row.user) ? row.user[0] : row.user;
        })
        .filter(Boolean);
      const enriched = await enrichUsersWithAdminName(users);
      const enrichedById = new Map(enriched.map((u) => [u.user_id, u]));

      res.json({
        ...conv,
        participants: (parts || []).map((p: unknown) => {
          const row = p as {
            user_id: number;
            role: string;
            joined_at: string;
            user: RawUser | RawUser[];
          };
          const u = Array.isArray(row.user) ? row.user[0] : row.user;
          return {
            user_id: row.user_id,
            role: row.role,
            joined_at: row.joined_at,
            user: enrichedById.get(u.user_id) || u,
          };
        }),
      });
    } catch (err) {
      logger.error("取得對話失敗", err as Error);
      res.status(500).json({ error: "取得對話失敗" });
    }
  },
);

// ===========================================================
// 訊息相關
// ===========================================================

/** GET /api/chat/conversations/:id/messages?before=&limit= */
router.get(
  "/conversations/:id/messages",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const id = String(req.params.id || "");
      const { ok } = await ensureParticipant(id, userId);
      if (!ok) {
        res.status(403).json({ error: "未參與此對話" });
        return;
      }

      const before = String(req.query.before || "");
      const limit = Math.min(Number(req.query.limit) || 50, 100);

      let q = supabaseAdmin
        .from("chat_messages")
        .select(
          "id, conversation_id, sender_id, content, image_url, expires_at, created_at",
        )
        .eq("conversation_id", id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (before) q = q.lt("created_at", before);

      const { data, error } = await q;
      if (error) throw error;
      // 反轉成正向時間順序給前端用
      res.json((data || []).reverse());
    } catch (err) {
      logger.error("取得訊息失敗", err as Error);
      res.status(500).json({ error: "取得訊息失敗" });
    }
  },
);

/** POST /api/chat/conversations/:id/messages — 送訊息（含選填圖片）*/
router.post(
  "/conversations/:id/messages",
  authenticateToken,
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const id = String(req.params.id || "");
      const { ok } = await ensureParticipant(id, userId);
      if (!ok) {
        res.status(403).json({ error: "未參與此對話" });
        return;
      }

      const content = String(req.body.content || "").trim();
      const file = req.file;
      if (!content && !file) {
        res.status(400).json({ error: "訊息內容或圖片至少要有一個" });
        return;
      }

      let imageUrl: string | null = null;
      let imagePath: string | null = null;

      if (file) {
        const ext = file.mimetype.split("/")[1] || "jpg";
        const stamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        imagePath = `${id}/${stamp}-${random}.${ext}`;

        const { error: upErr } = await supabaseAdmin.storage
          .from("chat-images")
          .upload(imagePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: "604800", // 7 天
          });
        if (upErr) {
          logger.error("圖片上傳失敗", upErr);
          res.status(500).json({ error: "圖片上傳失敗" });
          return;
        }
        const { data: pub } = supabaseAdmin.storage
          .from("chat-images")
          .getPublicUrl(imagePath);
        imageUrl = pub.publicUrl;
      }

      const { data: msg, error: insErr } = await supabaseAdmin
        .from("chat_messages")
        .insert({
          conversation_id: id,
          sender_id: userId,
          content,
          image_url: imageUrl,
          image_path: imagePath,
        })
        .select(
          "id, conversation_id, sender_id, content, image_url, expires_at, created_at",
        )
        .single();
      if (insErr) throw insErr;

      // 廣播
      void broadcast(id, "new_message", msg);

      res.json(msg);
    } catch (err) {
      logger.error("送訊息失敗", err as Error);
      res.status(500).json({ error: "送訊息失敗" });
    }
  },
);

/** POST /api/chat/conversations/:id/read — 標記已讀 */
router.post(
  "/conversations/:id/read",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const id = String(req.params.id || "");
      const { error } = await supabaseAdmin
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", id)
        .eq("user_id", userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("標記已讀失敗", err as Error);
      res.status(500).json({ error: "標記已讀失敗" });
    }
  },
);

// ===========================================================
// 群組成員管理（admin only）
// ===========================================================

/** POST /api/chat/conversations/:id/members — 加成員 */
router.post(
  "/conversations/:id/members",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const email = req.user?.email || "";
      const id = String(req.params.id || "");
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ error: "userIds 為必填" });
        return;
      }
      if (!(await isAdminEmail(email))) {
        res.status(403).json({ error: "僅白名單管理員可管理成員" });
        return;
      }

      // 確認此對話是 group
      const { data: conv } = await supabaseAdmin
        .from("chat_conversations")
        .select("type")
        .eq("id", id)
        .maybeSingle();
      if (!conv || conv.type !== "group") {
        res.status(400).json({ error: "僅群組可加成員" });
        return;
      }

      // 確認操作者是該對話 participant
      const { ok } = await ensureParticipant(id, userId);
      if (!ok) {
        res.status(403).json({ error: "未參與此對話" });
        return;
      }

      const rows = userIds.map((uid: number) => ({
        conversation_id: id,
        user_id: Number(uid),
        role: "member",
      }));
      const { error } = await supabaseAdmin
        .from("chat_participants")
        .upsert(rows, { onConflict: "conversation_id,user_id", ignoreDuplicates: true });
      if (error) throw error;

      void broadcast(id, "members_changed", { type: "added", userIds });
      res.json({ success: true });
    } catch (err) {
      logger.error("加成員失敗", err as Error);
      res.status(500).json({ error: "加成員失敗" });
    }
  },
);

/** DELETE /api/chat/conversations/:id/members/:userId — 移成員 */
router.delete(
  "/conversations/:id/members/:userId",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requesterEmail = req.user?.email || "";
      const requesterId = Number(req.user?.userId);
      const id = String(req.params.id || "");
      const userId = String(req.params.userId || "");
      const targetId = Number(userId);

      // 自己離開 OR admin 踢人
      const isAdmin = await isAdminEmail(requesterEmail);
      if (targetId !== requesterId && !isAdmin) {
        res.status(403).json({ error: "僅 admin 可移除其他成員" });
        return;
      }

      const { error } = await supabaseAdmin
        .from("chat_participants")
        .delete()
        .eq("conversation_id", id)
        .eq("user_id", targetId);
      if (error) throw error;

      void broadcast(id, "members_changed", { type: "removed", userIds: [targetId] });
      res.json({ success: true });
    } catch (err) {
      logger.error("移除成員失敗", err as Error);
      res.status(500).json({ error: "移除成員失敗" });
    }
  },
);

// ===========================================================
// 找用戶（讓前端可以挑開 DM 對象 / 群組成員）
// ===========================================================

/** GET /api/chat/users/search?q=... — 搜尋可聊天用戶（不含自己） */
router.get(
  "/users/search",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const me = Number(req.user?.userId);
      const q = String(req.query.q || "").trim();
      let query = supabaseAdmin
        .from("users")
        .select("user_id, name:username, display_name, email, avatar_url")
        .neq("user_id", me)
        .limit(20);
      if (q) {
        // 三欄 ILIKE — users 表欄位是 username（不是 name）
        const safe = q.replace(/[%_,()]/g, "");
        query = query.or(
          `username.ilike.%${safe}%,display_name.ilike.%${safe}%,email.ilike.%${safe}%`,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      const enriched = await enrichUsersWithAdminName((data || []) as RawUser[]);
      res.json(enriched);
    } catch (err) {
      const e = err as { message?: string; details?: string; hint?: string; code?: string };
      logger.error("搜尋用戶失敗", err as Error, {
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
        code: e?.code,
      });
      res.status(500).json({ error: "搜尋用戶失敗" });
    }
  },
);

/** GET /api/chat/admins — 取所有 active admin（給客戶當作可聯絡的對象） */
router.get(
  "/admins",
  authenticateToken,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data: whitelist } = await supabaseAdmin
        .from("admin_whitelist")
        .select("email, display_name, note")
        .eq("is_active", true);
      const emails = (whitelist || []).map((w) => w.email).filter(Boolean) as string[];
      if (emails.length === 0) {
        res.json([]);
        return;
      }
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("user_id, name:username, display_name, email, avatar_url")
        .in("email", emails);

      const wlMap = new Map<string, { display_name: string | null; note: string | null }>();
      (whitelist || []).forEach((w) => {
        if (w.email) wlMap.set(w.email, { display_name: w.display_name, note: w.note });
      });

      const result = (users || []).map((u) => {
        const wl = u.email ? wlMap.get(u.email) : null;
        return {
          ...u,
          admin_display_name: wl?.display_name || null,
          admin_note: wl?.note || null,
        };
      });
      res.json(result);
    } catch (err) {
      logger.error("取得 admin 列表失敗", err as Error);
      res.status(500).json({ error: "取得 admin 列表失敗" });
    }
  },
);

export default router;
