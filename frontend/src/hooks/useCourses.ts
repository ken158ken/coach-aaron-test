/**
 * useCourses Hook - 管理課程資料
 * @module hooks/useCourses
 */

import { useState, useEffect } from "react";
import { courseService } from "@/services";
import type { Course } from "@/types";

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 獲取課程列表
 */
export const useCourses = (): UseCoursesReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "獲取課程失敗");
      console.error("獲取課程失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
  };
};
