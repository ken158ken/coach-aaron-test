/**
 * 幻燈片管理服務
 * @module services/slides.service
 * 涵蓋：學員見證幻燈片（自動輪播）+ 相片輪播（手動翻頁）
 */

import { get, post, put, del } from "../api";

// ============================================================
// Types
// ============================================================

export interface TestimonialSlide {
  id: number;
  image_url: string;
  name: string;
  achievement: string;
  quote: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface TestimonialConfig {
  interval_ms: number;
  is_published: boolean;
  card_layout: 'portrait' | 'landscape';
}

export interface GallerySlide {
  id: number;
  image_url: string;
  caption: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface GalleryConfig {
  is_published: boolean;
}

// ============================================================
// Service
// ============================================================

export const slidesService = {
  // ===== 公開 API =====

  /** 取得啟用的學員見證幻燈片 */
  getTestimonials: (): Promise<TestimonialSlide[]> =>
    get<TestimonialSlide[]>("/api/slides/testimonials"),

  /** 取得學員見證幻燈片設定（interval_ms、is_published） */
  getTestimonialsConfig: (): Promise<TestimonialConfig> =>
    get<TestimonialConfig>("/api/slides/testimonials/config"),

  /** 取得啟用的相片輪播幻燈片 */
  getGallery: (): Promise<GallerySlide[]> =>
    get<GallerySlide[]>("/api/slides/gallery"),

  /** 取得相片輪播設定（is_published） */
  getGalleryConfig: (): Promise<GalleryConfig> =>
    get<GalleryConfig>("/api/slides/gallery/config"),

  // ===== 管理員 API — 學員見證 =====

  /** 取得所有學員見證幻燈片（含停用） */
  getAdminTestimonials: (): Promise<TestimonialSlide[]> =>
    get<TestimonialSlide[]>("/api/slides/admin/testimonials"),

  /** 新增學員見證幻燈片 */
  createTestimonial: (data: {
    imageUrl: string;
    name: string;
    achievement?: string;
    quote?: string;
    sortOrder?: number;
  }): Promise<TestimonialSlide> =>
    post<TestimonialSlide>("/api/slides/admin/testimonials", data),

  /** 更新學員見證幻燈片 */
  updateTestimonial: (
    id: number,
    data: Partial<{
      imageUrl: string;
      name: string;
      achievement: string;
      quote: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ): Promise<TestimonialSlide> =>
    put<TestimonialSlide>(`/api/slides/admin/testimonials/${id}`, data),

  /** 刪除學員見證幻燈片 */
  deleteTestimonial: (id: number): Promise<void> =>
    del(`/api/slides/admin/testimonials/${id}`),

  /** 取得學員見證設定（管理員） */
  getAdminTestimonialsConfig: (): Promise<TestimonialConfig> =>
    get<TestimonialConfig>("/api/slides/admin/testimonials/config"),

  /** 更新學員見證設定 */
  updateTestimonialsConfig: (data: {
    intervalMs?: number;
    isPublished?: boolean;
    cardLayout?: 'portrait' | 'landscape';
  }): Promise<TestimonialConfig> =>
    put<TestimonialConfig>("/api/slides/admin/testimonials/config", data),

  // ===== 管理員 API — 相片輪播 =====

  /** 取得所有相片輪播幻燈片（含停用） */
  getAdminGallery: (): Promise<GallerySlide[]> =>
    get<GallerySlide[]>("/api/slides/admin/gallery"),

  /** 新增相片輪播幻燈片 */
  createGallery: (data: {
    imageUrl: string;
    caption?: string;
    sortOrder?: number;
  }): Promise<GallerySlide> =>
    post<GallerySlide>("/api/slides/admin/gallery", data),

  /** 更新相片輪播幻燈片 */
  updateGallery: (
    id: number,
    data: Partial<{
      imageUrl: string;
      caption: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ): Promise<GallerySlide> =>
    put<GallerySlide>(`/api/slides/admin/gallery/${id}`, data),

  /** 刪除相片輪播幻燈片 */
  deleteGallery: (id: number): Promise<void> =>
    del(`/api/slides/admin/gallery/${id}`),

  /** 取得相片輪播設定（管理員） */
  getAdminGalleryConfig: (): Promise<GalleryConfig> =>
    get<GalleryConfig>("/api/slides/admin/gallery/config"),

  /** 更新相片輪播設定 */
  updateGalleryConfig: (data: { isPublished: boolean }): Promise<GalleryConfig> =>
    put<GalleryConfig>("/api/slides/admin/gallery/config", data),
};

export default slidesService;
