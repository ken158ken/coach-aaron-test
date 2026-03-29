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
import { useNavigate } from "react-router-dom";
import type { User, AuthContextType, RegisterFormData } from "@/types";
import { authService } from "@/services";
import { setAuthToken } from "@/services/api";
import { getPreloadedAuth } from "@/lib/auth-init";

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
export const normalizeUser = (raw: Record<string, unknown>): User => {
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
 * 初始化策略：
 *   - 客戶端：entry-client.tsx 的 bootstrap() 在渲染前執行 initAuth()，
 *     auth-init 模組已持有預載結果，這裡直接用同步 lazy initializer 取得，
 *     loading 從一開始就是 false，消除「先無登入→後有登入」的畫面閃爍。
 *   - SSR：getPreloadedAuth() 回傳 null（initAuth 從未執行），
 *     loading 初始為 true，authReady = false，protected routes 顯示 loading 畫面。
 *
 * @param {AuthProviderProps} props - 元件屬性
 * @returns {JSX.Element} Provider 元件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  // ─── 從預載結果同步初始化（lazy initializer 只在首次 render 執行一次）───
  const [user, setUser] = useState<User | null>(() => {
    const preloaded = getPreloadedAuth();
    if (preloaded?.response) {
      return normalizeUser(
        preloaded.response.user as unknown as Record<string, unknown>,
      );
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const preloaded = getPreloadedAuth();
    return preloaded?.response?.isAdmin ?? false;
  });

  /**
   * loading：
   *   - null（SSR）→ initAuth 未執行 → true（等待客戶端 checkAuth）
   *   - 物件（客戶端）→ initAuth 完成 → false（已有資料）
   */
  const [loading, setLoading] = useState<boolean>(() => {
    return getPreloadedAuth() === null;
  });

  /**
   * mounted：SSR 安全旗標，由 useEffect 設為 true。
   * 供 Navbar 等元件判斷是否在瀏覽器環境，防止 hydration mismatch。
   * 不再參與 authReady 計算。
   */
  const [mounted, setMounted] = useState(false);

  /**
   * authReady：loading 結束即就緒。
   * 客戶端（預載完成）：初始即 true，protected routes 直接渲染正確畫面。
   * SSR：loading=true → false，protected routes 先顯示 loading 畫面。
   */
  const authReady = !loading;

  /**
   * 檢查認證狀態（手動呼叫用，例如 session 更新後）
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

  /** 設定 mounted 旗標（SSR 安全，useEffect 只在瀏覽器執行） */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * SSR fallback：若 initAuth() 未執行（不預期情況），在客戶端 mount 後補跑 checkAuth。
   * 正常流程（有 bootstrap）時 loading 已是 false，此 effect 不會觸發。
   */
  useEffect(() => {
    if (loading) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("auth_code")) {
        setLoading(false);
        return;
      }
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在 mount 時執行一次，不追蹤 loading/checkAuth 以避免迴圈

  /**
   * 監聽 API 層廣播的 auth:unauthorized 事件
   * 當後端回傳 401（token 過期或無效），自動清除登入狀態並導向登入頁
   * 使用 React Router navigate 避免 full page reload，保留 _authToken 繼承
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthToken(null);
      setUser(null);
      setIsAdmin(false);
      try {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/login")) {
          navigate("/login", {
            state: { expired: true, from: currentPath },
            replace: true,
          });
        }
      } catch {
        // SSR 環境，略過
      }
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  /**
   * 登入
   *
   * @param {string} email - 電子郵件
   * @param {string} password - 密碼
   */
  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const normalized = normalizeUser(
      response.user as unknown as Record<string, unknown>,
    );
    setUser(normalized);
    setIsAdmin(response.isAdmin ?? normalized.isAdmin ?? false);
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
