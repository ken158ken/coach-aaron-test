/**
 * 導航列元件 - Studio 風格
 * @module components/layout/Navbar
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useChatNotificationContext } from "@/context/ChatNotificationContext";
import { GlobalSearch, SearchButton } from "@/components/ui/GlobalSearch";
import UnreadBadge from "@/components/chat/UnreadBadge";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LogoMark } from "@/components/brand";

interface NavLink {
  name: string;
  path: string;
}

/* ── SVG Icons ── */
const SunIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const AdminIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ── Navbar ── */
const Navbar: React.FC = (): JSX.Element => {
  const { user, logout, mounted, isAdmin } = useAuth();
  const { unreadTotal } = useChatNotificationContext();
  const { isDark, toggleColorMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const navRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [glareKey, setGlareKey] = useState(0);
  const [glareFast, setGlareFast] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 滾動偵測：超過 20px 後 navbar 加深背景
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navbar 銀刃光刷（首次 hover + 每次點擊均可觸發）
  const triggerNavGlare = useCallback(() => {
    setGlareKey((k) => k + 1); // 強制重新掛載讓動畫從頭播
    setGlareFast(true);
    setTimeout(() => setGlareFast(false), 1150);
  }, []);

  // Ctrl+K 開啟搜尋
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

  // 路由切換時關閉選單
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // 點擊外部關閉 dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // 導覽連結
  const baseNavLinks: NavLink[] = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.courses, path: "/courses" },
    { name: t.nav.videos, path: "/videos" },
    { name: t.nav.lessons, path: "/lessons" },
    { name: t.nav.articles, path: "/articles" },
    { name: t.nav.contact, path: "/contact" },
  ];

  // 註：原本會依 user.sex 插入「私密相簿 /photos」連結，但該功能已廢棄、
  //     users.sex 欄位亦已由 migration 025 移除，故不再顯示該連結。
  const navLinks: NavLink[] = baseNavLinks;

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* ── Navbar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <motion.nav
          ref={navRef}
          onMouseEnter={triggerNavGlare}
          onClick={(e) => { e.stopPropagation(); triggerNavGlare(); }}
          className="pointer-events-auto"
          animate={scrolled ? "floating" : "top"}
          variants={{
            top: {
              marginLeft: 0,
              marginRight: 0,
              marginTop: 0,
              borderRadius: 0,
              background: isDark ? "rgba(10,10,10,0.15)" : "rgba(246,243,238,0.25)",
              backdropFilter: "blur(6px)",
              borderBottom: "1px solid transparent",
              paddingLeft: "12px",
              paddingRight: "12px",
            },
            floating: {
              marginLeft: 16,
              marginRight: 16,
              marginTop: 10,
              borderRadius: 16,
              background: isDark ? "rgba(10,10,10,0.88)" : "rgba(246,243,238,0.95)",
              backdropFilter: "blur(24px)",
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
              paddingLeft: "20px",
              paddingRight: "20px",
            },
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ paddingTop: "16px", paddingBottom: "16px" }}
        >
        {/* Navbar glare 動畫條 — 獨立 overflow:hidden 容器 */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
          }}
        >
          <div
