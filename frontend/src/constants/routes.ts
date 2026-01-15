/**
 * 路由常數
 * @module constants/routes
 */

export const ROUTES = {
  HOME: "/",
  COURSES: "/courses",
  VIDEOS: "/videos",
  COACH_PHOTOS: "/coach-photos",
  CONTACT: "/contact",

  // 認證
  LOGIN: "/login",
  REGISTER: "/register",

  // 會員
  MEMBER_CENTER: "/member",
  DASHBOARD: "/dashboard",

  // 管理員
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_COURSES: "/admin/courses",
  ADMIN_VIDEOS: "/admin/videos",
  ADMIN_USERS: "/admin/users",
  ADMIN_WHITELIST: "/admin/whitelist",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
