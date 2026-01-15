/**
 * 認證服務 - 處理所有認證相關的 API 請求
 * @module services/auth
 */

import { get, post } from "./api";
import type { User, LoginFormData, RegisterFormData } from "@/types";

/**
 * 登入回應
 */
interface LoginResponse {
  user: User;
  message: string;
}

/**
 * 註冊回應
 */
interface RegisterResponse {
  user: User;
  message: string;
}

/**
 * 檢查認證狀態回應
 */
interface CheckAuthResponse {
  user: User;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * Auth Service
 */
export const authService = {
  /**
   * 登入
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    return post<LoginResponse, LoginFormData>("/api/auth/login", credentials);
  },

  /**
   * 註冊
   */
  async register(
    data: Omit<RegisterFormData, "confirmPassword">
  ): Promise<RegisterResponse> {
    return post<RegisterResponse>("/api/auth/register", data);
  },

  /**
   * 登出
   */
  async logout(): Promise<{ message: string }> {
    return post<{ message: string }>("/api/auth/logout");
  },

  /**
   * 檢查認證狀態
   */
  async checkAuth(): Promise<CheckAuthResponse> {
    return get<CheckAuthResponse>("/api/auth/me");
  },
};
