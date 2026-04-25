/**
 * 聊天系統服務
 * @module services/chat.service
 */

import { get, post, del } from "./api";

// =================== Types ===================

export interface ChatUser {
  user_id: number;
  name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  /** 若該用戶為 admin_whitelist 成員，這裡是其顯示名稱 */
  admin_display_name?: string | null;
  admin_note?: string | null;
}

export interface ChatParticipant {
  user_id: number;
  role: "member" | "admin";
  joined_at: string;
  user: ChatUser;
}

export interface ChatConversation {
  id: string;
  type: "dm" | "group";
  title: string;
  created_by: number;
  last_message_at: string;
  created_at: string;
  participants?: ChatUser[] | ChatParticipant[];
  last_message?: {
    id: number;
    content: string;
    has_image: boolean;
    sender_id: number;
    created_at: string;
  } | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: number;
  conversation_id: string;
  sender_id: number;
  content: string;
  image_url: string | null;
  expires_at: string;
  created_at: string;
}

// =================== Service ===================

export const chatService = {
  /** 取我的所有對話 */
  listConversations: (): Promise<ChatConversation[]> =>
    get<ChatConversation[]>("/api/chat/conversations"),

  /** 開 / 取得 1v1 DM */
  openDM: (partnerId: number): Promise<ChatConversation> =>
    post<ChatConversation>("/api/chat/conversations", { partnerId }),

  /** admin 建群組 */
  createGroup: (data: {
    title: string;
    memberIds: number[];
  }): Promise<ChatConversation> =>
    post<ChatConversation>("/api/chat/conversations/group", data),

  /** 單一對話 metadata */
  getConversation: (id: string): Promise<ChatConversation> =>
    get<ChatConversation>(`/api/chat/conversations/${id}`),

  /** 取訊息 */
  getMessages: (
    convId: string,
    params?: { before?: string; limit?: number },
  ): Promise<ChatMessage[]> => {
    const q = new URLSearchParams();
    if (params?.before) q.set("before", params.before);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return get<ChatMessage[]>(
      `/api/chat/conversations/${convId}/messages${qs ? "?" + qs : ""}`,
    );
  },

  /** 送訊息（可選一張圖）— 用 multipart 表單 */
  sendMessage: (
    convId: string,
    data: { content?: string; image?: File | null },
  ): Promise<ChatMessage> => {
    const fd = new FormData();
    if (data.content) fd.append("content", data.content);
    if (data.image) fd.append("image", data.image);
    // 注意：post helper 已透過 response interceptor 自動解開 response.data
    // 不要再 .data — 上次的 bug 來源
    return post<ChatMessage>(
      `/api/chat/conversations/${convId}/messages`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /** 標記已讀 */
  markRead: (convId: string): Promise<{ success: boolean }> =>
    post<{ success: boolean }>(`/api/chat/conversations/${convId}/read`, {}),

  /** 加群組成員 */
  addMembers: (
    convId: string,
    userIds: number[],
  ): Promise<{ success: boolean }> =>
    post<{ success: boolean }>(`/api/chat/conversations/${convId}/members`, {
      userIds,
    }),

  /** 移除群組成員（或自己離開）*/
  removeMember: (
    convId: string,
    userId: number,
  ): Promise<{ success: boolean }> =>
    del(`/api/chat/conversations/${convId}/members/${userId}`),

  /** 搜尋用戶（給開 DM / 加群組成員用）*/
  searchUsers: (q: string): Promise<ChatUser[]> =>
    get<ChatUser[]>(
      `/api/chat/users/search${q ? "?q=" + encodeURIComponent(q) : ""}`,
    ),

  /** 取所有 active admin（給客戶選擇聯絡誰）*/
  listAdmins: (): Promise<ChatUser[]> => get<ChatUser[]>("/api/chat/admins"),
};

export default chatService;

// =================== Helpers ===================

/** 取對話顯示名稱：DM 用對方名稱（admin_display_name 優先），群組用 title */
export function getConversationName(
  conv: ChatConversation,
  myUserId: number,
): string {
  if (conv.type === "group") return conv.title || "群組";
  const others = (conv.participants || [])
    .map((p) => ("user" in (p as object) ? (p as ChatParticipant).user : (p as ChatUser)))
    .filter((u) => u && u.user_id !== myUserId);
  const other = others[0];
  if (!other) return "對話";
  return (
    other.admin_display_name ||
    other.display_name ||
    other.name ||
    other.email ||
    "用戶"
  );
}

/** 預覽用 — 截短 */
export function previewText(msg: ChatMessage | { content: string; has_image?: boolean; image_url?: string | null }): string {
  const hasImage = "has_image" in msg ? msg.has_image : !!(msg as ChatMessage).image_url;
  const text = msg.content?.trim();
  if (text) return text.length > 30 ? text.slice(0, 30) + "..." : text;
  if (hasImage) return "📷 圖片";
  return "";
}
