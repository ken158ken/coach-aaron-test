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
  },
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
        // 清除可能存在的過期 cookie（前端無法操作 httpOnly，只記錄狀態）
        const currentPath = window.location.pathname;

        // 避免在登入頁面重複導向
        if (!currentPath.includes("/login")) {
          // 儲存當前路徑以便登入後返回
          sessionStorage.setItem("redirectAfterLogin", currentPath);

          // 給使用者一個提示
          if (confirm("登入已過期，是否重新登入？")) {
            window.location.href = "/login";
          } else {
            // 使用者選擇不登入，導向首頁
            window.location.href = "/";
          }
        }
      }
    } else if (error.response?.status === 403) {
      // 權限不足
      console.error("權限不足：", error.response.data?.error);
    } else if (error.response?.status === 429) {
      // Rate limit 超過
      const retryAfter = error.response.headers["retry-after"];
      console.warn(`請求次數過多，請 ${retryAfter} 秒後再試`);
    }

    const errorMessage =
      error.response?.data?.error || error.message || "請求失敗";

    console.error("API 錯誤:", {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
      method: error.config?.method,
    });

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

/**
 * PATCH 請求
 */
export const patch = <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.patch<T, T, D>(url, data, config);
};

export default apiClient;
