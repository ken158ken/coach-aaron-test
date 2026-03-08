/**
 * OAuth 配置
 *
 * 集中管理 Google 與 LINE OAuth 的環境變數與設定。
 *
 * @module config/oauth
 */

import { logger } from "../utils/logger.js";

/**
 * Google OAuth 配置介面
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * LINE Login 配置介面
 */
export interface LineLoginConfig {
  channelId: string;
  channelSecret: string;
  redirectUri: string;
}

/**
 * 取得 Google OAuth 配置
 *
 * @returns Google OAuth 配置物件
 * @throws 缺少必要環境變數時記錄警告
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const baseUrl =
    process.env.OAUTH_CALLBACK_BASE_URL || "http://localhost:5000";
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    logger.warn("Google OAuth 環境變數未設定", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * 取得 LINE Login 配置
 *
 * @returns LINE Login 配置物件
 * @throws 缺少必要環境變數時記錄警告
 */
export function getLineLoginConfig(): LineLoginConfig {
  const channelId = process.env.LINE_CHANNEL_ID || "";
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
  const baseUrl =
    process.env.OAUTH_CALLBACK_BASE_URL || "http://localhost:5000";
  const redirectUri = `${baseUrl}/api/auth/line/callback`;

  if (!channelId || !channelSecret) {
    logger.warn("LINE Login 環境變數未設定", {
      hasChannelId: !!channelId,
      hasChannelSecret: !!channelSecret,
    });
  }

  return { channelId, channelSecret, redirectUri };
}

/**
 * Facebook OAuth 配置介面
 */
export interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

/**
 * 取得 Facebook OAuth 配置
 *
 * @returns Facebook OAuth 配置物件
 */
export function getFacebookOAuthConfig(): FacebookOAuthConfig {
  const appId = process.env.FACEBOOK_APP_ID || "";
  const appSecret = process.env.FACEBOOK_APP_SECRET || "";
  const baseUrl =
    process.env.OAUTH_CALLBACK_BASE_URL || "http://localhost:5000";
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

  if (!appId || !appSecret) {
    logger.warn("Facebook OAuth 環境變數未設定", {
      hasAppId: !!appId,
      hasAppSecret: !!appSecret,
    });
  }

  return { appId, appSecret, redirectUri };
}

/**
 * 取得前端重導向 URL
 *
 * @returns 前端首頁 URL
 */
export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

/**
 * 檢查 OAuth 是否已設定
 *
 * @returns 各提供者的啟用狀態
 */
export function getOAuthStatus(): {
  google: boolean;
  line: boolean;
  facebook: boolean;
} {
  return {
    google: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    line: !!(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET),
    facebook: !!(
      process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
    ),
  };
}
