/**
 * 資料庫型別定義
 * @module types/database
 */

/**
 * 使用者更新資料介面
 */
export interface UpdateUserData {
  display_name?: string;
  phone_number?: string;
  sex?: boolean;
  is_active?: boolean;
  avatar_url?: string;
  email_verified?: boolean;
}

/**
 * 課程更新資料介面
 */
export interface UpdateCourseData {
  course_title?: string;
  course_slug?: string;
  course_description?: string;
  course_content?: string;
  course_video_url?: string;
  course_thumbnail_url?: string;
  course_keywords?: string[];
  course_category?: string;
  price?: number;
  currency?: string;
  access_duration_days?: number;
  status?: "draft" | "published" | "archived";
}

/**
 * 影片更新資料介面
 */
export interface UpdateVideoData {
  video_title?: string;
  video_url?: string;
  thumbnail_url?: string;
  description?: string;
  category?: string;
  is_visible?: boolean;
  display_order?: number;
}

/**
 * 白名單更新資料介面
 */
export interface UpdateWhitelistData {
  email?: string;
  phone_number?: string;
  note?: string;
  is_active?: boolean;
}
