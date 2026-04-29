/**
 * useNotifications — 全站通知 hook
 * @module hooks/useNotifications
 *
 * 在 <App> 最頂層的 NotificationProvider 執行：
 *   1. 載入自己的通知清單 + 未讀數
 *   2. 訂閱 Supabase Realtime channel `user-{userId}` 的 'new_notification' 事件
 *   3. 收到新通知 → 加進 list + 增加 unread count
 *   4. 提供 markRead / markAllRead / refresh API
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  notificationService,
  type Notification,
} from "@/services/notifications/notification.service";
import { getSupabaseClient } from "@/services/social/supabase.client";

const REFRESH_INTERVAL = 60_000;

export function useNotificationsHook(): {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
} {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      seenIds.current.clear();
      return;
    }
    try {
      setLoading(true);
      const [list, unread] = await Promise.all([
        notificationService.list({ limit: 30 }),
        notificationService.unreadCount(),
      ]);
      seenIds.current = new Set(list.map((n) => n.id));
      setNotifications(list);
      setUnreadCount(unread.count);
    } catch (err) {
      console.warn("[notifications] 載入失敗", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 初始 + 每 60 秒輪詢（fallback，realtime 失效時還是會更新）
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [refresh]);

  // Realtime 訂閱
  useEffect(() => {
    if (!user) return;
    const client = getSupabaseClient();
    const channel = client.channel(`user-${user.user_id}`, {
      config: { broadcast: { self: false } },
    });
    channel.on("broadcast", { event: "new_notification" }, ({ payload }) => {
      const n = payload as Notification;
      if (!n || typeof n.id !== "number") return;
      if (seenIds.current.has(n.id)) return;
      seenIds.current.add(n.id);
      setNotifications((prev) => [n, ...prev].slice(0, 30));
      if (!n.is_read) setUnreadCount((c) => c + 1);
    });
    channel.subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [user]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.markRead(id);
    } catch {
      /* silent — 重整就會同步 */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch {
      /* silent */
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    seenIds.current.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.remove(id);
    } catch {
      /* silent */
    }
  }, []);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead, remove };
}
