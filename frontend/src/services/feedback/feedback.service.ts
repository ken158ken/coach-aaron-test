/**
 * 意見反饋服務（開發者 ↔ 教練）
 * @module services/feedback.service
 *
 * 這是「開發者（我）↔ 教練」的內部溝通平台，純 admin 功能，一般學員看不到。
 * 兩個角色共用 /admin/feedback 面板；送出訊息時帶 authorRole（developer|coach）。
 * 圖片為私有 bucket，透過 GET /api/feedback/images/:id/file 串流（僅 admin）；
 * 前端一律以 blob 方式（帶 Authorization / cookie）讀取，避免 <img src> 無法帶 token。
 */

import { get, post, put, del } from "../api";

export type FeedbackStatus =
  | "waiting_developer"
  | "waiting_coach"
  | "in_progress"
  | "resolved";

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  "waiting_developer",
  "waiting_coach",
  "in_progress",
  "resolved",
];

export type AuthorRole = "developer" | "coach";

export interface FeedbackImageMeta {
  id: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
}

export interface FeedbackMessage {
  id: string;
  thread_id: string;
  author_role: AuthorRole;
  author_user_id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  images: FeedbackImageMeta[];
}

export interface FeedbackThreadSummary {
  id: string;
  user_id: number;
  owner_name: string;
  title: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
  last_message: string;
  first_image_id: string | null;
}

export interface FeedbackThreadDetail {
  id: string;
  user_id: number;
  owner_name?: string;
  title: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  messages: FeedbackMessage[];
}

export interface FeedbackListResponse {
  threads: FeedbackThreadSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FeedbackStats {
  total: number;
  waiting_developer: number;
  waiting_coach: number;
  in_progress: number;
  resolved: number;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: FeedbackStatus | "";
}

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

function buildFormData(
  content: string,
  files: File[],
  authorRole: AuthorRole,
): FormData {
  const fd = new FormData();
  fd.append("content", content);
  fd.append("authorRole", authorRole);
  files.forEach((f) => fd.append("images", f));
  return fd;
}

export const feedbackService = {
  // ── 列表 / 統計 / 詳情 ──────────────────────────────────
  listAdmin: (params: ListParams = {}): Promise<FeedbackListResponse> =>
    get<FeedbackListResponse>("/api/feedback/admin", { params }),

  stats: (): Promise<FeedbackStats> =>
    get<FeedbackStats>("/api/feedback/admin/stats"),

  detailAdmin: (id: string): Promise<FeedbackThreadDetail> =>
    get<FeedbackThreadDetail>(`/api/feedback/admin/${id}`),

  // ── 建立 / 回覆（帶 authorRole）─────────────────────────
  create: (
    title: string,
    content: string,
    files: File[],
    authorRole: AuthorRole,
  ): Promise<{ id: string }> => {
    const fd = buildFormData(content, files, authorRole);
    fd.append("title", title);
    return post<{ id: string }>("/api/feedback/admin", fd, MULTIPART);
  },

  replyAdmin: (
    id: string,
    content: string,
    files: File[],
    authorRole: AuthorRole,
  ): Promise<{ id: string }> =>
    post<{ id: string }>(
      `/api/feedback/admin/${id}/messages`,
      buildFormData(content, files, authorRole),
      MULTIPART,
    ),

  // ── thread / 訊息維護 ───────────────────────────────────
  setStatus: (id: string, status: FeedbackStatus): Promise<unknown> =>
    put(`/api/feedback/admin/${id}/status`, { status }),

  setTitle: (id: string, title: string): Promise<unknown> =>
    put(`/api/feedback/admin/${id}/title`, { title }),

  removeThread: (id: string): Promise<unknown> =>
    del(`/api/feedback/admin/${id}`),

  editMessage: (messageId: string, content: string): Promise<unknown> =>
    put(`/api/feedback/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string): Promise<unknown> =>
    del(`/api/feedback/messages/${messageId}`),

  // ── 圖片（blob 串流）────────────────────────────────────
  fetchImageBlob: (imageId: string): Promise<Blob> =>
    get<Blob>(`/api/feedback/images/${imageId}/file`, { responseType: "blob" }),
};

export default feedbackService;
