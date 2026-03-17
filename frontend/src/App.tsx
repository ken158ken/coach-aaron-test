/**
 * 應用程式根元件
 * @module App
 */

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { DialogProvider } from "@/components/ui/Dialog";
import { RequireAuth, RequireAdmin } from "@/components/auth/RequireAuth";

// Layout
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/admin/AdminLayout";

// Pages
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Videos from "@/pages/Videos";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MemberCenter from "@/pages/MemberCenter";
import Dashboard from "@/pages/Dashboard";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminVideos from "@/pages/admin/AdminVideos";
import AdminContent from "@/pages/admin/AdminContent";
import AdminWhitelist from "@/pages/admin/AdminWhitelist";
import AdminArticles from "@/pages/admin/AdminArticles";
import ArticleEditor from "@/pages/admin/ArticleEditor";
import CourseEditor from "@/pages/admin/CourseEditor";
import LandingPageManager from "@/pages/admin/LandingPageManager";
import LandingPageEditor from "@/pages/admin/LandingPageEditor";

import SmoothScroll from "@/components/layout/SmoothScroll";
import PageBlade from "@/components/layout/PageBlade";

/**
 * App 根元件
 *
 * @returns {JSX.Element} 應用程式根元件
 */
import { useEffect } from "react";

function App(): JSX.Element {
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

    return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <DialogProvider>
            <SmoothScroll>
              <PageBlade />
              <Routes>
                {/* 前台路由 */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="courses/:id" element={<CourseDetail />} />
                  <Route path="videos" element={<Videos />} />
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
                </Route>

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
                  <Route path="content" element={<AdminContent />} />
                  <Route path="articles" element={<AdminArticles />} />
                  <Route path="landing-pages" element={<LandingPageManager />} />
                  <Route path="whitelist" element={<AdminWhitelist />} />
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

                {/* Landing Page 編輯器（全螢幕） */}
                <Route
                  path="/admin/landing-pages/new"
                  element={
                    <RequireAdmin>
                      <LandingPageEditor />
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
    </AuthProvider>
  );
}

export default App;
