/**
 * AdminLayout 元件 - 管理後台佈局
 * @module components/admin/AdminLayout
 */

import React, { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useTheme, useLanguage } from "@/context";
import AdminSidebar from "./AdminSidebar";

/** 行動版斷點 (px) */
const MOBILE_BREAKPOINT = 1024;

interface AdminLayoutProps {
  className?: string;
}

/**
 * AdminLayout - 管理後台主佈局
 * 手機版預設收合側邊欄，桌面版預設展開
 *
 * @param {AdminLayoutProps} props - 元件屬性
 * @returns {JSX.Element} 管理後台佈局
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const { isDark, toggleColorMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  // SSR-safe: 預設 false，hydration 後根據螢幕寬度決定
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /**
   * 偵測螢幕尺寸，決定 sidebar 預設狀態
   */
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    handleResize();
    // 桌面版預設展開
    if (window.innerWidth >= MOBILE_BREAKPOINT) {
      setSidebarOpen(true);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Top Bar scroll glow — 偵測主內容區捲動
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    const handleScroll = () => setScrolled(mainEl.scrollTop > 8);
    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * 切換側邊欄（手機版點擊連結後自動收合）
   */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Auth guard 已由 App.tsx RequireAdmin 統一處理

  return (
    <div className={`flex min-h-screen bg-luxe-bg ${className}`}>
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onNavigate={closeSidebarOnMobile}
        isMobile={isMobile}
      />

      {/* Mobile Overlay — 點擊遮罩關閉側邊欄 */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1 min-w-0
          transition-all duration-300
          ${!isMobile && sidebarOpen ? "lg:ml-64" : !isMobile ? "lg:ml-20" : ""}
        `}
      >
        {/* Top Bar — scroll-aware glow border */}
        <motion.header
          className="sticky top-0 z-20 bg-luxe-surface px-3 sm:px-4 md:px-6 py-2.5 sm:py-3"
          animate={{
            borderBottomWidth: "1px",
            borderBottomColor: scrolled ? "rgba(197,160,89,0.35)" : "rgba(197,160,89,0.10)",
            boxShadow: scrolled
              ? "0 4px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(197,160,89,0.15)"
              : "none",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ borderBottomStyle: "solid" }}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left: Toggle + Breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* 漢堡選單 */}
              <button
                onClick={toggleSidebar}
                className="p-1.5 sm:p-2 text-luxe-muted hover:text-luxe-gold transition-colors shrink-0"
                aria-label="Toggle sidebar"
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

              {/* 返回前台（手機版顯示圖示，桌面版顯示文字） */}
              <Link
                to="/"
                className="text-luxe-muted hover:text-luxe-gold transition-colors text-xs sm:text-sm flex items-center gap-1 shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden sm:inline">前台</span>
              </Link>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
              {/* Theme & Language Toggle */}
              <button
                onClick={toggleColorMode}
                title={isDark ? t.theme.light : t.theme.dark}
                className="p-1.5 sm:p-2 text-luxe-muted hover:text-luxe-gold transition-colors"
              >
                {isDark ? (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-luxe-muted hover:text-luxe-gold transition-colors border border-luxe-gold/20 rounded"
              >
                {language === "zh-TW" ? "EN" : "中"}
              </button>

              {/* User Info */}
              <span className="hidden md:inline text-luxe-muted text-xs truncate max-w-30">
                {user?.name || user?.email}
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-luxe-gold/20 flex items-center justify-center shrink-0">
                <span className="text-luxe-gold text-[10px] sm:text-xs md:text-sm font-medium">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content — AnimatePresence page transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="p-3 sm:p-4 md:p-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminLayout;
