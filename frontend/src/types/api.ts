/**
 * API 相關類型定義
 * @module types/api
 */

/** API 錯誤回應 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

/** 分頁回應 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** 通用 API 回應 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
