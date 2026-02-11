/**
 * 網站內容管理服務
 * @module services/content.service
 */

import { get, post, put, del } from "./api";

/** 網站內容項目 */
export interface SiteContent {
  content_id: number;
  content_key: string;
  content_name: string;
  content_value: string;
  content_type: "text" | "html" | "json";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 彈窗項目 */
export interface SitePopup {
  popup_id: number;
  popup_title: string;
  popup_content: string;
  is_active: boolean;
  show_once: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/** 公開彈窗資料 (精簡) */
export interface ActivePopup {
  popup_id: number;
  popup_title: string;
  popup_content: string;
  show_once: boolean;
}

/**
 * 網站內容服務
 */
export const contentService = {
  // ===== 公開 API =====

  /**
   * 取得所有啟用內容 (key-value map)
   */
  getPublicContent: async (): Promise<Record<string, string>> => {
    return get<Record<string, string>>("/api/content");
  },

  /**
   * 取得目前啟用的彈窗
   */
  getActivePopup: async (): Promise<ActivePopup | null> => {
    return get<ActivePopup | null>("/api/content/popup/active");
  },

  // ===== 管理員 API =====

  /**
   * 取得所有網站內容（管理員）
   */
  getAllAdmin: async (): Promise<SiteContent[]> => {
    return get<SiteContent[]>("/api/content/admin/all");
  },

  /**
   * 更新網站內容（管理員）
   */
  updateContent: async (
    id: number,
    data: Partial<{
      contentValue: string;
      contentName: string;
      contentType: string;
      isActive: boolean;
    }>,
  ): Promise<SiteContent> => {
    return put<SiteContent>(`/api/content/admin/${id}`, data);
  },

  /**
   * 新增網站內容（管理員）
   */
  createContent: async (data: {
    contentKey: string;
    contentName: string;
    contentValue?: string;
    contentType?: string;
    sortOrder?: number;
  }): Promise<SiteContent> => {
    return post<SiteContent>("/api/content/admin", data);
  },

  /**
   * 刪除網站內容（管理員）
   */
  deleteContent: async (id: number): Promise<void> => {
    return del(`/api/content/admin/${id}`);
  },

  // ===== 彈窗管理 =====

  /**
   * 取得所有彈窗（管理員）
   */
  getAllPopups: async (): Promise<SitePopup[]> => {
    return get<SitePopup[]>("/api/content/admin/popups");
  },

  /**
   * 新增彈窗（管理員）
   */
  createPopup: async (data: {
    popupTitle: string;
    popupContent: string;
    showOnce?: boolean;
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<SitePopup> => {
    return post<SitePopup>("/api/content/admin/popups", data);
  },

  /**
   * 更新彈窗（管理員）
   */
  updatePopup: async (
    id: number,
    data: Partial<{
      popupTitle: string;
      popupContent: string;
      isActive: boolean;
      showOnce: boolean;
      startDate: string | null;
      endDate: string | null;
    }>,
  ): Promise<SitePopup> => {
    return put<SitePopup>(`/api/content/admin/popups/${id}`, data);
  },

  /**
   * 刪除彈窗（管理員）
   */
  deletePopup: async (id: number): Promise<void> => {
    return del(`/api/content/admin/popups/${id}`);
  },
};

export default contentService;
