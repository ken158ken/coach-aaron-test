/**
 * 路由守衛元件 - 認證 & 管理員權限
 * @module components/auth/RequireAuth
 *
 * 在 auth 載入完成前顯示 loading 畫面，
 * 確認後再決定渲染子元件或重導向。
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/ui/feedback/Loading";

/**
 * AuthLoadingScreen - 全域認證載入畫面
 *
 * @returns {JSX.Element} 載入畫面
 */
const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-luxe-bg flex flex-col items-center justify-center gap-4">
    <Loading size="lg" theme="luxe" text="驗證身份中..." />
  </div>
);

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * RequireAuth - 要求登入的路由守衛
 *
 * 使用方式：
 * ```tsx
 * <Route path="/member" element={<RequireAuth><MemberCenter /></RequireAuth>} />
 * ```
 *
 * @param {RequireAuthProps} props - 元件屬性
 * @returns {JSX.Element} 子元件或重導向
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  // auth 尚未就緒 → 顯示 loading
  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  // 未登入 → 重導向至登入頁，保留來源路徑（字串，與 auth:unauthorized handler 一致）
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

interface RequireAdminProps {
  children: React.ReactNode;
}

/**
 * RequireAdmin - 要求管理員權限的路由守衛
 *
 * 使用方式：
 * ```tsx
 * <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>} />
 * ```
 *
 * @param {RequireAdminProps} props - 元件屬性
 * @returns {JSX.Element} 子元件或重導向
 */
export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, user, authReady } = useAuth();
  const location = useLocation();

  // auth 尚未就緒 → 顯示 loading
  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  // 未登入 → 重導向至登入頁（字串，與 auth:unauthorized handler 一致）
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 已登入但非管理員 → 重導向至首頁
  if (!isAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
