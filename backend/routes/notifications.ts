/**
 * @fileoverview 通知路由
 *
 * 用戶面：
 *   GET    /api/notifications?status=unread&limit=20      自己的通知
 *   GET    /api/notifications/unread-count                未讀數
 *   POST   /api/notifications/:id/read                    標記單筆已讀
 *   POST   /api/notifications/read-all                    全部已讀
 *   DELETE /api/notifications/:id                         刪除
 *
 * Push 訂閱：
 *   GET    /api/notifications/push/public-key             VAPID public key
 *   POST   /api/notifications/push/subscribe              訂閱（前端 PushManager 拿到後 POST）
 *   POST   /api/notifications/push/unsubscribe            取消訂閱（傳 endpoint）
 *   GET    /api/notifications/push/status                 自己有沒有有效訂閱
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { getVapidPublicKey, isPushReady } from "../utils/notifications.js";

const router: Router = express.Router();

// ======================================================
// 列表 / 標已讀 / 刪除
// ======================================================

/** GET /api/notifications */
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const status = String(req.query.status || ""); // '', 'unread', 'read'
      const limit = Math.min(Number(req.query.limit) || 20, 100);

      let q = supabaseAdmin
        .from("notifications")
        .select(
          "id, type, title, body, link, icon_url, metadata, is_read, read_at, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status === "unread") q = q.eq("is_read", false);
      if (status === "read") q = q.eq("is_read", true);

      const { data, error } = await q;
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      logger.error("取得通知失敗", err as Error);
      res.status(500).json({ error: "取得通知失敗" });
    }
  },
);

/** GET /api/notifications/unread-count */
router.get(
  "/unread-count",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const { count } = await supabaseAdmin
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      res.json({ count: count || 0 });
    } catch (err) {
      logger.error("取得未讀數失敗", err as Error);
      res.status(500).json({ error: "取得未讀數失敗" });
    }
  },
);

/** POST /api/notifications/:id/read */
router.post(
  "/:id/read",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const id = Number(req.params.id);
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("標記已讀失敗", err as Error);
      res.status(500).json({ error: "標記已讀失敗" });
    }
  },
);

/** POST /api/notifications/read-all */
router.post(
  "/read-all",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("全部已讀失敗", err as Error);
      res.status(500).json({ error: "全部已讀失敗" });
    }
  },
);

/** DELETE /api/notifications/:id */
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const id = Number(req.params.id);
      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("刪除通知失敗", err as Error);
      res.status(500).json({ error: "刪除通知失敗" });
    }
  },
);

// ======================================================
// Push subscription
// ======================================================

/** GET /api/notifications/push/public-key */
router.get(
  "/push/public-key",
  (_req: Request, res: Response): void => {
    res.json({
      publicKey: getVapidPublicKey(),
      enabled: isPushReady(),
    });
  },
);

/**
 * POST /api/notifications/push/subscribe
 *
 * 兩種 body 變體：
 *
 *   Web Push（瀏覽器）：
 *     { endpoint: string, keys: { p256dh, auth }, userAgent? }
 *
 *   FCM（Android app）：
 *     { provider: 'fcm', token: string, userAgent? }
 *     → token 會塞到 endpoint 欄位（保持 unique 約束），p256dh / auth 留空
 */
router.post(
  "/push/subscribe",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const { provider, token, endpoint, keys, userAgent } = req.body;

      let row: {
        user_id: number;
        endpoint: string;
        provider: "web" | "fcm";
        p256dh: string | null;
        auth: string | null;
        user_agent: string | null;
        last_used_at: string;
      };

      if (provider === "fcm") {
        if (!token || typeof token !== "string") {
          res.status(400).json({ error: "缺少 FCM token" });
          return;
        }
        row = {
          user_id: userId,
          endpoint: token,
          provider: "fcm",
          p256dh: null,
          auth: null,
          user_agent: userAgent || null,
          last_used_at: new Date().toISOString(),
        };
      } else {
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
          res.status(400).json({ error: "缺少訂閱資料" });
          return;
        }
        row = {
          user_id: userId,
          endpoint,
          provider: "web",
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent || null,
          last_used_at: new Date().toISOString(),
        };
      }

      const { error } = await supabaseAdmin
        .from("push_subscriptions")
        .upsert(row, { onConflict: "endpoint" });
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("Push 訂閱失敗", err as Error);
      res.status(500).json({ error: "Push 訂閱失敗" });
    }
  },
);

/** POST /api/notifications/push/unsubscribe */
router.post(
  "/push/unsubscribe",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const { endpoint } = req.body;
      if (!endpoint) {
        res.status(400).json({ error: "缺少 endpoint" });
        return;
      }
      const { error } = await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("Push 取消訂閱失敗", err as Error);
      res.status(500).json({ error: "Push 取消訂閱失敗" });
    }
  },
);

/** GET /api/notifications/push/status — 自己是否有有效訂閱 */
router.get(
  "/push/status",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const { count } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      res.json({ subscribed: (count || 0) > 0, enabled: isPushReady() });
    } catch (err) {
      logger.error("取得 push 狀態失敗", err as Error);
      res.status(500).json({ error: "取得 push 狀態失敗" });
    }
  },
);

export default router;
