/**
 * @fileoverview 聊天訊息 7 天清理 cron
 *
 * 由 vercel.json 設定的 Cron Job 每天觸發一次：
 *   GET /api/cron/cleanup-chat
 *
 * 安全性：用 CRON_SECRET 驗證（Vercel Cron 會自動帶 Authorization: Bearer <secret>）
 *
 * 流程：
 *   1. 撈出 expires_at < NOW() 的訊息（含 image_path）
 *   2. 批次刪 storage 中對應檔
 *   3. 刪 DB row
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import { IMAGE_BUCKETS } from "../utils/imageStorage.js";

const router: Router = express.Router();

router.get(
  "/cleanup-chat",
  async (req: Request, res: Response): Promise<void> => {
    // 驗證 CRON_SECRET —— 未設定時直接拒絕（這是破壞性刪除端點，
    // 不能因環境變數漏設就 fail-open 變成公開可打）
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      res.status(503).json({ error: "CRON_SECRET 未設定" });
      return;
    }
    if ((req.headers.authorization || "") !== `Bearer ${secret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const now = new Date().toISOString();

      // 1. 找過期訊息
      const { data: expired, error: qErr } = await supabaseAdmin
        .from("chat_messages")
        .select("id, image_path")
        .lt("expires_at", now);
      if (qErr) throw qErr;

      const total = expired?.length || 0;
      const paths = (expired || [])
        .map((m) => m.image_path)
        .filter((p): p is string => !!p);

      // 2. 刪 storage 檔案（最多每批 100 個 path）
      let deletedFiles = 0;
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        const { error: rmErr } = await supabaseAdmin.storage
          .from(IMAGE_BUCKETS.CHAT)
          .remove(batch);
        if (rmErr) {
          logger.warn("storage 清理部分失敗（不阻擋 DB 刪除）", {
            error: rmErr.message,
            batchSize: batch.length,
          });
        } else {
          deletedFiles += batch.length;
        }
      }

      // 3. 刪 DB row
      const { error: delErr } = await supabaseAdmin
        .from("chat_messages")
        .delete()
        .lt("expires_at", now);
      if (delErr) throw delErr;

      // 4. 清過期通知（順便處理，省一條 cron 名額）
      let deletedNotifs = 0;
      try {
        const { count } = await supabaseAdmin
          .from("notifications")
          .delete({ count: "exact" })
          .lt("expires_at", now);
        deletedNotifs = count || 0;
      } catch (err) {
        logger.warn("notifications 清理失敗", {
          error: (err as Error)?.message,
        });
      }

      // 5. 清除無訊息且建立超過 7 天的對話
      let deletedEmptyConvs = 0;
      try {
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        // 取得超過 7 天的對話 ID
        const { data: oldConvs, error: oldConvErr } = await supabaseAdmin
          .from("chat_conversations")
          .select("id")
          .lt("created_at", sevenDaysAgo);
        if (oldConvErr) throw oldConvErr;

        if (oldConvs && oldConvs.length > 0) {
          const oldIds = oldConvs.map((c) => c.id);

          // 找出其中有訊息的對話（僅選 distinct conversation_id）
          const { data: convWithMsgs, error: msgErr } = await supabaseAdmin
            .from("chat_messages")
            .select("conversation_id")
            .in("conversation_id", oldIds);
          if (msgErr) throw msgErr;

          const hasMessages = new Set(
            (convWithMsgs || []).map((m) => m.conversation_id)
          );
          const emptyIds = oldIds.filter((id) => !hasMessages.has(id));

          if (emptyIds.length > 0) {
            // 先刪 participants（FK 約束）
            await supabaseAdmin
              .from("chat_participants")
              .delete()
              .in("conversation_id", emptyIds);

            // 再刪對話
            const { count: convCount } = await supabaseAdmin
              .from("chat_conversations")
              .delete({ count: "exact" })
              .in("id", emptyIds);
            deletedEmptyConvs = convCount || emptyIds.length;
          }
        }
      } catch (err) {
        logger.warn("空對話清理失敗", { error: (err as Error)?.message });
      }

      // 6. 清除過期悄悄話（30天）
      let deletedWhispers = 0;
      try {
        const { count: wCount } = await supabaseAdmin
          .from("whispers")
          .delete({ count: "exact" })
          .lt("expires_at", now);
        deletedWhispers = wCount || 0;
      } catch (err) {
        logger.warn("悄悄話清理失敗", { error: (err as Error)?.message });
      }

      logger.info("chat cleanup 完成", {
        messagesDeleted: total,
        filesDeleted: deletedFiles,
        notificationsDeleted: deletedNotifs,
        emptyConvsDeleted: deletedEmptyConvs,
        whispersDeleted: deletedWhispers,
      });

      res.json({
        ok: true,
        messagesDeleted: total,
        filesDeleted: deletedFiles,
        notificationsDeleted: deletedNotifs,
        emptyConvsDeleted: deletedEmptyConvs,
        whispersDeleted: deletedWhispers,
        timestamp: now,
      });
    } catch (err) {
      logger.error("chat cleanup 失敗", err as Error);
      res.status(500).json({ error: "cleanup failed" });
    }
  },
);

export default router;
