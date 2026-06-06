/**
 * 路由統一掛載
 * 所有 /api/* route 都在這裡集中 mount，讓 index.ts 只管 app 初始化與 middleware。
 */

import type { Express } from "express";

import authRoutes        from "./auth.js";
import authGoogleRoutes  from "./authGoogle.js";
import authLineRoutes    from "./authLine.js";
import coursesRoutes     from "./courses.js";
import videosRoutes      from "./videos.js";
import lessonsRoutes     from "./lessons.js";
import adminRoutes       from "./admin.js";
import articlesRoutes    from "./articles.js";
import userRoutes        from "./user.js";
import searchRoutes      from "./search.js";
import contentRoutes     from "./content.js";
import contactRoutes     from "./contact.js";
import slidesRoutes      from "./slides.js";
import marqueeRoutes     from "./marquee.js";
import podcastRoutes     from "./podcast.js";
import coachRoutes       from "./coach.js";
import bookingRoutes     from "./bookings.js";
import chatRoutes        from "./chat.js";
import presenceRoutes    from "./presence.js";
import chatCronRoutes    from "./chatCron.js";
import notificationsRoutes from "./notifications.js";
import landingRoutes     from "./landing.js";
import exportRoutes      from "./export.js";
import adminExportRoutes from "./adminExport.js";
import whispersRoutes    from "./whispers.js";

export function registerRoutes(app: Express): void {
  // ── 認證 ──────────────────────────────────────────────
  app.use("/api/auth",        authRoutes);
  app.use("/api/auth/google", authGoogleRoutes);
  app.use("/api/auth/line",   authLineRoutes);

  // ── 公開內容 ──────────────────────────────────────────
  app.use("/api/courses",     coursesRoutes);
  app.use("/api/videos",      videosRoutes);
  app.use("/api/lessons",     lessonsRoutes);
  app.use("/api/articles",    articlesRoutes);
  app.use("/api/content",     contentRoutes);
  app.use("/api/slides",      slidesRoutes);
  app.use("/api/marquee",     marqueeRoutes);
  app.use("/api/podcast",     podcastRoutes);
  app.use("/api/landing",     landingRoutes);

  // ── 用戶 ──────────────────────────────────────────────
  app.use("/api/user",        userRoutes);
  app.use("/api/contact",     contactRoutes);
  app.use("/api/search",      searchRoutes);

  // ── 預約系統 ──────────────────────────────────────────
  app.use("/api/coach",       coachRoutes);
  app.use("/api/bookings",    bookingRoutes);

  // ── 聊天 & 在線狀態 ───────────────────────────────────
  app.use("/api/chat",        chatRoutes);
  app.use("/api/presence",    presenceRoutes);

  // ── 通知 ──────────────────────────────────────────────
  app.use("/api/notifications", notificationsRoutes);

  // ── 後台管理 ──────────────────────────────────────────
  app.use("/api/admin",         adminRoutes);
  app.use("/api/admin/export",  adminExportRoutes);

  // ── 匯出（會員端） ────────────────────────────────────
  app.use("/api/export",      exportRoutes);

  // ── 悄悄話 ────────────────────────────────────────────
  app.use("/api/whispers",    whispersRoutes);

  // ── 排程任務 ──────────────────────────────────────────
  app.use("/api/cron",        chatCronRoutes);
}
