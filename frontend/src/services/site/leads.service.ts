/**
 * Landing Page 表單報名（lp_leads）服務層 — 教練後台
 * @module services/site/leads.service
 *
 * 對應 backend/routes/landing.ts 的 /api/landing/leads/* 管理端點（全需 requireAdmin）。
 * 寫入端（公開報名 POST /api/landing/leads）不在此，本檔只做後台檢視/處理。
 */

import { get, put, del } from "../api";

export type LeadStatus = "new" | "contacted" | "booked" | "closed" | "spam";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "booked",
  "closed",
  "spam",
];

/** 列表卡片用（不含 answers）*/
export interface LeadSummary {
  id: number;
  project_id: number | null;
  project_slug: string | null;
  project_name: string | null;
  name: string;
  phone: string;
  email: string | null;
  line_id: string | null;
  instagram: string | null;
  summary: string | null;
  status: LeadStatus;
  coach_note: string | null;
  created_at: string;
  updated_at: string;
}

/** 單筆完整（含逐題 answers）*/
export interface LeadDetail extends LeadSummary {
  /** 逐題答案，key 為題目文字 */
  answers: Record<string, unknown>;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  booked: number;
  closed: number;
  spam: number;
}

export interface LeadListResponse {
  data: LeadSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus | "";
}

export const leadsService = {
  /** 報名列表（分頁 + 搜尋 + status 篩選）*/
  list: (params: ListParams = {}): Promise<LeadListResponse> =>
    get<LeadListResponse>("/api/landing/leads", { params }),

  /** 各狀態計數 */
  stats: (): Promise<LeadStats> =>
    get<LeadStats>("/api/landing/leads/stats"),

  /** 單筆完整報名（含 answers / summary）*/
  detail: (id: number): Promise<LeadDetail> =>
    get<LeadDetail>(`/api/landing/leads/${id}`),

  /** 切換處理狀態 */
  setStatus: (id: number, status: LeadStatus): Promise<unknown> =>
    put(`/api/landing/leads/${id}/status`, { status }),

  /** 更新教練備註 */
  setNote: (id: number, coach_note: string): Promise<unknown> =>
    put(`/api/landing/leads/${id}/note`, { coach_note }),

  /** 刪除單筆報名 */
  remove: (id: number): Promise<{ success: boolean }> =>
    del<{ success: boolean }>(`/api/landing/leads/${id}`),
};

export default leadsService;
