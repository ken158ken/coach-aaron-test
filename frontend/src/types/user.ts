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
  user_id: number;
  name: string;
  email: string;
  phone_number?: string;
  gender?: Gender;
  created_at: string;
  updated_at: string;
}

/** 註冊表單資料 */
export interface RegisterFormData {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  confirmPassword: string;
  gender: Gender;
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
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
