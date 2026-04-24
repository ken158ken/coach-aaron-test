/**
 * Podcast 單集管理服務
 * @module services/podcast.service
 *
 * 對應後端 `routes/podcast.ts` 與首頁元件 `PodcastExpandable.tsx`。
 */

import { get, post, put, del } from "./api";

// ============================================================
// Types
// ============================================================

export type EpisodeCategory = "training" | "nutrition" | "mindset";

export const EPISODE_CATEGORIES: EpisodeCategory[] = [
  "training",
  "nutrition",
  "mindset",
];

export const EPISODE_CATEGORY_LABEL: Record<EpisodeCategory, string> = {
  training: "訓練",
  nutrition: "營養",
  mindset: "心態",
};

export interface PodcastEpisode {
  id: number;
  title: string;
  description: string;
  full_description: string;
  duration: string;
  episode_date: string;
  category: EpisodeCategory;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Service
// ============================================================

export const podcastService = {
  // ===== 公開 API =====

  /** 取得所有啟用的單集 */
  getAll: (): Promise<PodcastEpisode[]> =>
    get<PodcastEpisode[]>("/api/podcast"),

  // ===== 管理員 API =====

  /** 取得所有單集（含停用） */
  getAdminAll: (): Promise<PodcastEpisode[]> =>
    get<PodcastEpisode[]>("/api/podcast/admin"),

  /** 新增單集 */
  create: (data: {
    title: string;
    description?: string;
    fullDescription?: string;
    duration?: string;
    episodeDate?: string;
    category?: EpisodeCategory;
    sortOrder?: number;
  }): Promise<PodcastEpisode> =>
    post<PodcastEpisode>("/api/podcast/admin", data),

  /** 更新單集 */
  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      fullDescription: string;
      duration: string;
      episodeDate: string;
      category: EpisodeCategory;
      sortOrder: number;
      isActive: boolean;
    }>,
  ): Promise<PodcastEpisode> =>
    put<PodcastEpisode>(`/api/podcast/admin/${id}`, data),

  /** 刪除單集 */
  remove: (id: number): Promise<void> => del(`/api/podcast/admin/${id}`),
};

export default podcastService;
