/**
 * 應用程式常數
 * @module constants/app
 */

export const APP_NAME = "Coach Aaron";
export const APP_DESCRIPTION = "專業健身教練 - 打造理想體態";

// API
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user",
  THEME: "app_theme",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  COURSES: "/courses",
  VIDEOS: "/videos",
  COACH_PHOTOS: "/coach-photos",
  CONTACT: "/contact",
  LOGIN: "/login",
  REGISTER: "/register",
  MEMBER_CENTER: "/member",
  DASHBOARD: "/dashboard",
  ADMIN: {
    ROOT: "/admin",
    USERS: "/admin/users",
    COURSES: "/admin/courses",
    VIDEOS: "/admin/videos",
    CONTENT: "/admin/content",
  },
} as const;

// Social Links
export const SOCIAL_LINKS = {
  INSTAGRAM: "https://instagram.com/coach_aaron",
  FACEBOOK: "https://facebook.com/coach.aaron",
  YOUTUBE: "https://youtube.com/@coach_aaron",
  LINE: "https://line.me/ti/p/~coach_aaron",
} as const;
