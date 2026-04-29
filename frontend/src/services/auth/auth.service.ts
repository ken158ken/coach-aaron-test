/**
 * 認證服務
 * @module services/auth.service
 */

import { post, get, setAuthToken } from "../api";
import type { LoginFormData, RegisterFormData, AuthResponse } from "@/types";

/**
 * 認證回應 + token（後端回傳 token in body）
 */
interface AuthResponseWithToken extends AuthResponse {
  token?: string;
}

/**
 * 儲存 token 到記憶體（用於 Bearer header）
 */
function storeToken(response: AuthResponseWithToken): AuthResponse {
  if (response.token) {
    setAuthToken(response.token);
  }
  return response;
}

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
    const res = await post<AuthResponseWithToken>("/api/auth/login", data);
    return storeToken(res);
  },

  /**
   * 註冊
   *
   * @param {RegisterFormData} data - 註冊資料
   * @returns {Promise<AuthResponse>} 認證回應
   */
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const res = await post<AuthResponseWithToken>("/api/auth/register", data);
    return storeToken(res);
  },

  /**
   * 登出
   *
   * @returns {Promise<void>}
   */
  logout: async (): Promise<void> => {
    setAuthToken(null);
    return post("/api/auth/logout");
  },

  /**
   * 檢查認證狀態，並恢復記憶體 token（頁面重整後補回 Bearer token）
   *
   * @returns {Promise<AuthResponse>} 認證回應
   */
  checkAuth: async (): Promise<AuthResponse> => {
    const res = await get<AuthResponseWithToken>("/api/auth/me");
    return storeToken(res);
  },

  /**
   * OAuth Code Exchange - 交換 exchange token 為完整 auth token
   *
   * @param {string} code - OAuth 回呼的 exchange token
   * @returns {Promise<AuthResponse>} 認證回應
   */
  exchangeOAuthCode: async (code: string): Promise<AuthResponse> => {
    const res = await post<AuthResponseWithToken>("/api/auth/oauth-exchange", {
      code,
    });
    return storeToken(res);
  },
};

export default authService;
