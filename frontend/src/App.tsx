/**
 * 應用程式根元件
 * @module App
 */

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ChatNotificationProvider } from "@/context/ChatNotificationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { DialogProvider } from "@/components/ui/Dialog";
import { RequireAuth, RequireAdmin } from "@/components/auth/RequireAuth";
import { useHeartbeat } from "@/hooks/usePresence";

// Layout
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/admin/AdminLayout";

// Pages
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Videos from "@/pages/Videos";
import Lessons from "@/pages/Lessons";
import LessonDetail from "@/pages/LessonDetail";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MemberCenter from "@/pages/MemberCenter";
import Dashboard from "@/pages/Dashboard";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import LandingPageViewer from "@/pages/LandingPageViewer";
import PublishedPages from "@/pages/PublishedPages";
import BookingPage from "@/pages/BookingPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import CoachDashboard from "@/pages/coach/CoachDashboard";
import ChatPage from "@/pages/Chat";
import NotificationsPage from "@/pages/NotificationsPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminVideos from "@/pages/admin/AdminVideos";
import AdminLessons from "@/pages/admin/AdminLessons";
import AdminContent from "@/pages/admin/AdminContent";
import AdminWhitelist from "@/pages/admin/AdminWhitelist";
import AdminArticles from "@/pages/admin/AdminArticles";
import ArticleEditor from "@/pages/admin/ArticleEditor";
import CourseEditor from "@/pages/admin/CourseEditor";
import LandingPageManager from "@/pages/admin/LandingPageManager";
import LandingPageNew from "@/pages/admin/LandingPageNew";
import LandingPageEditor from "@/pages/admin/LandingPageEditor";
import AdminExport from "@/pages/admin/AdminExport";

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
import { useEffect } from "react";

/** 觸發在線心跳（已登入才打），需在 AuthProvider 內 */
const Heartbeat: React.FC = () => {
  useHeartbeat();
  return null;
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

  // React 掛載後移除載入遮罩
  useEffect(() => {
    const loader = document.getElementById("app-loader");
    if (!loader) return;
    loader.classList.add("fade-out");
    const t = setTimeout(() => loader.remove(), 380);
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
              <Routes>
                {/* 前台路由 */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
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
                  <Route path="export" element={<AdminExport />} />
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
