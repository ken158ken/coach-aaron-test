/**
 * API Service Layer - 型別安全的 HTTP 客戶端
 * @module services/api
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "@/types";

/**
 * 記憶體 Token 管理
 * 用於 Authorization: Bearer header（繞過 Vercel cookie 問題）
 */
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

/**
 * 取得 API baseURL
 *
 * - 有明確設定 VITE_API_URL → 使用它
 * - Production 環境 → "" (same-origin，透過 Vercel rewrites)
 * - 開發環境 → http://localhost:5000
 */
const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return "";
  return "http://localhost:5000";
};

/**
 * API 客戶端實例
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * 請求攔截器 — 附加 Authorization header
 */
apiClient.interceptors.request.use(
  (config) => {
    if (_authToken) {
      config.headers.Authorization = `Bearer ${_authToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error("請求錯誤:", error);
    return Promise.reject(error);
  },
);

/**
 * 回應攔截器
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiErrorResponse>) => {
    // 401 未登入狀態在某些情況下是正常的（例如 /api/auth/me 檢查）
    const isAuthCheck = error.config?.url?.includes("/auth/me");

    if (error.response?.status === 401 && !isAuthCheck) {
      try {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/login")) {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
          console.log("登入已過期");
        }
      } catch {
        // SSR 環境
      }
    }

    const errorMessage =
      error.response?.data?.error || error.message || "請求失敗";

    // 只在非 401 auth check 時輸出錯誤
    if (!(error.response?.status === 401 && isAuthCheck)) {
      console.error("API 錯誤:", {
        status: error.response?.status,
        message: errorMessage,
        url: error.config?.url,
      });
    }

    return Promise.reject(error);
  },
);

/**
 * GET 請求
 */
export const get = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.get<T, T>(url, config);
};

/**
 * POST 請求
 */
export const post = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.post<T, T, D>(url, data, config);
};

/**
 * PUT 請求
 */
export const put = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.put<T, T, D>(url, data, config);
};

/**
 * DELETE 請求
 */
export const del = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.delete<T, T>(url, config);
};

export default apiClient;
