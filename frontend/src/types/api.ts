/**
 * API 相關類型定義
 * @module types/api
 */

/** API 成功回應 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

/** API 錯誤回應 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  message?: string;
  details?: unknown;
}

/** API 回應（統一格式） */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** 分頁參數 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/** 分頁回應 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
