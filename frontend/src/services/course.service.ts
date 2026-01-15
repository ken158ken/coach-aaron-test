/**
 * 課程服務 - 處理課程相關的 API 請求
 * @module services/course
 */

import { get } from "./api";
import type { Course } from "@/types";

/**
 * 課程列表回應
 */
interface CoursesResponse {
  courses: Course[];
}

/**
 * 課程詳情回應
 */
interface CourseResponse {
  course: Course;
}

/**
 * Course Service
 */
export const courseService = {
  /**
   * 獲取所有課程
   */
  async getCourses(): Promise<Course[]> {
    const response = await get<CoursesResponse>("/api/courses");
    return response.courses;
  },

  /**
   * 獲取課程詳情
   */
  async getCourseById(courseId: number): Promise<Course> {
    const response = await get<CourseResponse>(`/api/courses/${courseId}`);
    return response.course;
  },

  /**
   * 根據 slug 獲取課程
   */
  async getCourseBySlug(slug: string): Promise<Course> {
    const response = await get<CourseResponse>(`/api/courses/slug/${slug}`);
    return response.course;
  },
};
