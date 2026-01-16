/**
 * API Service Layer - 型別安全的 HTTP 客戶端
 * @module services/api
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "@/types";

/**
 * API 客戶端實例
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 秒超時
});

/**
 * 請求攔截器
 */
apiClient.interceptors.request.use(
  (config) => {
    // 可以在這裡添加 token 等
    return config;
  },
  (error: AxiosError) => {
    console.error("請求錯誤:", error);
    return Promise.reject(error);
  }
);

/**
 * 回應攔截器
 */
apiClient.interceptors.response.use(
  (response) => response.data, // 直接返回 data
  (error: AxiosError<ApiErrorResponse>) => {
    // 統一錯誤處理
    if (error.response?.status === 401) {
      // 未登入或 Token 過期
      // SSR 保護：只在客戶端執行重新導向
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const errorMessage =
      error.response?.data?.error || error.message || "請求失敗";

    console.error("API 錯誤:", {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);

/**
 * GET 請求
 */
export const get = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return apiClient.get<T, T>(url, config);
};

/**
 * POST 請求
 */
export const post = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  return apiClient.post<T, T, D>(url, data, config);
};

/**
 * PUT 請求
 */
export const put = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  return apiClient.put<T, T, D>(url, data, config);
};

/**
 * DELETE 請求
 */
export const del = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return apiClient.delete<T, T>(url, config);
};

/**
 * PATCH 請求
 */
export const patch = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  return apiClient.patch<T, T, D>(url, data, config);
};

export default apiClient;
