/**
 * 認證上下文 - 管理全域認證狀態
 * @module context/AuthContext
 */

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import type { User, AuthContextType, RegisterFormData } from "@/types";
import { authService } from "@/services";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider 元件
 *
 * @param {AuthProviderProps} props - 元件屬性
 * @returns {JSX.Element} Provider 元件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  /** auth 已就緒：mounted 且 loading 結束，可安全做 auth 判斷 */
  const authReady = mounted && !loading;

  /**
   * 檢查認證狀態 - 只在客戶端執行
   * 注意：401 是正常的未登入狀態，不應視為錯誤
   */
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.checkAuth();
      setUser(response.user);
      setIsAdmin(response.isAdmin);
    } catch (error: unknown) {
      // 401 是正常的未登入狀態，靜默處理
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status !== 401) {
        console.error("認證檢查失敗:", error);
      }
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Hydration 完成標記 - 使用 setTimeout 確保在 Hydration 完成後才執行
   * 重要：50ms 延遲是為了避免 React Hydration 錯誤 #418/#423
   */
  useEffect(() => {
    setMounted(true);
    // 使用 setTimeout 確保在 Hydration 完成後才執行
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  /**
   * 初始化認證狀態 - 在 hydration 後執行
   */
  useEffect(() => {
    if (isHydrated) {
      checkAuth();
    }
  }, [isHydrated, checkAuth]);

  /**
   * 登入
   *
   * @param {string} email - 電子郵件
   * @param {string} password - 密碼
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authService.login({ email, password });
        setUser(response.user);
        await checkAuth();
        return { success: true };
      } catch (error) {
        console.error("登入失敗:", error);
        return { success: false, message: "登入失敗" };
      }
    },
    [checkAuth],
  );

  /**
   * 註冊
   *
   * @param {RegisterFormData} data - 註冊資料
   */
  const register = useCallback(async (data: RegisterFormData) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      console.error("註冊失敗:", error);
      return { success: false, message: "註冊失敗" };
    }
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("登出失敗:", error);
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin,
    loading,
    authReady,
    mounted,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 使用認證上下文的 Hook
 *
 * @returns {AuthContextType} 認證上下文
 * @throws {Error} 當在 AuthProvider 外使用時
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
