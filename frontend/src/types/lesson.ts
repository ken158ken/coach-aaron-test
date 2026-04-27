/**
 * 教學影片（Loom）類型
 * @module types/lesson
 */

/** 逐字稿單句 */
export interface TranscriptEntry {
  /** 起始秒（含小數） */
  start: number;
  /** 結束秒 */
  end: number;
  /** 文字 */
  text: string;
}

/** 列表用的 lesson summary（不含 transcript） */
export interface LessonSummary {
  id: number;
  title: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  provider: "loom";
  loom_id: string;
  thumbnail_url?: string | null;
  category?: string | null;
  category_en?: string | null;
  keywords?: string | null;
  duration_seconds?: number | null;
  view_count: number;
  sort_order: number;
  created_at: string;
}

/** 詳情用：含 transcript 與後台欄位 */
export interface Lesson extends LessonSummary {
  loom_url: string;
  transcript?: TranscriptEntry[] | null;
  transcript_lang?: string | null;
  is_published: boolean;
  updated_at?: string;
}

/** 後台 CRUD 用的 input */
export interface LessonInput {
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  loom_url: string;
  thumbnail_url?: string;
  category?: string;
  category_en?: string;
  keywords?: string;
  duration_seconds?: number;
  sort_order?: number;
  is_published?: boolean;
  /** Admin 直接貼 VTT/SRT 文字 */
  transcript_raw?: string;
  /** 直接給結構化 entries（覆寫 raw） */
  transcript?: TranscriptEntry[];
  transcript_lang?: string;
  /** 要求後端嘗試從 Loom 抓 transcript */
  fetch_transcript?: boolean;
}
