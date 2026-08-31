/**
 * 導覽註冊表 — 路由 → 步驟定義
 * @module tours/registry
 *
 * @description
 * 「?」按鈕是**全域掛一顆**（AdminLayout 與前台 Layout 各一），
 * 靠這張表決定「目前這頁有沒有導覽」——查不到就整顆按鈕不渲染。
 * 因此新增一頁導覽只要：寫一支 `pages/xxx.tour.ts` + 在下面加一列。
 *
 * 只收「管理後台」與「登入後的會員區」；公開行銷頁（首頁、課程列表、
 * 文章、關於、聯絡…）刻意不列入，那些頁面不會出現「?」鈕。
 *
 * 每份步驟定義都是 `import()` 動態載入，不會進主 bundle。
 */

import { matchPath } from "react-router-dom";
import type { TourDefinition } from "./types";

/** 步驟定義的載入器 */
type TourLoader = () => Promise<{ default: TourDefinition }>;

export interface TourEntry {
  /** react-router 路徑樣式（完整比對） */
  pattern: string;
  load: TourLoader;
}

/**
 * 註冊表。順序即優先序——雖然 `matchPath` 用 `end: true` 完整比對，
 * 靜態路徑仍排在動態路徑前面，避免日後放寬比對時撞車。
 */
const ENTRIES: TourEntry[] = [
  // ── 管理後台（AdminLayout 之下） ──────────────────────
  { pattern: "/admin", load: () => import("./pages/adminDashboard.tour") },
  { pattern: "/admin/users", load: () => import("./pages/adminUsers.tour") },
  { pattern: "/admin/courses", load: () => import("./pages/adminCourses.tour") },
  { pattern: "/admin/videos", load: () => import("./pages/adminVideos.tour") },
  { pattern: "/admin/lessons", load: () => import("./pages/adminLessons.tour") },
  { pattern: "/admin/content", load: () => import("./pages/adminContent.tour") },
  { pattern: "/admin/articles", load: () => import("./pages/adminArticles.tour") },
  {
    pattern: "/admin/landing-pages",
    load: () => import("./pages/adminLandingPages.tour"),
  },
  { pattern: "/admin/whitelist", load: () => import("./pages/adminWhitelist.tour") },
  { pattern: "/admin/whispers", load: () => import("./pages/adminWhispers.tour") },
  { pattern: "/admin/feedback", load: () => import("./pages/adminFeedback.tour") },
  { pattern: "/admin/leads", load: () => import("./pages/adminLeads.tour") },
  { pattern: "/admin/export", load: () => import("./pages/adminExport.tour") },
  {
    pattern: "/admin/google-calendar",
    load: () => import("./pages/adminGoogleCalendar.tour"),
  },
  { pattern: "/admin/notes", load: () => import("./pages/adminNotes.tour") },

  // ── 管理後台（獨立全頁編輯器） ────────────────────────
  {
    pattern: "/admin/articles/new",
    load: () => import("./pages/adminArticleEditor.tour"),
  },
  {
    pattern: "/admin/articles/:id/edit",
    load: () => import("./pages/adminArticleEditor.tour"),
  },
  {
    pattern: "/admin/courses/new",
    load: () => import("./pages/adminCourseEditor.tour"),
  },
  {
    pattern: "/admin/courses/:id/edit",
    load: () => import("./pages/adminCourseEditor.tour"),
  },
  {
    pattern: "/admin/landing-pages/new",
    load: () => import("./pages/adminLandingPageNew.tour"),
  },
  {
    pattern: "/admin/landing-pages/:id/edit",
    load: () => import("./pages/adminLandingPageEditor.tour"),
  },

  // ── 會員區（登入後） ──────────────────────────────────
  { pattern: "/member", load: () => import("./pages/memberCenter.tour") },
  { pattern: "/dashboard", load: () => import("./pages/memberDashboard.tour") },
  { pattern: "/booking", load: () => import("./pages/memberBooking.tour") },
  { pattern: "/my-bookings", load: () => import("./pages/memberMyBookings.tour") },
  { pattern: "/chat", load: () => import("./pages/memberChat.tour") },
  { pattern: "/chat/:conversationId", load: () => import("./pages/memberChat.tour") },
  {
    pattern: "/notifications",
    load: () => import("./pages/memberNotifications.tour"),
  },
  { pattern: "/notes", load: () => import("./pages/memberNotes.tour") },
  { pattern: "/coach", load: () => import("./pages/coachDashboard.tour") },
];

/**
 * 查出某個路徑對應的導覽入口。
 * 純字串比對、不碰 DOM，所以 SSR 與 client 兩邊算出來一定一樣。
 *
 * @param pathname - 目前路由路徑
 * @returns 對應的入口；沒有則 undefined
 */
export function findTour(pathname: string): TourEntry | undefined {
  // 尾斜線正規化：/admin/courses/ 與 /admin/courses 視為同一頁
  const path =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return ENTRIES.find((e) => matchPath({ path: e.pattern, end: true }, path) !== null);
}

/** 這個路徑有沒有導覽 */
export const hasTour = (pathname: string): boolean => findTour(pathname) !== undefined;
