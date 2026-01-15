/**
 * API 端點常數
 * @module constants/api
 */

export const API_ENDPOINTS = {
  // 認證
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },

  // 課程
  COURSES: {
    LIST: "/api/courses",
    DETAIL: (id: number) => `/api/courses/${id}`,
    BY_SLUG: (slug: string) => `/api/courses/slug/${slug}`,
  },

  // 影片
  VIDEOS: {
    LIST: "/api/videos",
    DETAIL: (id: number) => `/api/videos/${id}`,
  },

  // 管理員
  ADMIN: {
    USERS: "/api/admin/users",
    WHITELIST: "/api/admin/whitelist",
  },
} as const;
