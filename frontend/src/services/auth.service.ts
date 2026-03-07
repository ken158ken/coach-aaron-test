/**
 * 認證服務
 * @module services/auth.service
 */

import { post, get } from "./api";
import type { LoginFormData, RegisterFormData, AuthResponse } from "@/types";

/**
 * 認證服務物件
 */
export const authService = {
  /**
   * 登入
   *
   * @param {LoginFormData} data - 登入資料
   * @returns {Promise<AuthResponse>} 認證回應
   */
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    return post<AuthResponse>("/api/auth/login", data);
  },

  /**
   * 註冊
   *
   * @param {RegisterFormData} data - 註冊資料
   * @returns {Promise<AuthResponse>} 認證回應
   */
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    return post<AuthResponse>("/api/auth/register", data);
  },

  /**
   * 登出
   *
   * @returns {Promise<void>}
   */
  logout: async (): Promise<void> => {
    return post("/api/auth/logout");
  },

  /**
   * 檢查認證狀態
   *
   * @returns {Promise<AuthResponse>} 認證回應
   */
  checkAuth: async (): Promise<AuthResponse> => {
    return get<AuthResponse>("/api/auth/me");
  },

  /**
   * OAuth Token Exchange - 交換臨時 token 為 auth cookie
   *
   * @param {string} token - OAuth 回呼產生的短效 JWT
   * @returns {Promise<AuthResponse>} 認證回應
   */
  exchangeOAuthToken: async (token: string): Promise<AuthResponse> => {
    return post<AuthResponse>("/api/auth/oauth-exchange", { token });
  },
};

export default authService;
