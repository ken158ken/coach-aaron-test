/**
 * 教學影片（Loom）服務
 * @module services/lesson.service
 */

import { get, post, put, del } from "../api";
import type { Lesson, LessonSummary, LessonInput } from "@/types";

export const lessonService = {
  /** 公開列表（已發佈） */
  getAll: () => get<LessonSummary[]>("/api/lessons"),

  /** 公開單筆 */
  getById: (id: number | string) => get<Lesson>(`/api/lessons/${id}`),

  /** Admin：含未發佈 */
  adminGetAll: () => get<Lesson[]>("/api/lessons/admin/all"),

  create: (data: LessonInput) => post<Lesson>("/api/lessons", data),

  update: (id: number | string, data: Partial<LessonInput>) =>
    put<Lesson>(`/api/lessons/${id}`, data),

  remove: (id: number | string) =>
    del<{ success: boolean }>(`/api/lessons/${id}`),
};

export default lessonService;
