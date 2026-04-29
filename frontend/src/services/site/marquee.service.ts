/**
 * Marquee 管理服務（認證標章 + 成果數字）
 * @module services/marquee.service
 *
 * 對應後端 `routes/marquee.ts`，同一張 `marquee_items` 表用 type 區分：
 *   - 'cert' : {icon, label, sub} — 認證標章
 *   - 'stat' : {label=value, sub=說明} — 成果數字（無 icon）
 */

import { get, post, put, del } from "../api";

// ============================================================
// Types
// ============================================================

export type MarqueeType = "cert" | "stat";

export interface MarqueeItem {
  id: number;
  type: MarqueeType;
  icon: string;
  label: string;
  sub: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Service
// ============================================================

export const marqueeService = {
  // ===== 公開 API =====

  /** 取得所有啟用的 marquee 項目（cert + stat 混合，前端用 filter 分流） */
  getAll: (): Promise<MarqueeItem[]> => get<MarqueeItem[]>("/api/marquee"),

  // ===== 管理員 API =====

  /** 取得所有項目（含停用） */
  getAdminAll: (): Promise<MarqueeItem[]> =>
    get<MarqueeItem[]>("/api/marquee/admin"),

  /** 新增項目 */
  create: (data: {
    type: MarqueeType;
    icon?: string;
    label: string;
    sub?: string;
    sortOrder?: number;
  }): Promise<MarqueeItem> => post<MarqueeItem>("/api/marquee/admin", data),

  /** 更新項目 */
  update: (
    id: number,
    data: Partial<{
      type: MarqueeType;
      icon: string;
      label: string;
      sub: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ): Promise<MarqueeItem> => put<MarqueeItem>(`/api/marquee/admin/${id}`, data),

  /** 刪除項目 */
  remove: (id: number): Promise<void> => del(`/api/marquee/admin/${id}`),
};

export default marqueeService;
