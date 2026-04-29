/**
 * 會員端匯出路由
 *
 * GET /api/export/my-chats          → 取得自己的所有對話列表（供會員中心顯示）
 * GET /api/export/chat/:id?format=  → 匯出單一對話（md/txt/xlsx/docx）
 *
 * 安全：只能匯出自己參與的對話
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import {
  setDownloadHeaders,
  chatToMd,
  chatToTxt,
  chatToXlsx,
  chatToDocx,
  type ChatExportMessage,
} from "../utils/exportHelpers.js";
import { format as dateFmt } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const router: Router = express.Router();
const TZ = "Asia/Taipei";

function fmtTime(iso: string): string {
  try {
    return dateFmt(toZonedTime(new Date(iso), TZ), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
}

// ===== GET /api/export/my-chats =====
// 傳回登入者參與的所有對話，供前端顯示清單

router.get("/my-chats", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data, error } = await supabaseAdmin
    .from("chat_conversations")
    .select(
      `id, type, name, created_at,
       chat_participants!inner(user_id),
       chat_messages(count)`,
    )
    .eq("chat_participants.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("取得對話列表失敗", { error: error.message });
    return res.status(500).json({ error: "取得對話列表失敗" });
  }

  // 補齊 other_name（DM 的對方名稱）
  const result = await Promise.all(
    (data || []).map(async (conv) => {
      let displayName = conv.name || `對話 ${conv.id.slice(0, 8)}`;
      if (conv.type === "dm") {
        const { data: parts } = await supabaseAdmin
          .from("chat_participants")
          .select("user_id, users(display_name, username, email)")
          .eq("conversation_id", conv.id)
          .neq("user_id", userId)
          .limit(1)
          .maybeSingle();
        if (parts) {
          const u = parts.users as { display_name?: string; username?: string; email?: string } | null;
          displayName = u?.display_name || u?.username || u?.email || displayName;
        }
      }
      const msgCount = (conv.chat_messages as unknown as { count: number }[])?.[0]?.count ?? 0;
      return {
        id: conv.id,
        type: conv.type,
        name: displayName,
        message_count: msgCount,
        created_at: conv.created_at,
      };
    }),
  );

  res.json({ conversations: result });
});

// ===== GET /api/export/chat/:id?format= =====

router.get("/chat/:id", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const format = (req.query.format as string || "txt").toLowerCase();

  if (!["md", "txt", "xlsx", "docx"].includes(format)) {
    return res.status(400).json({ error: "format 必須是 md / txt / xlsx / docx" });
  }

  // 確認是自己的對話
  const { data: participation } = await supabaseAdmin
    .from("chat_participants")
    .select("role")
    .eq("conversation_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!participation) {
    return res.status(403).json({ error: "無權限匯出此對話" });
  }

  // 取對話資訊
  const { data: conv, error: convErr } = await supabaseAdmin
    .from("chat_conversations")
    .select("id, type, name")
    .eq("id", id)
    .single();

  if (convErr || !conv) {
    return res.status(404).json({ error: "找不到此對話" });
  }

  // 取所有對話成員的顯示名稱（建 senderMap）
  const { data: participants } = await supabaseAdmin
    .from("chat_participants")
    .select("user_id, users(display_name, username, email)")
    .eq("conversation_id", id);

  const senderMap = new Map<number, string>();
  for (const p of participants || []) {
    const u = p.users as { display_name?: string; username?: string; email?: string } | null;
    const name = u?.display_name || u?.username || u?.email || `用戶${p.user_id}`;
    senderMap.set(p.user_id, name);
  }

  // 取所有訊息（不做 FK join）
  const { data: rawMsgs, error: msgsErr } = await supabaseAdmin
    .from("chat_messages")
    .select("id, sender_id, content, image_url, message_type, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgsErr) {
    logger.error("取得訊息失敗", { error: msgsErr.message });
    return res.status(500).json({ error: "取得訊息失敗" });
  }

  // 組對話名稱
  let convName = conv.name || "";
  if (conv.type === "dm") {
    const { data: partner } = await supabaseAdmin
      .from("chat_participants")
      .select("user_id, users(display_name, username, email)")
      .eq("conversation_id", id)
      .neq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (partner) {
      const u = partner.users as { display_name?: string; username?: string; email?: string } | null;
      convName = u?.display_name || u?.username || u?.email || convName;
    }
  }
  if (!convName) convName = `對話 ${id.slice(0, 8)}`;

  // 整理訊息
  const msgs: ChatExportMessage[] = (rawMsgs || []).map((m) => ({
    time: fmtTime(m.created_at),
    sender: senderMap.get(m.sender_id) || `用戶${m.sender_id}`,
    content: m.content || "",
    imageUrl: m.image_url,
    isSystem: m.message_type === "system",
  }));

  const safeTitle = convName.replace(/[\\/:*?"<>|]/g, "_");
  const dateStr = dateFmt(new Date(), "yyyyMMdd");
  const filename = `對話_${safeTitle}_${dateStr}.${format}`;

  try {
    setDownloadHeaders(res, filename, format);
    let buf: Buffer;
    switch (format) {
      case "md":   buf = chatToMd(msgs, convName);          break;
      case "txt":  buf = chatToTxt(msgs, convName);         break;
      case "xlsx": buf = await chatToXlsx(msgs, convName);  break;
      case "docx": buf = await chatToDocx(msgs, convName);  break;
      default:     buf = chatToTxt(msgs, convName);
    }
    res.send(buf);
  } catch (err) {
    logger.error("匯出對話失敗", { error: (err as Error).message });
    res.status(500).json({ error: "匯出失敗，請稍後再試" });
  }
});

export default router;
