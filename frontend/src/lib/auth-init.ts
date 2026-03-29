/**
 * 認證預載入模組
 *
 * 在 React 渲染前完成 /api/auth/me 呼叫，
 * 讓 AuthContext 可用同步方式初始化 user / isAdmin / loading，
 * 消除「先無登入、後有登入」的畫面閃爍。
 *
 * @module lib/auth-init
 */

import type { AuthResponse } from "@/types";
import { authService } from "@/services";

export interface PreloadedAuth {
  /** null = 未登入（或 OAuth 回呼，由 Login 頁自行處理） */
  response: AuthResponse | null;
}

/** null = initAuth() 尚未執行（SSR 環境、或尚未 bootstrap） */
let _result: PreloadedAuth | null = null;

/**
 * 在 React hydration 前執行 auth 預載。
 * 只應在 entry-client.tsx 的 bootstrap() 裡呼叫一次。
 */
export async function initAuth(): Promise<void> {
  try {
    // OAuth 回呼：auth_code 由 Login 頁面的 exchangeOAuthCode 流程負責，
    // 這裡只標記「預載完成但未登入」，讓 loading 能正確設為 false
    const params = new URLSearchParams(window.location.search);
    if (params.has("auth_code")) {
      _result = { response: null };
      return;
    }

    const response = await authService.checkAuth();
    _result = { response };
  } catch {
    // 401 = 未登入，視為正常結果
    _result = { response: null };
  }
}

/**
 * 取得預載結果。
 * - 回傳 null  → initAuth() 尚未執行（SSR 環境）
 * - 回傳物件  → 預載完成，response 非 null 代表已登入
 */
export function getPreloadedAuth(): PreloadedAuth | null {
  return _result;
}
