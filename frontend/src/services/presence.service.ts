/**
 * 在線狀態服務
 * @module services/presence.service
 */

import { get, post } from "./api";

export type PresenceStatus = "online" | "away" | "offline";

export interface PresenceRow {
  user_id: number;
  last_seen_at: string | null;
  status: PresenceStatus;
}

export const presenceService = {
  /** 自己的心跳 — 每 30 秒打一次 */
  heartbeat: (): Promise<{ ok: boolean; last_seen_at: string }> =>
    post<{ ok: boolean; last_seen_at: string }>("/api/presence/heartbeat", {}),

  /** 批次查多人狀態 */
  getMany: (userIds: number[]): Promise<PresenceRow[]> => {
    if (userIds.length === 0) return Promise.resolve([]);
    return get<PresenceRow[]>(`/api/presence?userIds=${userIds.join(",")}`);
  },
};

export default presenceService;

/** 把 last_seen_at 轉成「X 分鐘前」「X 小時前」「昨天」等顯示 */
export function formatLastSeen(lastSeenIso: string | null): string {
  if (!lastSeenIso) return "尚未上線";
  const diff = Date.now() - new Date(lastSeenIso).getTime();
  if (diff < 60_000) return "在線中";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} 分鐘前在線`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前在線`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天上線";
  if (day < 7) return `${day} 天前在線`;
  return new Date(lastSeenIso).toLocaleDateString("zh-TW");
}
