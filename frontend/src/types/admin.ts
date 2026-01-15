/**
 * 後台管理相關類型定義
 * @module types/admin
 */

import { User, Course, Video } from "@/types";

/**
 * 後台統計資料
 */
export interface AdminStats {
  /** 會員總數 */
  userCount: number;
  /** 課程數量 */
  courseCount: number;
  /** 訂單數量 */
  orderCount: number;
  /** 本月營收 */
  monthlyRevenue: number;
}

/**
 * 擴展的使用者資料（後台用）
 */
export interface AdminUser extends User {
  /** 使用者 ID */
  user_id: number;
  /** 使用者名稱 */
  username?: string;
  /** 顯示名稱 */
  display_name?: string;
  /** 電子郵件 */
  email: string;
  /** 電話號碼 */
  phone_number?: string;
  /** 是否為管理員 */
  isAdmin: boolean;
  /** 帳號是否啟用 */
  is_active: boolean;
  /** 私密相簿檢視權限 */
  sex: boolean;
  /** 最後登入時間 */
  last_login_at?: string;
  /** 建立時間 */
  created_at: string;
  /** 更新時間 */
  updated_at?: string;
}

/**
 * 擴展的課程資料（後台用）
 */
export interface AdminCourse extends Course {
  /** 課程 ID */
  course_id: number;
  /** 課程標題 */
  course_title: string;
  /** 課程代稱 */
  course_slug: string;
  /** 課程描述 */
  course_description?: string;
  /** 課程內容 */
  course_content?: string;
  /** 縮圖網址 */
  course_thumbnail_url?: string;
  /** 影片網址 */
  course_video_url?: string;
  /** 價格 */
  price: number;
  /** 狀態 */
  status: "draft" | "published" | "archived";
  /** 購買人數 */
  total_enrolled?: number;
  /** 建立時間 */
  created_at: string;
  /** 更新時間 */
  updated_at?: string;
}

/**
 * 擴展的影片資料（後台用）
 */
export interface AdminVideo extends Video {
  /** 影片 ID */
  video_id: number;
  /** 標題 */
  title: string;
  /** 網址 */
  url: string;
  /** 類型 */
  type: "instagram" | "youtube" | "tiktok";
  /** 排序 */
  sort_order: number;
  /** 是否顯示 */
  is_visible: boolean;
  /** 建立時間 */
  created_at?: string;
  /** 更新時間 */
  updated_at?: string;
}

/**
 * 管理員白名單項目
 */
export interface WhitelistItem {
  /** 白名單 ID */
  whitelist_id: number;
  /** 電子郵件 */
  email?: string;
  /** 手機號碼 */
  phone_number?: string;
  /** 備註 */
  note?: string;
  /** 是否啟用 */
  is_active: boolean;
  /** 建立時間 */
  created_at: string;
  /** 更新時間 */
  updated_at?: string;
}

/**
 * 分頁回應
 */
export interface PaginatedUsersResponse {
  /** 使用者列表 */
  users: AdminUser[];
  /** 總頁數 */
  totalPages: number;
  /** 當前頁碼 */
  currentPage?: number;
  /** 總數量 */
  total?: number;
}

/**
 * 課程建立/更新資料
 */
export interface CourseFormData {
  courseTitle: string;
  courseSlug: string;
  courseDescription?: string;
  courseContent?: string;
  courseThumbnailUrl?: string;
  courseVideoUrl?: string;
  price: number;
  status: "draft" | "published" | "archived";
}

/**
 * 影片建立/更新資料
 */
export interface VideoFormData {
  title: string;
  url: string;
  type: "instagram" | "youtube" | "tiktok";
  sortOrder: number;
  isVisible: boolean;
}

/**
 * 使用者更新資料
 */
export interface UserUpdateData {
  displayName?: string;
  isActive?: boolean;
  sex?: boolean;
}

/**
 * 白名單建立資料
 */
export interface WhitelistCreateData {
  email?: string | null;
  phoneNumber?: string | null;
  note?: string;
}

/**
 * 白名單更新資料
 */
export interface WhitelistUpdateData {
  isActive: boolean;
}
