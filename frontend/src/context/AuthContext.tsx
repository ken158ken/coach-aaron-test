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
import { setAuthToken } from "@/services/api";

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * 將後端 auth 回傳的 camelCase 用戶物件正規化為 User 型別（snake_case）
 *
 * 後端 /api/auth/me、login、register 回傳的 user 使用 camelCase（displayName、userId…），
 * 但前端 User 型別和所有元件使用 snake_case（display_name、user_id…）。
 *
 * @param {Record<string, unknown>} raw - 後端原始 user 物件
 * @returns {User} 正規化的 User 物件
 */
const normalizeUser = (raw: Record<string, unknown>): User => {
  return {
    // 主鍵
    user_id: (raw.user_id ?? raw.userId ?? 0) as number,
    id: (raw.id ?? raw.userId ?? raw.user_id ?? 0) as number,
    // 名稱
    name: (raw.name ?? raw.username ?? raw.displayName ?? "") as string,
    display_name: (raw.display_name ??
      raw.displayName ??
      raw.name ??
      raw.username ??
      "") as string,
    // 聯絡
    email: (raw.email ?? "") as string,
    phone_number: (raw.phone_number ?? raw.phoneNumber ?? undefined) as
      | string
      | undefined,
    // 頭像
    avatar_url: (raw.avatar_url ?? raw.avatarUrl ?? undefined) as
      | string
      | undefined,
    // 狀態
    is_active: (raw.is_active ?? true) as boolean,
    isAdmin: (raw.isAdmin ?? false) as boolean,
    // 時間
    created_at: (raw.created_at ?? raw.createdAt ?? "") as string,
    updated_at: (raw.updated_at ?? raw.updatedAt ?? "") as string,
    createdAt: (raw.createdAt ?? raw.created_at ?? "") as string,
  };
};

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
      setUser(
        normalizeUser(response.user as unknown as Record<string, unknown>),
      );
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
   * 注意：當 URL 帶有 auth_code（OAuth 回呼），跳過初始 checkAuth，
   * 由 Login 頁面的 OAuth 流程自行處理認證。
   */
  useEffect(() => {
    if (isHydrated) {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.has("auth_code")) {
          setLoading(false);
          return;
        }
      } catch {
        // SSR 環境
      }
      checkAuth();
    }
  }, [isHydrated, checkAuth]);

  /**
   * 登入
   *
   * @param {string} email - 電子郵件
   * @param {string} password - 密碼
   */
  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(normalizeUser(response.user as unknown as Record<string, unknown>));
    setIsAdmin(response.isAdmin ?? false);
  }, []);

  /**
   * 註冊
   *
   * @param {RegisterFormData} data - 註冊資料
   */
  const register = useCallback(async (data: RegisterFormData) => {
    try {
      const response = await authService.register(data);
      setUser(
        normalizeUser(response.user as unknown as Record<string, unknown>),
      );
      setIsAdmin(response.isAdmin ?? false);
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
      setAuthToken(null);
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  /**
   * 局部更新 user state（不重新呼叫 API）
   *
   * @param {Partial<User>} partial - 要更新的欄位
   */
  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  /**
   * OAuth 登入 — 直接用 exchange 回應設定 auth state
   * 避免再呼叫 checkAuth 造成 race condition
   */
  const loginFromOAuth = useCallback(
    (response: { user: unknown; isAdmin: boolean }) => {
      setUser(normalizeUser(response.user as Record<string, unknown>));
      setIsAdmin(response.isAdmin);
      setLoading(false);
    },
    [],
  );

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
    loginFromOAuth,
    updateUser,
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
