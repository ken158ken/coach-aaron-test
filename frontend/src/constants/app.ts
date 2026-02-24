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
  INSTAGRAM: "https://www.instagram.com/coach.luen",
  FACEBOOK: "https://www.facebook.com/populuen/",
  YOUTUBE: "https://youtube.com/@coach_aaron",
  LINE_OFFICIAL: "https://line.me/R/ti/p/@667nqldx",
  LINE_GROUP:
    "https://line.me/ti/g2/ppb_IYd6tOfdy9jwzkjMPOa6eJCo5rm22ObUoQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  TIKTOK: "https://www.tiktok.com/@coachluen",
  PODCAST:
    "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
} as const;

// Coach Contact Info
export const COACH_INFO = {
  NAME: "阿倫教官",
  TITLE: "威豪健身總教官｜私教變現專家",
  EMAIL: "s330221@gmail.com",
  LINE_ID: "@667nqldx",
  BUSINESS_HOURS: "週一至週六 09:00 - 21:00",
} as const;
