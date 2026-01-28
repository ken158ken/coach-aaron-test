/**
 * 導航列元件 - LUXE 風格
 * @module components/layout/Navbar
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { name: "教練介紹", path: "/" },
    { name: "線上課程", path: "/courses" },
    { name: "短影音", path: "/videos" },
    { name: "專業知識", path: "/articles" },
    { name: "聯絡我", path: "/contact" },
  ];

  // 根據用戶權限決定導航連結
  const navLinks: NavLink[] =
    mounted && user?.sex
      ? [
          ...baseNavLinks.slice(0, 1),
          { name: "阿倫私密淫照", path: "/photos" },
          ...baseNavLinks.slice(1),
        ]
      : baseNavLinks;

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-16 py-6"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.9), transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl tracking-widest font-display hover:scale-105 transition-transform duration-300"
          style={{ color: "var(--luxe-gold)" }}
        >
          阿倫教官
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative text-base tracking-wider transition-all duration-300 hover:text-luxe-gold group ${
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
              className="text-base tracking-wider px-5 py-2 border border-white/20 hover:border-luxe-gold hover:text-luxe-gold hover:scale-105 transition-all duration-300"
            >
              登入
            </Link>
          ) : user ? (
            <div className="flex items-center gap-6">
              <Link
                to="/member"
                className="relative text-base tracking-wider text-luxe-text hover:text-luxe-gold transition-all duration-300 group"
              >
                會員中心
                <span className="absolute -bottom-1 left-0 h-0.5 bg-luxe-gold transition-all duration-300 w-0 group-hover:w-full" />
              </Link>
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className="text-base tracking-wider text-luxe-gold hover:scale-105 transition-transform duration-300"
                >
                  後台
                </Link>
              )}
              <button
                onClick={logout}
                className="text-base tracking-wider px-5 py-2 border border-white/20 hover:border-red-500 hover:text-red-500 hover:scale-105 transition-all duration-300"
              >
                登出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                to="/login"
                className="relative text-base tracking-wider text-luxe-text hover:text-luxe-gold transition-all duration-300 group"
              >
                登入
                <span className="absolute -bottom-1 left-0 h-0.5 bg-luxe-gold transition-all duration-300 w-0 group-hover:w-full" />
              </Link>
              <Link
                to="/register"
                className="text-base tracking-wider px-5 py-2 border border-luxe-gold text-luxe-gold hover:bg-luxe-gold hover:text-luxe-black hover:scale-105 transition-all duration-300"
              >
                註冊
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-luxe-text hover:text-luxe-gold transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="text-sm tracking-widest border border-white/20 px-4 py-2">
            {mobileMenuOpen ? "CLOSE" : "MENU"}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-6 py-6 border-t border-white/10 bg-luxe-bg/95 backdrop-blur-md rounded-lg -mx-2 px-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg tracking-wider transition-colors ${
                  location.pathname === link.path
                    ? "text-luxe-gold"
                    : "text-luxe-text hover:text-luxe-gold"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
              {mounted && user ? (
                <>
                  <Link
                    to="/member"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg tracking-wider text-luxe-text hover:text-luxe-gold"
                  >
                    會員中心
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg tracking-wider text-luxe-gold"
                    >
                      後台管理
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-lg tracking-wider text-left text-red-400"
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg tracking-wider text-luxe-text hover:text-luxe-gold"
                  >
                    登入
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg tracking-wider text-luxe-gold"
                  >
                    註冊
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
