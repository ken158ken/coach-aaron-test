/**
 * 課程與影片類型定義
 * @module types/content
 */

/** 課程狀態 */
export type CourseStatus = "draft" | "published" | "archived";

/** 課程資料 */
export interface Course {
  course_id: number;
  course_title: string;
  course_slug: string;
  course_description?: string;
  course_content?: string;
  course_thumbnail_url?: string;
  price: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

/** 影片類型 */
export type VideoType = "youtube" | "instagram" | "vimeo" | "other";

/** 影片資料 */
export interface Video {
  video_id: number;
  title: string;
  url: string;
  type: VideoType;
  thumbnail_url?: string;
  duration?: number;
  description?: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}
