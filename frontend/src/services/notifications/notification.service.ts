/**
 * 通知服務（in-app）
 * @module services/notification.service
 */

import { get, post, del } from "../api";

export type NotificationType =
  | "chat_message"
  | "chat_added_to_group"
  | "chat_removed_from_group"
  | "booking_pending"
  | "booking_approved"
  | "booking_rejected"
  | "booking_cancelled";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  icon_url: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationService = {
  list: (params?: {
    status?: "unread" | "read";
    limit?: number;
  }): Promise<Notification[]> => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return get<Notification[]>(`/api/notifications${qs ? "?" + qs : ""}`);
  },
  unreadCount: (): Promise<{ count: number }> =>
    get<{ count: number }>("/api/notifications/unread-count"),
  markRead: (id: number): Promise<{ success: boolean }> =>
    post<{ success: boolean }>(`/api/notifications/${id}/read`, {}),
  markAllRead: (): Promise<{ success: boolean }> =>
    post<{ success: boolean }>("/api/notifications/read-all", {}),
  remove: (id: number): Promise<{ success: boolean }> =>
    del(`/api/notifications/${id}`),
};

export default notificationService;
