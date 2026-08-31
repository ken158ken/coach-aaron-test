/**
 * Services 統一導出
 *
 * 子目錄分組：
 *   auth/          → auth.service, user.service
 *   content/       → article, course, video, lesson
 *   site/          → content(文案), marquee, podcast, slides, landing
 *   social/        → chat, presence, realtime, supabase.client
 *   booking/       → booking, coach
 *   notifications/ → notification, pushSubscription
 *
 * 使用方式：
 *   import { authService } from "@/services"               ← 常用服務走 barrel
 *   import { chatService } from "@/services/social/chat.service"  ← 特定服務走路徑
 */

// Core HTTP client
export { default as apiClient, get, post, put, patch, del, getAuthToken, setAuthToken } from "./api";

// Auth & User
export { authService } from "./auth/auth.service";
export { userService } from "./auth/user.service";

// Content
export { courseService } from "./content/course.service";
export { videoService } from "./content/video.service";
export { lessonService } from "./content/lesson.service";
export { articleService } from "./content/article.service";

// Site
export { landingService, PAGE_KIND_LABELS, STATUS_LABELS } from "./site/landing.service";
export type { LpTemplate, LpProject, LpProjectDetail, LpPublicProject, LpResolvedField, PageKind, ProjectStatus } from "./site/landing.service";
