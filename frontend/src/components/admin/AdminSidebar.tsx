/**
 * AdminSidebar 元件 - 管理後台側邊欄
 * @module components/admin/AdminSidebar
 *
 * @description
 * 桌面版：固定左側，展開 w-64 / 收合 w-20
 * 手機版：overlay 方式滑出，點擊連結或遮罩後自動收回
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/context";
import { LogoMark } from "@/components/brand";
import UnreadBadge from "@/components/chat/UnreadBadge";
import { feedbackService } from "@/services/feedback/feedback.service";
import { leadsService } from "@/services/site/leads.service";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  /** 導航時呼叫（手機版用來關閉側邊欄） */
  onNavigate?: () => void;
  /** 目前是否為行動裝置 */
  isMobile?: boolean;
}

/**
 * AdminSidebar - 管理後台側邊導航
 *
 * @param {AdminSidebarProps} props - 元件屬性
 * @returns {JSX.Element} 側邊欄
 */
const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onToggle,
  onNavigate,
  isMobile = false,
}) => {
  const location = useLocation();
  const { t } = useLanguage();

  // 等待教練回應的反饋數（喇叭項目的紅圈）
  const [waitingCoachCount, setWaitingCoachCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    feedbackService
      .stats()
      .then((s) => {
        if (!cancelled) setWaitingCoachCount(s.waiting_coach || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // 切換到反饋頁時重新抓一次，回覆完數字才會更新
  }, [location.pathname]);

  // 待聯繫（new）的報名數（表單報名項目的紅圈）
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    leadsService
      .stats()
      .then((s) => {
        if (!cancelled) setNewLeadsCount(s.new || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // 切換頁面時重新抓一次，處理完數字才會更新
  }, [location.pathname]);

  // 定義標籤映射：核心字典沒有的幾條走 adminLayout.nav*
  const labels: Record<string, string> = {
    dashboard: t.admin.dashboard,
    users: t.admin.users,
    courses: t.admin.courses,
    videos: t.admin.videos,
    lessons: t.admin.lessons,
    articles: t.admin.articles,
    landingPages: t.admin.landingPages,
    whitelist: t.admin.whitelist,
    whispers: t.adminLayout.navWhispers,
    feedback: t.adminFeedbackPage.navLabel,
    leads: t.adminLeadsPage.navLabel,
    content: t.adminLayout.navContent,
    export: t.admin.export,
    googleCalendar: t.adminLayout.navGoogleCalendar,
  };

  // 項目 → 紅圈數字
  const badges: Record<string, number> = {
    feedback: waitingCoachCount,
    leads: newLeadsCount,
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
        path: "/admin/lessons",
        labelKey: "lessons",
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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
        path: "/admin/landing-pages",
        labelKey: "landingPages",
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
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
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
      {
        path: "/admin/whispers",
        labelKey: "whispers",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        path: "/admin/feedback",
        labelKey: "feedback",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
        ),
      },
      {
        path: "/admin/leads",
        labelKey: "leads",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h4"
            />
          </svg>
        ),
      },
      {
        path: "/admin/export",
        labelKey: "export",
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        ),
      },
      {
        path: "/admin/google-calendar",
        labelKey: "googleCalendar",
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
      data-tour="admin-sidebar"
      className={`
        fixed left-0 top-0 bottom-0
        bg-luxe-surface border-r border-luxe-gold/10
        transition-all duration-300 overflow-hidden
        ${
          isMobile
            ? isOpen
              ? "w-64 translate-x-0 z-40"
              : "w-0 -translate-x-full z-40"
            : isOpen
              ? "w-64 z-20"
              : "w-20 z-20"
        }
      `}
    >
      {/* Logo + Close (mobile) */}
      <div className="h-14 sm:h-16 flex items-center justify-between border-b border-luxe-gold/10 px-3">
        <Link
          to="/"
          onClick={onNavigate}
          aria-label={t.adminLayout.brandAria}
          className={`flex items-center gap-2 sm:gap-3 ${
            isOpen ? "" : "w-full justify-center"
          }`}
        >
          {/* 品牌 mark 放在淺色圓角底片上（與 app icon 同一套處理）。
              admin sidebar 是深色 surface，酒紅 mark 直接貼上去對比僅約 1.75:1，
              墊底片後在深/淺兩種 admin 主題下都清楚，收合成 w-20 也維持置中。 */}
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-[7px] bg-[#f6f4f0] w-9 h-9"
            aria-hidden="true"
          >
            <LogoMark className="w-7 h-7" />
          </span>
          {isOpen && (
            <span className="text-sm sm:text-base text-luxe-text font-light tracking-widest whitespace-nowrap">
              ADMIN
            </span>
          )}
        </Link>
        {/* 手機版關閉按鈕 */}
        {isMobile && isOpen && (
          <button
            onClick={onToggle}
            className="p-1.5 text-luxe-muted hover:text-luxe-gold transition-colors"
            aria-label={t.adminLayout.closeSidebar}
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 sm:p-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path} className="relative">
              {/* Animated active background — slides between items via layoutId */}
              {isActive(item.path) && (
                <motion.div
                  layoutId="admin-active-pill"
                  className="absolute inset-0 rounded-lg bg-luxe-gold/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Link
                to={item.path}
                onClick={onNavigate}
                data-tour={`admin-nav-${item.labelKey}`}
                className={`
                  relative flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3
                  rounded-lg text-sm transition-colors
                  ${
                    isActive(item.path)
                      ? "text-luxe-gold"
                      : "text-luxe-muted hover:text-luxe-text hover:bg-luxe-gold/5"
                  }
                `}
              >
                <span className="flex-shrink-0 relative">
                  {item.icon}
                  {/* 收合時：紅點提示（省空間，不顯示數字）*/}
                  {!isOpen && (badges[item.labelKey] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-luxe-surface" />
                  )}
                </span>
                {isOpen && (
                  <>
                    <span className="truncate whitespace-nowrap">
                      {labels[item.labelKey]}
                    </span>
                    {(badges[item.labelKey] || 0) > 0 && (
                      <UnreadBadge
                        count={badges[item.labelKey]}
                        className="ml-auto"
                      />
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 border-t border-luxe-gold/10">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3 rounded-lg text-sm text-luxe-muted hover:text-luxe-text hover:bg-luxe-gold/5 transition-colors"
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
          {isOpen && <span className="whitespace-nowrap">{t.common.back}</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
