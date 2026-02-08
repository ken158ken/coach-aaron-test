/**
 * 導航列元件 - LUXE 風格
 * @module components/layout/Navbar
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { GlobalSearch, SearchButton } from "@/components/ui/GlobalSearch";

interface NavLink {
  name: string;
  path: string;
}

/**
 * Navbar 元件
 *
 * @returns {JSX.Element} 導航列元件
 */
const Navbar: React.FC = (): JSX.Element => {
  const { user, logout, mounted } = useAuth();
  const { isDark, toggleColorMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  // 確保主題在客戶端渲染後才顯示，避免 SSR hydration mismatch
  useEffect(() => {
    setThemeReady(true);
  }, []);

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

  // 基本導航連結
  const baseNavLinks: NavLink[] = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.courses, path: "/courses" },
    { name: t.nav.videos, path: "/videos" },
    { name: t.nav.articles, path: "/articles" },
    { name: t.nav.contact, path: "/contact" },
  ];

  // 根據用戶權限決定導航連結
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
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-16 py-4 sm:py-6 ${
        isDark
          ? "bg-gradient-to-b from-[rgba(10,10,10,0.9)] to-transparent"
          : "bg-gradient-to-b from-[rgba(255,255,255,0.95)] to-transparent shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl sm:text-2xl tracking-widest font-display hover:scale-105 transition-transform duration-300"
          style={{ color: "var(--luxe-gold)" }}
        >
          阿倫教官
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-3 2xl:gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative text-sm 2xl:text-base tracking-wide 2xl:tracking-wider transition-all duration-300 hover:text-luxe-gold group ${
                location.pathname === link.path
                  ? "text-luxe-gold"
                  : "text-luxe-text"
              }`}
            >
              {link.name}
              {/* Hover underline animation */}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-luxe-gold transition-all duration-300 ${
                  location.pathname === link.path
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}

          {/* Auth Buttons */}
          {!mounted ? (
            <Link
              to="/login"
              className="text-sm 2xl:text-base tracking-wide 2xl:tracking-wider px-3 2xl:px-5 py-1.5 2xl:py-2 border border-white/20 hover:border-luxe-gold hover:text-luxe-gold hover:scale-105 transition-all duration-300"
            >
              {t.nav.login}
            </Link>
          ) : user ? (
            <div className="flex items-center gap-3 2xl:gap-5">
              <Link
                to="/member"
                className="relative text-sm 2xl:text-base tracking-wide 2xl:tracking-wider text-luxe-text hover:text-luxe-gold transition-all duration-300 group"
              >
                {t.nav.memberCenter}
                <span className="absolute -bottom-1 left-0 h-0.5 bg-luxe-gold transition-all duration-300 w-0 group-hover:w-full" />
              </Link>
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm 2xl:text-base tracking-wide 2xl:tracking-wider text-luxe-gold hover:scale-105 transition-transform duration-300"
                >
                  {t.nav.admin}
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm 2xl:text-base tracking-wide 2xl:tracking-wider px-3 2xl:px-5 py-1.5 2xl:py-2 border border-white/20 hover:border-red-500 hover:text-red-500 hover:scale-105 transition-all duration-300"
              >
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 2xl:gap-5">
              <Link
                to="/login"
                className="relative text-sm 2xl:text-base tracking-wide 2xl:tracking-wider text-luxe-text hover:text-luxe-gold transition-all duration-300 group"
              >
                {t.nav.login}
                <span className="absolute -bottom-1 left-0 h-0.5 bg-luxe-gold transition-all duration-300 w-0 group-hover:w-full" />
              </Link>
              <Link
                to="/register"
                className="text-sm 2xl:text-base tracking-wide 2xl:tracking-wider px-3 2xl:px-5 py-1.5 2xl:py-2 border border-luxe-gold text-luxe-gold hover:bg-luxe-gold hover:text-luxe-black hover:scale-105 transition-all duration-300"
              >
                {t.nav.register}
              </Link>
            </div>
          )}

          {/* Theme & Language Toggle */}
          <div className="flex items-center gap-1.5 2xl:gap-2 ml-2 2xl:ml-4 border-l border-white/20 pl-2 2xl:pl-4">
            {/* Global Search Button */}
            <SearchButton onClick={() => setSearchOpen(true)} />

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleColorMode}
              title={isDark ? t.theme.light : t.theme.dark}
              className="p-2 text-luxe-text hover:text-luxe-gold transition-colors"
            >
              {!themeReady ? (
                // SSR fallback: 使用固定圖示避免 hydration mismatch
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
              ) : isDark ? (
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
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              title={language === "zh-TW" ? "English" : "中文"}
              className="px-2 py-1 text-sm text-luxe-text hover:text-luxe-gold transition-colors border border-white/20 rounded"
            >
              {language === "zh-TW" ? "EN" : "中"}
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="xl:hidden text-luxe-text hover:text-luxe-gold transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="text-xs sm:text-sm tracking-widest border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2">
            {mobileMenuOpen ? "CLOSE" : "MENU"}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-4 sm:mt-6 py-4 sm:py-6 border-t border-white/10 bg-luxe-bg/95 backdrop-blur-md rounded-lg -mx-2 px-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base sm:text-lg tracking-wider transition-colors py-1 ${
                  location.pathname === link.path
                    ? "text-luxe-gold"
                    : "text-luxe-text hover:text-luxe-gold"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile Theme & Language Toggle */}
            <div className="flex items-center gap-4 py-2 border-t border-white/10 mt-2 pt-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2 text-luxe-text hover:text-luxe-gold"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-sm">搜尋</span>
              </button>
              <button
                onClick={toggleColorMode}
                className="flex items-center gap-2 text-luxe-text hover:text-luxe-gold"
              >
                {!themeReady ? (
                  // SSR fallback
                  <>
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
                    <span className="text-sm">{t.theme.dark}</span>
                  </>
                ) : isDark ? (
                  <>
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
                    <span className="text-sm">{t.theme.light}</span>
                  </>
                ) : (
                  <>
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
                    <span className="text-sm">{t.theme.dark}</span>
                  </>
                )}
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1 text-sm text-luxe-text hover:text-luxe-gold border border-white/20 rounded"
              >
                {language === "zh-TW" ? "English" : "中文"}
              </button>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-white/10 flex flex-col gap-3 sm:gap-4">
              {mounted && user ? (
                <>
                  <Link
                    to="/member"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base sm:text-lg tracking-wider text-luxe-text hover:text-luxe-gold py-1"
                  >
                    {t.nav.memberCenter}
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base sm:text-lg tracking-wider text-luxe-gold py-1"
                    >
                      {t.nav.admin}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-base sm:text-lg tracking-wider text-left text-red-400 py-1"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base sm:text-lg tracking-wider text-luxe-text hover:text-luxe-gold py-1"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base sm:text-lg tracking-wider text-luxe-gold py-1"
                  >
                    {t.nav.register}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 全域搜尋 Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;
