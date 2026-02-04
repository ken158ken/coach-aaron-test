/**
 * useUser Hook - 管理用戶狀態與購買課程資訊
 * @module hooks/useUser
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context";
import { get } from "@/services/api";

/** 用戶已購買課程 */
export interface UserCourse {
  user_course_id: number;
  user_id: number;
  course_id: number;
  order_id?: number;
  access_granted_at: string;
  access_expires_at?: string;
  is_active: boolean;
  last_accessed_at?: string;
  course?: {
    course_id: number;
    course_title: string;
    course_slug?: string;
    course_thumbnail_url?: string;
  };
}

/** useUser Hook 返回類型 */
export interface UseUserReturn {
  /** 用戶是否已登入 */
  isAuthenticated: boolean;
  /** 用戶是否為管理員 */
  isAdmin: boolean;
  /** 用戶 ID */
  userId: number | null;
  /** 用戶顯示名稱 */
  displayName: string | null;
  /** 用戶頭像 */
  avatarUrl: string | null;
  /** 用戶已購買的課程列表 */
  purchasedCourses: UserCourse[];
  /** 是否正在載入購買課程 */
  loadingPurchases: boolean;
  /** 檢查用戶是否已購買指定課程 */
  hasPurchasedCourse: (courseId: number) => boolean;
  /** 重新載入購買課程列表 */
  refreshPurchases: () => Promise<void>;
}

/**
 * useUser Hook
 *
 * 提供完整的用戶狀態管理，包含已購買課程的查詢
 *
 * @example
 * ```tsx
 * const { hasPurchasedCourse, isAuthenticated } = useUser();
 *
 * if (hasPurchasedCourse(courseId)) {
 *   // 顯示評論表單
 * }
 * ```
 *
 * @returns {UseUserReturn} 用戶狀態與方法
 */
export const useUser = (): UseUserReturn => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [purchasedCourses, setPurchasedCourses] = useState<UserCourse[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  /**
   * 取得用戶已購買的課程
   */
  const fetchPurchasedCourses = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPurchasedCourses([]);
      return;
    }

    try {
      setLoadingPurchases(true);
      const data = await get<UserCourse[]>("/api/user/courses");
      setPurchasedCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[useUser] Failed to fetch purchased courses:", error);
      setPurchasedCourses([]);
    } finally {
      setLoadingPurchases(false);
    }
  }, [isAuthenticated, user]);

  /**
   * 檢查用戶是否已購買指定課程
   *
   * @param courseId 課程 ID
   * @returns 是否已購買
   */
  const hasPurchasedCourse = useCallback(
    (courseId: number): boolean => {
      // 管理員預設可以評論所有課程
      if (isAdmin) return true;

      return purchasedCourses.some(
        (uc) => uc.course_id === courseId && uc.is_active,
      );
    },
    [purchasedCourses, isAdmin],
  );

  /**
   * 重新載入購買課程列表
   */
  const refreshPurchases = useCallback(async () => {
    await fetchPurchasedCourses();
  }, [fetchPurchasedCourses]);

  // 當用戶登入狀態改變時，重新載入購買課程
  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchasedCourses();
    } else {
      setPurchasedCourses([]);
    }
  }, [isAuthenticated, fetchPurchasedCourses]);

  return {
    isAuthenticated,
    isAdmin,
    userId: user?.user_id ?? null,
    displayName: user?.display_name ?? user?.name ?? null,
    avatarUrl: user?.avatar_url ?? null,
    purchasedCourses,
    loadingPurchases,
    hasPurchasedCourse,
    refreshPurchases,
  };
};

export default useUser;
