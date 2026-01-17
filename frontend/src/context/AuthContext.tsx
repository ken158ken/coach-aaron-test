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
import { authService } from "@/services";
import type {
  User,
  AuthContextType,
  LoginFormData,
  RegisterFormData,
} from "@/types";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider 元件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // SSR 和 Client 初始狀態必須相同，避免 hydration mismatch
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * 檢查認證狀態
   */
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.checkAuth();
      setUser(response.user);
      setIsAdmin(response.isAdmin);
    } catch (error) {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 初始化認證狀態
   * 只在客戶端執行（useEffect 自動跳過 SSR）
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * 登入
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const response = await authService.login({ email, password });
        setUser(response.user);
        await checkAuth(); // 重新檢查以獲取 isAdmin 狀態
      } catch (error) {
        console.error("登入失敗:", error);
        throw error;
      }
    },
    [checkAuth],
  );

  /**
   * 註冊
   */
  const register = useCallback(
    async (data: RegisterFormData): Promise<void> => {
      try {
        // 移除 confirmPassword（後端不需要）
        const { confirmPassword, ...registerData } = data;
        const response = await authService.register(registerData);
        setUser(response.user);
        await checkAuth(); // 重新檢查以獲取 isAdmin 狀態
      } catch (error) {
        console.error("註冊失敗:", error);
        throw error;
      }
    },
    [checkAuth],
  );

  /**
   * 登出
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("登出失敗:", error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook - 獲取認證上下文
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export default AuthContext;
