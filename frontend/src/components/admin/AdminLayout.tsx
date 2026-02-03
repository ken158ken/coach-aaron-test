/**
 * AdminLayout 元件 - 管理後台佈局
 * @module components/admin/AdminLayout
 */

import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth, useTheme, useLanguage } from "@/context";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  className?: string;
}

/**
 * AdminLayout - 管理後台主佈局
 *
 * @param {AdminLayoutProps} props - 元件屬性
 * @returns {JSX.Element} 管理後台佈局
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ className = "" }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleColorMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check admin access
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`flex min-h-screen bg-luxe-bg ${className}`}>
      {/* Sidebar - Hidden on mobile by default */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1
          transition-all
          duration-300
          w-full
          lg:ml-0
          ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}
        `}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-luxe-surface border-b border-luxe-gold/10 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 text-luxe-muted hover:text-luxe-gold transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme & Language Toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleColorMode}
                  title={isDark ? t.theme.light : t.theme.dark}
                  className="p-2 text-luxe-muted hover:text-luxe-gold transition-colors"
                >
                  {isDark ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleLanguage}
                  title={language === "zh-TW" ? "English" : "中文"}
                  className="px-2 py-1 text-xs text-luxe-muted hover:text-luxe-gold transition-colors border border-luxe-gold/20 rounded"
                >
                  {language === "zh-TW" ? "EN" : "中"}
                </button>
              </div>

              <span className="hidden sm:inline text-luxe-muted text-xs sm:text-sm truncate max-w-[150px]">
                {user?.name || user?.email}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-luxe-gold/20 flex items-center justify-center">
                <span className="text-luxe-gold text-xs sm:text-sm font-medium">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
