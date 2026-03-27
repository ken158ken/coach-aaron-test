/**
 * Services 統一導出
 * @module services
 */

export { default as apiClient, get, post, put, del } from "./api";
export { authService } from "./auth.service";
export { userService } from "./user.service";
export { courseService } from "./course.service";
export { videoService } from "./video.service";
export { landingService, PAGE_KIND_LABELS, STATUS_LABELS } from "./landing.service";
export type { LpTemplate, LpProject, LpProjectDetail, LpPublicProject, LpResolvedField, PageKind, ProjectStatus } from "./landing.service";
