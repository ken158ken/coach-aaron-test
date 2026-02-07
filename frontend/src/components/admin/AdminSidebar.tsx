/**
 * AdminSidebar 元件 - 管理後台側邊欄
 * @module components/admin/AdminSidebar
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * AdminSidebar - 管理後台側邊導航
 *
 * @param {AdminSidebarProps} props - 元件屬性
 * @returns {JSX.Element} 側邊欄
 */
const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { t, isZhTW } = useLanguage();

  // 定義標籤映射
  const labels: Record<string, string> = {
    dashboard: t.admin.dashboard,
    users: t.admin.users,
    courses: t.admin.courses,
    videos: t.admin.videos,
    articles: t.admin.articles,
    whitelist: t.admin.whitelist,
    content: isZhTW ? "內容管理" : "Content",
  };

  const navItems: { path: string; labelKey: string; icon: React.ReactNode }[] =
    [
      {
        path: "/admin",
        labelKey: "dashboard",
        icon: (
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        ),
      },
      {
        path: "/admin/users",
        labelKey: "users",
        icon: (
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
      },
      {
        path: "/admin/courses",
        labelKey: "courses",
        icon: (
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        ),
      },
      {
        path: "/admin/videos",
        labelKey: "videos",
        icon: (
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        ),
      },
      {
        path: "/admin/content",
        labelKey: "content",
        icon: (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
      },
      {
        path: "/admin/articles",
        labelKey: "articles",
        icon: (
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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        ),
      },
      {
        path: "/admin/whitelist",
        labelKey: "whitelist",
        icon: (
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
      },
    ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed
        left-0
        top-0
        bottom-0
        z-20
        bg-luxe-surface
        border-r
        border-luxe-gold/10
        transition-all
        duration-300
        ${isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Logo */}
      <div className="h-14 sm:h-16 flex items-center justify-center border-b border-luxe-gold/10">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <span className="text-luxe-gold text-xl sm:text-2xl font-bold">
            A
          </span>
          {isOpen && (
            <span className="text-sm sm:text-base text-luxe-text font-light tracking-widest">
              ADMIN
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <ul className="space-y-1.5 sm:space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`
                  flex
                  items-center
                  gap-2
                  sm:gap-3
                  px-3
                  sm:px-4
                  py-2.5
                  sm:py-3
                  rounded-lg
                  transition-colors
                  text-sm
                  sm:text-base
                  ${
                    isActive(item.path)
                      ? "bg-luxe-gold/10 text-luxe-gold"
                      : "text-luxe-muted hover:text-luxe-text hover:bg-luxe-gold/5"
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isOpen && (
                  <span className="truncate">{labels[item.labelKey]}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-luxe-gold/10">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-luxe-muted hover:text-luxe-text hover:bg-luxe-gold/5 transition-colors"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          {isOpen && <span>{t.common.back}</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
