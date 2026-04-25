/**
 * usePresence — 自身心跳 + 查詢他人在線
 * @module hooks/usePresence
 */

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { presenceService, type PresenceRow } from "@/services/presence.service";

const HEARTBEAT_MS = 30_000;
const POLL_MS = 30_000;

/** 已登入時自動每 30 秒打一次 heartbeat */
export function useHeartbeat(): void {
  const { user } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const tick = async () => {
      try {
        await presenceService.heartbeat();
      } catch {
        /* silent */
      }
    };
    if (!ranRef.current) {
      ranRef.current = true;
      tick();
    }
    const t = setInterval(() => !cancelled && tick(), HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user]);
}

/** 查詢多個 userId 的在線狀態，每 30 秒輪詢更新 */
export function usePresenceMany(userIds: number[]): Map<number, PresenceRow> {
  const [map, setMap] = useState<Map<number, PresenceRow>>(new Map());
  const idsKey = userIds.join(",");

  useEffect(() => {
    if (userIds.length === 0) return;
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const rows = await presenceService.getMany(userIds);
        if (!cancelled) {
          const m = new Map<number, PresenceRow>();
          rows.forEach((r) => m.set(r.user_id, r));
          setMap(m);
        }
      } catch {
        /* silent */
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return map;
}
