/**
 * 應用程式根元件
 * @module App
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

// Layout
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/admin/AdminLayout";

// Pages
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Videos from "@/pages/Videos";
import CoachPhotos from "@/pages/CoachPhotos";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MemberCenter from "@/pages/MemberCenter";
import Dashboard from "@/pages/Dashboard";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminVideos from "@/pages/admin/AdminVideos";
import AdminContent from "@/pages/admin/AdminContent";
import AdminWhitelist from "@/pages/admin/AdminWhitelist";
import AdminArticles from "@/pages/admin/AdminArticles";

/**
 * App 根元件
 *
 * @returns {JSX.Element} 應用程式根元件
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          {/* 前台路由 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="videos" element={<Videos />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:slug" element={<ArticleDetail />} />
            <Route path="coach-photos" element={<CoachPhotos />} />
            <Route
              path="photos"
              element={<Navigate to="/coach-photos" replace />}
            />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="member" element={<MemberCenter />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* 後台路由 */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="whitelist" element={<AdminWhitelist />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
