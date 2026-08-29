/**
 * 課程與影片類型定義
 * @module types/content
 */

/** 課程狀態 */
export type CourseStatus = "draft" | "published" | "archived";

/** 課程難度 */
export type CourseLevel = "beginner" | "intermediate" | "advanced";

/** 課程資料 */
export interface Course {
  // 資料庫欄位 (snake_case)
  course_id: number;
  course_title: string;
  course_slug: string;
  course_description?: string;
  course_content?: string;
  course_thumbnail_url?: string;
  course_banner_url?: string;
  course_keywords?: string;
  course_category?: string;
  // i18n 英文欄位（nullable，未填時 fallback 顯示中文）
  course_title_en?: string | null;
  course_description_en?: string | null;
  course_content_en?: string | null;
  course_keywords_en?: string | null;
  course_category_en?: string | null;
  course_level?: CourseLevel;
  lessons_count?: number;
  duration_minutes?: number;
  rating_average?: number;
  rating_count?: number;
  total_enrolled?: number;
  price: number;
  /** 售價是否對當前使用者可見（由後端依登入狀態回傳） */
  show_price?: boolean;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  // 前端別名 (方便使用)
  id?: number;
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  banner?: string;
  keywords?: string[];
  category?: string;
  level?: CourseLevel;
  lessonsCount?: number;
  duration?: string;
  ratingAverage?: number;
  ratingCount?: number;
  totalEnrolled?: number;
}

/** 課程評價 */
export interface CourseReview {
  review_id: number;
  course_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  users?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

/** 影片類型 */
export type VideoType = "youtube" | "instagram" | "vimeo" | "tiktok" | "other";

/** 影片分類 */
export type VideoCategory =
  | "training"
  | "technique"
  | "motivation"
  | "nutrition"
  | "other";

/** 影片資料 */
export interface Video {
  // 資料庫欄位 (snake_case)
  video_id: number;
  title: string;
  title_en?: string | null;
  url: string;
  type: VideoType;
  thumbnail?: string;
  thumbnail_url?: string;
  duration?: number;
  description?: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  // 前端別名
  id?: number;
  category?: VideoCategory;
  views?: number;
  isVisible?: boolean;
  sortOrder?: number;
}

/** 文章狀態 */
export type ArticleStatus = "draft" | "published" | "archived";

/** 文章作者資訊 */
export interface ArticleAuthor {
  display_name: string | null;
  avatar_url: string | null;
}

/** 文章資料 */
export interface Article {
  article_id: number;
  author_id: number;
  article_title: string;
  article_slug: string;
  article_description?: string;
  article_content?: string;
  article_thumbnail_url?: string;
  article_banner_url?: string;
  article_keywords?: string;
  article_category?: string;
  // i18n 英文欄位（nullable，未填時 fallback 顯示中文）
  article_title_en?: string | null;
  article_description_en?: string | null;
  article_content_en?: string | null;
  article_keywords_en?: string | null;
  article_category_en?: string | null;
  status: ArticleStatus;
  view_count: number;
  rating_average: number;
  rating_count: number;
  comment_count: number;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  users?: ArticleAuthor;
  // 前端別名 (方便使用)
  author?: ArticleAuthor;
}

/** 文章評分 */
export interface ArticleRating {
  rating_id: number;
  article_id: number;
  user_id: number;
  rating: number;
  created_at: string;
  users?: ArticleAuthor;
}

/** 文章留言 */
export interface ArticleComment {
  comment_id: number;
  article_id: number;
  user_id: number;
  parent_comment_id?: number;
  content: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  users?: ArticleAuthor;
  replies?: ArticleComment[];
  // 前端別名 (方便使用)
  author?: ArticleAuthor;
}

/** 文章列表回應 */
export interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}
