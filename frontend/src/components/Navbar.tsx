/**
 * 導航列元件
 * @module components/Navbar
 */

import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface NavLink {
  name: string;
  path: string;
}

const Navbar: React.FC = () => {
  const { user, logout, mounted } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Only run GSAP on client side
    if (typeof window !== "undefined" && navRef.current) {
      import("gsap").then(({ default: gsap }) => {
        gsap.fromTo(
          navRef.current,
          { y: -100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
      });
    }
  }, []);

  // 基本導航連結
  const baseNavLinks: NavLink[] = [
    { name: "教練介紹", path: "/" },
    { name: "線上課程", path: "/courses" },
    { name: "短影音", path: "/videos" },
    { name: "聯絡我", path: "/contact" },
  ];

  // 根據 user.sex 決定是否顯示私密相簿
  const navLinks: NavLink[] = user?.sex
    ? [
        ...baseNavLinks.slice(0, 1),
        { name: "阿倫私密淫照", path: "/photos" },
        ...baseNavLinks.slice(1),
      ]
    : baseNavLinks;

  return (
    <div
      ref={navRef}
      className="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 border-b border-base-200 shadow-sm text-base-content"
    >
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.path}>{link.name}</Link>
              </li>
            ))}
            {mounted && user && (
              <>
                <li>
                  <Link to="/member">會員中心</Link>
                </li>
                {user.isAdmin && (
                  <li>
                    <Link to="/admin">後台管理</Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
        <Link
          to="/"
          className="btn btn-ghost normal-case text-xl font-bold tracking-tight"
        >
          阿倫<span className="text-primary">教官</span>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`font-medium hover:text-primary transition-colors ${
                  location.pathname === link.path ? "text-primary" : ""
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end gap-2">
        {mounted && user ? (
          <>
            <Link to="/member" className="btn btn-sm btn-ghost">
              會員中心
            </Link>
            {user.isAdmin && (
              <Link to="/admin" className="btn btn-sm btn-secondary">
                後台管理
              </Link>
            )}
            <button
              onClick={logout}
              className="btn btn-sm btn-outline btn-error"
            >
              登出
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-sm btn-ghost">
              登入
            </Link>
            <Link to="/register" className="btn btn-sm btn-primary">
              註冊
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
