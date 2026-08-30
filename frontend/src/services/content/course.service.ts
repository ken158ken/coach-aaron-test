/**
 * 課程服務
 * @module services/course.service
 */

import { get, post, put, del } from "../api";
import type { Course, AdminCourse, CourseReview } from "@/types";

/**
 * 編輯器的 camelCase payload → 後端 snake_case。
 * 已是 snake 的 key（quick-edit 等呼叫端）原樣通過；camel 的轉換後移除，
 * 避免後端 allowedFields 比對不到而整包 no-op。
 */
function toCoursePayload(data: Record<string, unknown>): Record<string, unknown> {
  const CAMEL_TO_SNAKE: Record<string, string> = {
    courseTitle: "course_title",
    courseSlug: "course_slug",
    courseDescription: "course_description",
    courseContent: "course_content",
    courseVideoUrl: "course_video_url",
    courseThumbnailUrl: "course_thumbnail_url",
    courseBannerUrl: "course_banner_url",
    courseKeywords: "keywords",
    courseCategory: "category",
    courseLevel: "course_level",
    accessDurationDays: "access_duration_days",
  };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    out[CAMEL_TO_SNAKE[key] ?? key] = value;
  }
  return out;
}

/**
 * 正規化課程資料 (資料庫欄位 -> 前端欄位)
 * @param data 原始課程資料
 * @returns 正規化後的課程資料
 */
const normalizeCourse = (data: Partial<Course>): Course => {
  return {
    ...data,
    // 保留原始欄位，同時添加前端別名
    id: data.course_id,
    title: data.course_title,
    slug: data.course_slug,
    description: data.course_description,
    content: data.course_content,
    thumbnail: data.course_thumbnail_url,
    banner: data.course_banner_url,
    keywords: data.course_keywords
      ? data.course_keywords.split(",").map((k) => k.trim())
      : [],
    level: data.course_level,
    lessonsCount: data.lessons_count,
    duration: data.duration_minutes
      ? `${data.duration_minutes} 分鐘`
      : undefined,
    ratingAverage: data.rating_average,
    ratingCount: data.rating_count,
    totalEnrolled: data.total_enrolled,
  } as Course;
};

/**
 * 課程服務物件
 */
export const courseService = {
  /**
   * 檢查課程 slug 是否已存在
   */
  checkSlug: async (
    slug: string,
    excludeId?: string,
  ): Promise<{ exists: boolean }> => {
    const params = new URLSearchParams({ slug });
    if (excludeId) params.append("excludeId", excludeId);
    return get<{ exists: boolean }>(
      `/api/courses/check-slug?${params.toString()}`,
    );
  },

  /**
   * 取得所有課程
   */
  getAll: async (): Promise<Course[]> => {
    const data = await get<Course[]>("/api/courses");
    return Array.isArray(data) ? data.map(normalizeCourse) : [];
  },

  /**
   * 取得所有課程 (alias)
   */
  getCourses: async (): Promise<Course[]> => {
    const data = await get<Course[]>("/api/courses");
    return Array.isArray(data) ? data.map(normalizeCourse) : [];
  },

  /**
   * 取得單一課程
   */
  getById: async (id: number): Promise<Course> => {
    const data = await get<Course>(`/api/courses/${id}`);
    return normalizeCourse(data);
  },

  /**
   * 取得課程評論
   */
  getReviews: async (courseId: number): Promise<CourseReview[]> => {
    return get<CourseReview[]>(`/api/courses/${courseId}/reviews`);
  },

  /**
   * 新增或更新課程評論
   * @param courseId 課程 ID
   * @param rating 評分 (1-5)
   * @param comment 評論內容 (可選)
   * @returns 評論資料
   */
  addReview: async (
    courseId: number,
    rating: number,
    comment?: string,
  ): Promise<CourseReview> => {
    return post<CourseReview>(`/api/courses/${courseId}/reviews`, {
      rating,
      comment,
    });
  },

  /**
   * 建立課程（管理員）
   *
   * 後端實際路由是 `/api/courses`（`/api/admin/courses` 從不存在——
   * 舊版指到幽靈端點導致編輯器發布永遠 404）。
   * 編輯器送 camelCase，後端吃 snake_case，這裡統一轉換。
   */
  create: async (data: Partial<AdminCourse>): Promise<AdminCourse> => {
    return post<AdminCourse>("/api/courses", toCoursePayload(data));
  },

  /**
   * 更新課程（管理員）
   */
  update: async (
    id: number,
    data: Partial<AdminCourse>,
  ): Promise<AdminCourse> => {
    return put<AdminCourse>(`/api/courses/${id}`, toCoursePayload(data));
  },

  /**
   * 刪除課程（管理員）
   */
  delete: async (id: number): Promise<void> => {
    return del(`/api/courses/${id}`);
  },
};

export default courseService;
