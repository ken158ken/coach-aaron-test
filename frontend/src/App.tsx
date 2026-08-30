/**
 * 應用程式根元件
 * @module App
 */

import { Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ChatNotificationProvider } from "@/context/ChatNotificationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { DialogProvider } from "@/components/ui/Dialog";
import { RequireAuth, RequireAdmin } from "@/components/auth/RequireAuth";
import { useHeartbeat } from "@/hooks/usePresence";

/* ══════════════════════════════════════════════════════════════════════════
 * 路由載入策略 —— 改動前請先讀完這段
 *
 * `entry-server.tsx` 用的是 `renderToString`，它「不會等待」Suspense：
 * 只要 SSR 當下渲染到尚未 resolve 的 lazy 元件，React 會直接吐出 Suspense
 * fallback 當作該頁的 HTML。對需要 SEO 的頁面而言，這等於把內容換成一顆
 * spinner 送給 Googlebot —— 本站 Lighthouse SEO 100 分會直接歸零。
 *
 * 因此本檔的分界線是「這條路由需不需要被搜尋引擎索引」，不是「這頁大不大」：
 *
 *   ● 靜態 import（下方 A 區）＝ 所有公開／可索引路由。
 *     react-router 只渲染「命中的」那一條路由，所以只要公開路由全是靜態的，
 *     SSR 期間 Suspense 邊界永遠不會被觸發，SSR 輸出與改動前逐字相同。
 *
 *   ● React.lazy（下方 B 區）＝ 後台 /admin 與登入後才進得去的頁面。
 *     這些頁面本來就 noindex、也不靠 SSR；就算被 SSR 命中，最壞情況只是先送出
 *     fallback 再由 CSR 接管（伺服器與 client 首次渲染都是 fallback，
 *     不會有 hydration mismatch）。
 *
 * ⚠️ 要把新路由加進 B 區之前，請先確認它不需要 SEO。
 * ══════════════════════════════════════════════════════════════════════════ */

/* ── A 區：公開／可索引路由 —— 必須維持靜態 import ───────────────────── */
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import AppInstall from "@/pages/AppInstall";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Videos from "@/pages/Videos";
import Lessons from "@/pages/Lessons";
import LessonDetail from "@/pages/LessonDetail";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import Contact from "@/pages/Contact";
import PublishedPages from "@/pages/PublishedPages";
import LandingPageViewer from "@/pages/LandingPageViewer";

/* ── B 區：無 SEO 需求 —— 切成獨立 chunk ─────────────────────────────── */

// 登入 / 註冊（公開但 noindex）
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));

// 會員區（需登入）
const MemberCenter = lazy(() => import("@/pages/MemberCenter")); // → dicebear
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const BookingPage = lazy(() => import("@/pages/BookingPage")); // → react-day-picker
const MyBookingsPage = lazy(() => import("@/pages/MyBookingsPage"));
const CoachDashboard = lazy(() => import("@/pages/coach/CoachDashboard"));
const ChatPage = lazy(() => import("@/pages/Chat"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));

// 後台（訪客 100% 用不到）
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminCourses = lazy(() => import("@/pages/admin/AdminCourses")); // → tiptap
const AdminVideos = lazy(() => import("@/pages/admin/AdminVideos"));
const AdminLessons = lazy(() => import("@/pages/admin/AdminLessons"));
const AdminContent = lazy(() => import("@/pages/admin/AdminContent")); // → tiptap
const AdminWhitelist = lazy(() => import("@/pages/admin/AdminWhitelist"));
const AdminWhispers = lazy(() => import("@/pages/admin/AdminWhispers"));
const AdminFeedback = lazy(() => import("@/pages/admin/AdminFeedback"));
const AdminArticles = lazy(() => import("@/pages/admin/AdminArticles")); // → tiptap
const AdminExport = lazy(() => import("@/pages/admin/AdminExport"));
const AdminGoogleCalendar = lazy(() => import("@/pages/admin/AdminGoogleCalendar"));
const LandingPageManager = lazy(() => import("@/pages/admin/LandingPageManager"));
const LandingPageNew = lazy(() => import("@/pages/admin/LandingPageNew"));

// 全螢幕編輯器（最重的三個）
const ArticleEditor = lazy(() => import("@/pages/admin/ArticleEditor"));
const CourseEditor = lazy(() => import("@/pages/admin/CourseEditor"));
const LandingPageEditor = lazy(() => import("@/pages/admin/LandingPageEditor"));

import SmoothScroll from "@/components/layout/SmoothScroll";
import PageBlade from "@/components/layout/PageBlade";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";
import AOS from "aos";
import "aos/dist/aos.css";

/**
 * App 根元件
 *
 * @returns {JSX.Element} 應用程式根元件
 */

/** 觸發在線心跳（已登入才打），需在 AuthProvider 內 */
const Heartbeat: React.FC = () => {
  useHeartbeat();
  return null;
};

/**
 * 路由 chunk 載入中的過場畫面。
 *
 * ⚠️ 刻意做成「置中的小 spinner」而非全螢幕不透明遮罩 —— 舊的 #app-loader
 *    正是因為蓋滿全螢幕又綁在 JS 執行完成上，把 FCP 拖到 8.1 秒。這裡不要重蹈覆轍：
 *    不要加 position:fixed + inset:0 + 不透明背景。
 */