key={glareKey}
            className="navbar-glare-strip"
            style={{
              position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
              background: isDark
                ? "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.7) 50%,rgba(255,255,255,0) 100%)"
                : "linear-gradient(90deg,rgba(0,0,0,0) 0%,rgba(38,36,33,0.20) 50%,rgba(0,0,0,0) 100%)",
              transform: "skewX(-45deg)",
              animation: glareFast
                ? "navbarGlareOnce 1.1s cubic-bezier(0.22,1,0.36,1) forwards"
                : "navbarGlare 6s infinite 2s",
              opacity: glareFast ? (isDark ? 0.75 : 0.8) : (isDark ? 0.4 : 0.55),
            }}
          />
        </div>

        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-6">

          {/* Logo：品牌 mark + 銀刃文字（手機版只留 mark，避免擠壓導覽） */}
          <Link
            to="/"
            aria-label="阿倫教官 Coach Aaron 首頁"
            className="shrink-0 flex items-center gap-2 sm:gap-2.5"
          >
            <LogoMark className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
            <span
              className="hidden sm:inline font-display font-extrabold text-xl tracking-[4px] silver-text"
              style={{ textDecoration: "none" }}
            >
              AARON COACH
            </span>
          </Link>

          {/* Desktop 導覽連結 */}
          <ul className="hidden lg:flex items-center gap-8 list-none m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? "active" : ""}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* 右側工具列 */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* 搜尋按鈕 */}
            <SearchButton onClick={() => setSearchOpen(true)} />

            {/* 通知鈴鐺（登入才顯示） */}
            {mounted && user && <NotificationBell />}

            {/* User 區塊 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/20 hover:border-white/50 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.05)" }}
                aria-label="使用者選單"
              >
                {mounted && user ? (
                  <span className="text-xs font-medium text-white/80">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserIcon className="w-4 h-4 text-[#888]" />
                )}
                {mounted && user && unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1">
                    <UnreadBadge count={unreadTotal} />
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 py-2 rounded shadow-2xl z-50"
                  style={{
                    background: isDark ? "rgba(15,15,15,0.95)" : "rgba(250,248,244,0.97)",
                    backdropFilter: "blur(20px)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid rgba(0,0,0,0.10)",
                  }}
                >
                  {/* 日夜切換 */}
                  <button
                    onClick={() => { toggleColorMode(); setUserDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                  >
                    {isDark ? <SunIcon /> : <MoonIcon />}
                    <span>{isDark ? "切換亮色模式" : "切換深色模式"}</span>
                  </button>

                  {/* 語言切換 */}
                  <button
                    onClick={() => { setLanguage(language === "zh-TW" ? "en" : "zh-TW"); setUserDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                  >
                    <span className="text-base">🌐</span>
                    <span>{language === "zh-TW" ? "English" : "中文"}</span>
                  </button>

                  <div className="my-1 border-t border-white/10" />

                  {mounted && user ? (
                    <>
                      <Link
                        to="/member"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>會員中心</span>
                      </Link>

                      <Link
                        to="/booking"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                      >
                        <CalendarIcon />
                        <span>預約諮詢</span>
                      </Link>

                      <Link
                        to="/my-bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>我的預約</span>
                      </Link>

                      <Link
                        to="/chat"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                      >
                        <span className="flex items-center gap-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>訊息</span>
                        </span>
                        <UnreadBadge count={unreadTotal} />
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/coach"
                            onClick={() => setUserDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                          >
                            <CalendarIcon />
                            <span>教練儀表板</span>
                          </Link>
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                          >
                            <AdminIcon />
                            <span>後台管理</span>
                          </Link>
                          <Link
                            to="/pages"
                            onClick={() => setUserDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                            </svg>
                            <span>自訂頁面</span>
                          </Link>
                        </>
                      )}

                      <div className={`my-1 border-t ${isDark ? "border-white/10" : "border-black/8"}`} />

                      <button
                        onClick={() => { handleLogout(); setUserDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                      >
                        <LogoutIcon />
                        <span>登出</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-[#888] hover:text-white hover:bg-white/5" : "text-[#666] hover:text-[#111] hover:bg-black/5"}`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>登入 / 註冊</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* 手機漢堡選單 */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.05)" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="選單"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        </motion.nav>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col pt-20 px-6 pb-8 lg:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: isDark ? "rgba(8,8,8,0.97)" : "rgba(244,241,236,0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          <ul className="flex flex-col gap-4 list-none m-0 p-0 mt-6">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`block text-lg font-display tracking-[2px] uppercase transition-colors duration-300 ${
                    isActive(link.path)
                      ? isDark ? "text-white" : "text-[#111]"
                      : isDark ? "text-[#888] hover:text-white" : "text-[#666] hover:text-[#111]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className={`mt-auto pt-6 border-t flex items-center gap-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
            <button
              onClick={toggleColorMode}
              className={`w-9 h-9 flex items-center justify-center border rounded transition-all ${isDark ? "border-white/20 text-[#888] hover:text-white hover:border-white/50" : "border-black/20 text-[#666] hover:text-[#111] hover:border-black/50"}`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            {!mounted || !user ? (
              <Link
                to="/login"
                className="btn-metal py-2 px-6 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                登入
              </Link>
            ) : (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="btn-metal py-2 px-6 text-sm"
              >
                登出
              </button>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Global Search */}
      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
