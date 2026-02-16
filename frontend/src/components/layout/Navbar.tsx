/**
 * 導航列元件 - LUXE 風格 + User Dropdown
 * @module components/layout/Navbar
 *
 * 桌面版：Logo | 導航連結(居中) | 搜尋 + Avatar 下拉選單
 * 手機版：Logo + 漢堡按鈕，展開全選單
 *
 * User Dropdown 包含：日夜切換、中英切換、會員中心、後台(管理者)、登出/登入
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { GlobalSearch, SearchButton } from "@/components/ui/GlobalSearch";

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[Navbar] ${msg}`),
};

interface NavLink {
  name: string;
  path: string;
}

/* ================================================================== */
/*  SVG Icons                                                          */
/* ================================================================== */

const SunIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
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
);

const MoonIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
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
);

const UserIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const GlobeIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
    />
  </svg>
);

/* ================================================================== */
/*  UserAvatar 子元件                                                  */
/* ================================================================== */

interface UserAvatarProps {
  user: {
    display_name?: string;
    name?: string;
    avatar_url?: string;
    email?: string;
  } | null;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}

/**
 * UserAvatar - 使用者頭像圓形按鈕
 *
 * @param {UserAvatarProps} props - 元件屬性
 * @returns {JSX.Element} 頭像按鈕
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  onClick,
  className = "",
}) => {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  const glowClass = "avatar-glow";

  // 未登入
  if (!user) {
    return (
      <button
        onClick={onClick}
        className={`${dim} rounded-full border border-white/20 bg-luxe-surface flex items-center justify-center text-luxe-muted hover:border-luxe-gold hover:text-luxe-gold transition-all duration-200 ${glowClass} ${className}`}
      >
        <UserIcon className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
      </button>
    );
  }

  const initial = (user.display_name || user.name || user.email || "U")
    .charAt(0)
    .toUpperCase();

  // 有頭像
  if (user.avatar_url) {
    return (
      <button
        onClick={onClick}
        className={`${dim} rounded-full overflow-hidden border-2 border-luxe-gold/50 hover:border-luxe-gold transition-all duration-200 ring-0 hover:ring-2 hover:ring-luxe-gold/20 ${glowClass} ${className}`}
      >
        <img
          src={user.avatar_url}
          alt="avatar"
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  // 無頭像 → 首字母
  return (
    <button
      onClick={onClick}
      className={`${dim} rounded-full bg-luxe-gold/20 border-2 border-luxe-gold/50 hover:border-luxe-gold flex items-center justify-center text-luxe-gold font-semibold transition-all duration-200 hover:bg-luxe-gold/30 ${glowClass} ${className}`}
    >
      {initial}
    </button>
  );
};

/* ================================================================== */
/*  UserDropdown 子元件                                                */
/* ================================================================== */

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * UserDropdown - 使用者下拉選單
 *
 * 包含：日夜模式、語言切換、會員中心、後台管理(管理員)、登出/登入
 *
 * @param {UserDropdownProps} props - 元件屬性
 * @returns {JSX.Element | null} 下拉選單
 */