const RouteFallback: React.FC = () => {
  // 這個 fallback 掛在 <LanguageProvider> 內的 <Suspense>，可安全取用字典
  const { t } = useLanguage();
  return (
  <div
    className="flex items-center justify-center py-24"
    role="status"
    aria-live="polite"
    aria-label={t.common.loading}
  >
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
  </div>
  );
};

function App(): JSX.Element {
  // 初始化 AOS
  // 注意：AOS 的 scroll listener 在 Lenis 環境下不會被觸發，
  // 實際的 AOS.refresh() 呼叫由 SmoothScroll.tsx 中的 Lenis scroll 回調負責。
  // 這裡的 setTimeout refresh 是為了處理 Lenis 動態載入完成前的時窗。
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-quart",
      once: true,
      offset: 60,
      // disable: false — 全平台啟用，由 Lenis 驅動更新
    });
    // 延遲 refresh：確保 Lenis 初始化 + 首屏 DOM 完成後重新計算所有 data-aos 元素位置
    const t = setTimeout(() => AOS.refresh(), 500);
    return () => clearTimeout(t);
  }, []);

  // 全域點擊監聽：點擊 navbar 以外的區域觸發全頁銀刃
  useEffect(() => {
    let lastFired = 0;
    const handleGlobalClick = (e: MouseEvent) => {
      const nav = document.querySelector("nav");
      if (nav && nav.contains(e.target as Node)) return; // navbar 由自身處理
      const now = Date.now();
      if (now - lastFired < 600) return; // 600ms 冷卻，避免連點重複
      lastFired = now;
      window.dispatchEvent(new CustomEvent("trigger:pageblade"));
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  // 全域滾動監聽：設定 --scroll-y CSS variable，供視差效果使用
  useEffect(() => {
    const handleScroll = () => {
      document.documentElement.style.setProperty("--scroll-y", String(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

    return (
    <AuthProvider>
      <NotificationProvider>
      <ChatNotificationProvider>
        <Heartbeat />
      <ThemeProvider>
        <LanguageProvider>
          <DialogProvider>
            <SmoothScroll>
              <Analytics />
              <ScrollToTop />
              <PageBlade />
              {/* Suspense 邊界：公開路由全為靜態 import，SSR 期間永不觸發（見檔首說明） */}
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* 前台路由 */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="app" element={<AppInstall />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="courses/:id" element={<CourseDetail />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="lessons" element={<Lessons />} />
                  <Route path="lessons/:id" element={<LessonDetail />} />
                  <Route path="articles" element={<Articles />} />
                  <Route path="articles/:slug" element={<ArticleDetail />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route
                    path="member"
                    element={
                      <RequireAuth>
                        <MemberCenter />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <RequireAuth>
                        <Dashboard />
                      </RequireAuth>
                    }
                  />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="checkout/success" element={<CheckoutSuccess />} />
                  <Route path="pages" element={<PublishedPages />} />
                  <Route
                    path="booking"
                    element={
                      <RequireAuth>
                        <BookingPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="my-bookings"
                    element={
                      <RequireAuth>
                        <MyBookingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="coach"
                    element={
                      <RequireAuth>
                        <CoachDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="chat"
                    element={
                      <RequireAuth>
                        <ChatPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="chat/:conversationId"
                    element={
                      <RequireAuth>
                        <ChatPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="notifications"
                    element={
                      <RequireAuth>
                        <NotificationsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="feedback"
                    element={
                      <RequireAuth>
                        <FeedbackPage />
                      </RequireAuth>
                    }
                  />
                </Route>

                {/* Landing Page 公開預覽（不套 Layout，獨立全頁） */}
                <Route path="/page/:slug" element={<LandingPageViewer />} />

                {/* 後台路由 */}
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="videos" element={<AdminVideos />} />
                  <Route path="lessons" element={<AdminLessons />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="articles" element={<AdminArticles />} />
                  <Route path="landing-pages" element={<LandingPageManager />} />
                  <Route path="whitelist" element={<AdminWhitelist />} />
                  <Route path="whispers" element={<AdminWhispers />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="export" element={<AdminExport />} />
                  <Route path="google-calendar" element={<AdminGoogleCalendar />} />
                </Route>

                {/* 獨立編輯器路由 (全螢幕，不含 AdminLayout) */}
                <Route
                  path="/admin/articles/new"
                  element={
                    <RequireAdmin>
                      <ArticleEditor />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/articles/:id/edit"
                  element={
                    <RequireAdmin>
                      <ArticleEditor />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/courses/new"
                  element={
                    <RequireAdmin>
                      <CourseEditor />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/courses/:id/edit"
                  element={
                    <RequireAdmin>
                      <CourseEditor />
                    </RequireAdmin>
                  }
                />

                {/* Landing Page — 模板選擇器 + 編輯器（全螢幕，不含 AdminLayout） */}
                <Route
                  path="/admin/landing-pages/new"
                  element={
                    <RequireAdmin>
                      <LandingPageNew />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/landing-pages/:id/edit"
                  element={
                    <RequireAdmin>
                      <LandingPageEditor />
                    </RequireAdmin>
                  }
                />
              </Routes>
              </Suspense>
            </SmoothScroll>
          </DialogProvider>
        </LanguageProvider>
      </ThemeProvider>
      </ChatNotificationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
