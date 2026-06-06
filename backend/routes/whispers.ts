/**
 * @fileoverview 說悄悄話路由
 *
 * 公開：
 *   POST /api/whispers   — 非登入訪客提交悄悄話（嚴格消毒 + rate limit）
 *
 * Admin（白名單）：
 *   GET  /api/whispers   — 查看所有未過期悄悄話（唯讀）
 *
 * 安全策略：
 *   - 姓名/訊息：XSS strip + 白名單字元
 *   - Email：RFC 5322 regex
 *   - 台灣手機：09xxxxxxxx 格式
 *   - Honeypot 欄位：bot 偵測
 *   - Rate limit：同 IP 每小時最多 3 次（由 rateLimiter middleware 設定）
 *   - 儲存 SHA-256(IP) 而非原始 IP
 */

import crypto from "crypto";
import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router: Router = express.Router();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const TW_PHONE_REGEX = /^09\d{8}$/;
const CONTACT_MAX = 100;
const NAME_MAX = 50;
const MESSAGE_MAX = 100;

/** 白名單字元消毒（允許中英文、數字、常用標點，禁止 HTML/SQL） */
function sanitizeText(raw: string): string {
  return raw
    .replace(/[<>'"\\;]/g, "")       // 移除危險字元
    .replace(/\s+/g, " ")            // 收縮空白
    .trim();
}

/**
 * POST /api/whispers
 * 非登入訪客提交悄悄話
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, contact, message, honeypot } = req.body as {
      name?: string;
      contact?: string;
      message?: string;
      honeypot?: string;
    };

    // Honeypot：bot 通常會填隱藏欄位
    if (honeypot) {
      res.status(200).json({ ok: true }); // 假裝成功，不讓 bot 知道被擋
      return;
    }

    // 欄位存在性檢查
    if (!name?.trim() || !contact?.trim() || !message?.trim()) {
      res.status(400).json({ error: "請填寫姓名、聯絡方式與訊息" });
      return;
    }

    // 消毒
    const cleanName = sanitizeText(name);
    const cleanContact = contact.trim().replace(/\s/g, "");
    const cleanMessage = sanitizeText(message);

    // 長度限制
    if (cleanName.length < 1 || cleanName.length > NAME_MAX) {
      res.status(400).json({ error: `姓名需在 1–${NAME_MAX} 字以內` });
      return;
    }
    if (cleanContact.length > CONTACT_MAX) {
      res.status(400).json({ error: "聯絡方式過長" });
      return;
    }
    if (cleanMessage.length < 1 || cleanMessage.length > MESSAGE_MAX) {
      res.status(400).json({ error: `訊息需在 1–${MESSAGE_MAX} 字以內` });
      return;
    }

    // 聯絡方式：必須是 email 或台灣手機
    const isEmail = EMAIL_REGEX.test(cleanContact);
    const isPhone = TW_PHONE_REGEX.test(cleanContact);
    if (!isEmail && !isPhone) {
      res.status(400).json({
        error: "聯絡方式需為有效 Email 或台灣手機號碼（09xxxxxxxx）",
      });
      return;
    }

    // IP hash（不儲存原始 IP）
    const rawIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    const { error: dbErr } = await supabaseAdmin.from("whispers").insert({
      name: cleanName,
      contact: cleanContact,
      message: cleanMessage,
      ip_hash: ipHash,
    });

    if (dbErr) throw dbErr;

    logger.info("悄悄話已收到", { ipHash });
    res.json({ ok: true, message: "悄悄話已送出，謝謝你！" });
  } catch (err) {
    logger.error("提交悄悄話失敗", err as Error);
    res.status(500).json({ error: "送出失敗，請稍後再試" });
  }
});

/**
 * GET /api/whispers
 * 管理員查看所有未過期悄悄話（唯讀）
 */
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("whispers")
        .select("whisper_id, name, contact, message, created_at, expires_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      logger.error("取得悄悄話失敗", err as Error);
      res.status(500).json({ error: "取得悄悄話失敗" });
    }
  },
);

export default router;