const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose }) => {
  const { user, logout, mounted, isAdmin } = useAuth();
  const { isDark, toggleColorMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  /** 點擊外部關閉 */
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const timer = setTimeout(
      () => document.addEventListener("click", handleClick),
      0,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [isOpen, onClose]);

  /** ESC 關閉 */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    try {
      logout();
      logger.info("使用者已登出");
    } catch (err) {
      console.error("[Navbar] 登出失敗:", err);
    }
    onClose();
  };

  const itemClass =
    "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-luxe-text/80 hover:text-luxe-text hover:bg-luxe-gold/5 transition-colors duration-150 cursor-pointer";
  const divider = "border-t border-white/[0.06] my-1";

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2.5 w-56 bg-luxe-bg/95 backdrop-blur-xl border border-luxe-gold/15 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-[60]"
      style={{ animation: "dropdownIn 0.15s ease-out" }}
      role="menu"
    >
      {/* 使用者資訊 */}
      {mounted && user && (
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-sm font-medium text-luxe-text truncate">
            {user.display_name || user.name || "使用者"}
          </p>
          <p className="text-xs text-luxe-muted truncate mt-0.5">
            {user.email}
          </p>
        </div>
      )}

      {/* 切換區塊 */}
      <div className="py-1">
        {/* 日夜模式 */}
        <button onClick={toggleColorMode} className={itemClass} role="menuitem">
          {!themeReady ? (
            <MoonIcon className="w-4 h-4 text-luxe-muted" />
          ) : isDark ? (
            <SunIcon className="w-4 h-4 text-amber-400" />
          ) : (
            <MoonIcon className="w-4 h-4 text-indigo-400" />
          )}
          <span>
            {!themeReady ? t.theme.dark : isDark ? t.theme.light : t.theme.dark}
          </span>
          <span className="ml-auto text-[10px] text-luxe-muted/60 px-1.5 py-0.5 border border-white/10 rounded">
            {!themeReady ? "🌙" : isDark ? "☀️" : "🌙"}
          </span>
        </button>

        {/* 語言切換 */}
        <button onClick={toggleLanguage} className={itemClass} role="menuitem">
          <GlobeIcon className="w-4 h-4 text-luxe-muted" />
          <span>{language === "zh-TW" ? "English" : "中文"}</span>
          <span className="ml-auto text-[10px] text-luxe-muted/60 px-1.5 py-0.5 border border-white/10 rounded">
            {language === "zh-TW" ? "EN" : "中"}
          </span>
        </button>
      </div>

      <div className={divider} />

      {/* 帳號區塊 */}
      <div className="py-1">
        {mounted && user ? (
          <>
            {/* 會員中心 */}
            <button
              onClick={() => handleNav("/member")}
              className={itemClass}
              role="menuitem"
            >
              <svg
                className="w-4 h-4 text-luxe-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{t.nav.memberCenter}</span>
            </button>

            {/* 後台管理（管理員限定） */}
            {isAdmin && (
              <button
                onClick={() => handleNav("/admin")}
                className={itemClass}
                role="menuitem"
              >
                <svg
                  className="w-4 h-4 text-luxe-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
                <span className="text-luxe-gold">{t.nav.admin}</span>
              </button>
            )}

            {/* 自訂頁面編輯器（管理員限定） */}
            {isAdmin && (
              <button
                onClick={() => handleNav("/admin/landing-pages")}
                className={itemClass}
                role="menuitem"
              >
                <svg
                  className="w-4 h-4 text-luxe-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
                  />
                </svg>
                <span className="text-luxe-gold">{t.nav.landingPages}</span>
              </button>
            )}
            <div className={divider} />

            {/* 登出 */}
            <button
              onClick={handleLogout}
              className={`${itemClass} !text-red-400/80 hover:!text-red-400 hover:!bg-red-500/5`}
              role="menuitem"
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
                  strokeWidth={1.5}
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              <span>{t.nav.logout}</span>
            </button>
          </>
        ) : (
          <>
            {/* 登入 */}
            <button
              onClick={() => handleNav("/login")}
              className={itemClass}
              role="menuitem"
            >
              <svg
                className="w-4 h-4 text-luxe-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              <span>{t.nav.login}</span>
            </button>

            {/* 註冊 */}
            <button
              onClick={() => handleNav("/register")}
              className={itemClass}
              role="menuitem"
            >
              <svg
                className="w-4 h-4 text-luxe-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              <span className="text-luxe-gold">{t.nav.register}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ================================================================== */
/*  MobileMenu 子元件                                                  */
/* ================================================================== */

interface MobileMenuProps {
  navLinks: NavLink[];
  currentPath: string;
  onClose: () => void;
  onOpenSearch: () => void;
}

/**
 * MobileMenu - 手機版展開選單
 *
 * @param {MobileMenuProps} props - 元件屬性
 * @returns {JSX.Element} 手機選單
 */
const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  currentPath,
  onClose,
  onOpenSearch,
}) => {
  const { user, logout, mounted, isAdmin } = useAuth();
  const { isDark, toggleColorMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    try {
      logout();
      logger.info("使用者已登出 (mobile)");
    } catch (err) {
      console.error("[Navbar] 登出失敗:", err);
    }
    onClose();
  };

  const mobileItemClass =
    "flex items-center gap-3 w-full text-left text-sm text-luxe-text/80 hover:text-luxe-gold py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors";

  return (
    <div
      className="lg:hidden mt-3 py-4 border-t border-white/10 bg-luxe-bg/95 backdrop-blur-xl rounded-xl -mx-2 px-3"
      style={{ animation: "dropdownIn 0.2s ease-out" }}
    >
      {/* 使用者資訊 */}
      {mounted && user && (
        <div className="flex items-center gap-3 pb-3 mb-2 border-b border-white/[0.06] px-1">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-luxe-text truncate">
              {user.display_name || user.name || "使用者"}
            </p>
            <p className="text-xs text-luxe-muted truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* 導航連結 */}
      <div className="flex flex-col gap-0.5">
        {navLinks.map((link, index) => (
          <button
            key={link.name}
            onClick={() => handleNav(link.path)}
            className={`mobile-menu-item text-left text-[15px] tracking-wider transition-colors py-2.5 px-3 rounded-lg ${
              currentPath === link.path
                ? "text-luxe-gold bg-luxe-gold/5"
                : "text-luxe-text hover:text-luxe-gold hover:bg-white/[0.02]"
            }`}
            style={{ animationDelay: `${index * 0.04 + 0.05}s` }}
          >
            {link.name}
          </button>
        ))}
      </div>

      {/* 功能區塊 */}
      <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-col gap-0.5">
        {/* 搜尋 */}
        <button onClick={onOpenSearch} className={mobileItemClass}>
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>搜尋</span>
          <span className="ml-auto text-[10px] text-luxe-muted/50">⌘K</span>
        </button>

        {/* 日夜模式 */}
        <button onClick={toggleColorMode} className={mobileItemClass}>
          {!themeReady ? (
            <MoonIcon className="w-4 h-4" />
          ) : isDark ? (
            <SunIcon className="w-4 h-4 text-amber-400" />
          ) : (
            <MoonIcon className="w-4 h-4 text-indigo-400" />
          )}
          <span>
            {!themeReady ? t.theme.dark : isDark ? t.theme.light : t.theme.dark}
          </span>
        </button>

        {/* 語言 */}
        <button onClick={toggleLanguage} className={mobileItemClass}>
          <GlobeIcon className="w-4 h-4" />
          <span>{language === "zh-TW" ? "English" : "中文"}</span>
        </button>
      </div>

      {/* 帳號區塊 */}
      <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-col gap-0.5">
        {mounted && user ? (
          <>
            <button
              onClick={() => handleNav("/member")}
              className={mobileItemClass}
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
                  strokeWidth={1.5}
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{t.nav.memberCenter}</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNav("/admin")}
                className="flex items-center gap-3 w-full text-left text-sm text-luxe-gold py-2.5 px-3 rounded-lg hover:bg-luxe-gold/5 transition-colors"
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
                    strokeWidth={1.5}
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
                <span>{t.nav.admin}</span>
              </button>
            )}
            {/* 自訂頁面編輯器（管理員限定） */}
            {isAdmin && (
              <button
                onClick={() => handleNav("/admin/landing-pages")}
                className="flex items-center gap-3 w-full text-left text-sm text-luxe-gold py-2.5 px-3 rounded-lg hover:bg-luxe-gold/5 transition-colors"
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
                    strokeWidth={1.5}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
                  />
                </svg>
                <span>{t.nav.landingPages}</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left text-sm text-red-400/80 hover:text-red-400 py-2.5 px-3 rounded-lg hover:bg-red-500/5 transition-colors"
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
                  strokeWidth={1.5}
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              <span>{t.nav.logout}</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNav("/login")}
              className={mobileItemClass}
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
                  strokeWidth={1.5}
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              <span>{t.nav.login}</span>
            </button>
            <button
              onClick={() => handleNav("/register")}
              className="flex items-center gap-3 w-full text-left text-sm text-luxe-gold py-2.5 px-3 rounded-lg hover:bg-luxe-gold/5 transition-colors"
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
                  strokeWidth={1.5}
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              <span>{t.nav.register}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Navbar 主元件                                                      */
/* ================================================================== */

/**
 * Navbar - 導航列主元件
 *
 * @returns {JSX.Element} 導航列
 */
const Navbar: React.FC = (): JSX.Element => {
  const { user, mounted } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // 全域快捷鍵 Ctrl+K / Cmd+K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /** GSAP 進場動畫 */
  useEffect(() => {
    if (navRef.current) {
      import("gsap").then(({ default: gsap }) => {
        gsap.fromTo(
          navRef.current,
          { y: -100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        );
      });
    }
  }, []);

  /** 路由變更時關閉選單 */
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // 導航連結
  const baseNavLinks: NavLink[] = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.courses, path: "/courses" },
    { name: t.nav.videos, path: "/videos" },
    { name: t.nav.articles, path: "/articles" },
    { name: t.nav.contact, path: "/contact" },
  ];

  const navLinks: NavLink[] =
    mounted && user?.sex
      ? [
          ...baseNavLinks.slice(0, 1),
          { name: t.nav.photos, path: "/photos" },
          ...baseNavLinks.slice(1),
        ]
      : baseNavLinks;

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-10 xl:px-16 py-3 sm:py-4 ${
        isDark
          ? "bg-gradient-to-b from-[rgba(10,10,10,0.92)] to-transparent"
          : "bg-gradient-to-b from-[rgba(255,255,255,0.95)] to-transparent shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="text-xl sm:text-2xl tracking-widest font-display hover:scale-105 transition-transform duration-300 flex-shrink-0"
          style={{ color: "var(--luxe-gold)" }}
        >
          阿倫教官
        </Link>

        {/* ── Desktop Nav Links (居中) ── */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-5 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative text-sm xl:text-[15px] 2xl:text-base tracking-wide xl:tracking-wider transition-all duration-300 hover:text-luxe-gold group px-2 xl:px-3 py-1 whitespace-nowrap ${
                location.pathname === link.path
                  ? "text-luxe-gold"
                  : "text-luxe-text"
              }`}
            >
              {link.name}
              <span
                className={`absolute -bottom-0.5 left-2 right-2 h-[2px] bg-luxe-gold transition-all duration-300 ${
                  location.pathname === link.path
                    ? "w-[calc(100%-1rem)]"
                    : "w-0 group-hover:w-[calc(100%-1rem)]"
                }`}
              />
            </Link>
          ))}
        </div>

        {/* ── Desktop Right: Search + Avatar ── */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <SearchButton onClick={() => setSearchOpen(true)} />

          {/* Avatar + dropdown trigger */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={userDropdownOpen}
            >
              <UserAvatar user={mounted ? user : null} />
              <svg
                className={`w-3 h-3 text-luxe-muted group-hover:text-luxe-gold transition-all duration-200 ${userDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <UserDropdown
              isOpen={userDropdownOpen}
              onClose={() => setUserDropdownOpen(false)}
            />
          </div>
        </div>

        {/* ── Mobile Right: Search + Hamburger ── */}
        <div className="flex lg:hidden items-center gap-2">
          <SearchButton onClick={() => setSearchOpen(true)} />
          <button
            className="text-luxe-text hover:text-luxe-gold transition-colors p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "關閉選單" : "開啟選單"}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <MobileMenu
          navLinks={navLinks}
          currentPath={location.pathname}
          onClose={() => setMobileMenuOpen(false)}
          onOpenSearch={() => {
            setMobileMenuOpen(false);
            setSearchOpen(true);
          }}
        />
      )}

      {/* 全域搜尋 Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;
