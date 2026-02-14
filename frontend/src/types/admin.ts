/**
 * 後台管理相關類型定義
 * @module types/admin
 */

import type { User, Course, Video } from "@/types";

/**
 * 後台統計資料
 */
export interface AdminStats {
  userCount: number;
  courseCount: number;
  orderCount: number;
  monthlyRevenue: number;
}

/**
 * 擴展的使用者資料（後台用）
 */
export interface AdminUser extends User {
  username?: string;
  display_name?: string;
  avatar_base64?: string;
  is_active: boolean;
  last_login_at?: string;
}

/**
 * 擴展的課程資料（後台用）
 * 注意：某些欄位顯式重複宣告以確保 TypeScript 正確解析
 */
export interface AdminCourse extends Course {
  course_video_url?: string;
  total_enrolled?: number;
  lessons_count?: number;
  course_level?: "beginner" | "intermediate" | "advanced";
  // 從父類型繼承但顯式宣告以避免 TS 錯誤
  updated_at: string;
  created_at: string;
}

/**
 * 擴展的影片資料（後台用）
 * 注意：某些欄位顯式重複宣告以確保 TypeScript 正確解析
 */
export interface AdminVideo extends Video {
  // 從父類型繼承但顯式宣告以避免 TS 錯誤
  updated_at: string;
  created_at: string;
}

/**
 * 分頁使用者回應
 */
export interface PaginatedUsersResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 使用者更新資料
 */
export interface UserUpdateData {
  display_name?: string;
  phone_number?: string;
  is_active?: boolean;
  sex?: boolean;
}

/**
 * 表格欄位定義
 */
export interface TableColumn<T = unknown> {
  header: string;
  accessor?: keyof T | string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
}

/**
 * 白名單項目
 */
export interface WhitelistItem {
  id: string;
  email?: string;
  phoneNumber?: string;
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 白名單建立資料
 */
export interface WhitelistCreateData {
  email?: string;
  phoneNumber?: string;
  note?: string;
}

/**
 * 白名單更新資料
 */
export interface WhitelistUpdateData {
  email?: string;
  phoneNumber?: string;
  note?: string;
  isActive?: boolean;
}
