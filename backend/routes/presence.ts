/**
 * @fileoverview 在線狀態
 *
 * - POST /api/presence/heartbeat   登入用戶每 30 秒打一次更新 last_seen_at
 * - GET  /api/presence?userIds=1,2,3  批次查多人狀態
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";

const router: Router = express.Router();

/** 計算 status：< 60s = online，60s-300s = away，>= 300s = offline */
function computeStatus(lastSeenIso: string | null): "online" | "away" | "offline" {
  if (!lastSeenIso) return "offline";
  const diff = Date.now() - new Date(lastSeenIso).getTime();
  if (diff < 60_000) return "online";
  if (diff < 300_000) return "away";
  return "offline";
}

/** POST /api/presence/heartbeat */
router.post(
  "/heartbeat",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.user?.userId);
      const now = new Date().toISOString();
      // upsert
      const { error } = await supabaseAdmin
        .from("user_presence")
        .upsert(
          { user_id: userId, last_seen_at: now, status: "online" },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      res.json({ ok: true, last_seen_at: now });
    } catch (err) {
      console.error("heartbeat error:", err);
      res.status(500).json({ error: "心跳失敗" });
    }
  },
);

/** GET /api/presence?userIds=1,2,3 */
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const ids = String(req.query.userIds || "")
        .split(",")
        .map((x) => Number(x))
        .filter((x) => x > 0);
      if (ids.length === 0) {
        res.json([]);
        return;
      }
      const { data } = await supabaseAdmin
        .from("user_presence")
        .select("user_id, last_seen_at")
        .in("user_id", ids);

      // 補沒紀錄的人
      const map = new Map<number, string>();
      (data || []).forEach((p) => map.set(p.user_id, p.last_seen_at));
      const result = ids.map((id) => {
        const last = map.get(id) || null;
        return {
          user_id: id,
          last_seen_at: last,
          status: computeStatus(last),
        };
      });
      res.json(result);
    } catch (err) {
      console.error("get presence error:", err);
      res.status(500).json({ error: "取得在線狀態失敗" });
    }
  },
);

export default router;
