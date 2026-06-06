/**
 * 使用者相關類型定義
 * @module types/user
 */

/** 性別類型 */
export type Gender = "male" | "female" | "other";

/** 使用者角色 */
export type UserRole = "user" | "admin";

/** 使用者資料 */
export interface User {
  // 資料庫欄位 (snake_case)
  user_id: number;
  name: string;
  display_name?: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  gender?: Gender;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  // 前端別名 (方便使用)
  id?: number;
  role?: UserRole;
  isAdmin?: boolean;
  createdAt?: string;
}

/** 註冊表單資料 */
export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  phoneNumber?: string;
  gender?: Gender;
}

/** 登入表單資料 */
export interface LoginFormData {
  email: string;
  password: string;
}

/** 認證上下文 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  /** auth 已就緒：mounted 且 loading 結束，可安全做 auth 判斷 */
  authReady: boolean;
  mounted: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    data: RegisterFormData,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  /** OAuth 登入成功後直接設定 auth state（不需額外 API 呼叫） */
  loginFromOAuth: (response: AuthResponse) => void;
  /** 局部更新 user state（如頭像上傳後） */
  updateUser: (partial: Partial<User>) => void;
}

/** 認證回應 */
export interface AuthResponse {
  user: User;
  isAdmin: boolean;
  token?: string;
}
