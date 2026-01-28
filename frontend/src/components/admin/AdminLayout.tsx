/**
 * AdminLayout 元件 - 管理後台佈局
 * @module components/admin/AdminLayout
 */

import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context";
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
