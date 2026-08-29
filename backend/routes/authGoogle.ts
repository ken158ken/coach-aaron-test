/**
 * Google OAuth 路由
 *
 * 處理 Google 社交登入流程：
 * 1. GET /api/auth/google — 產生 Google 授權 URL 並重導向
 * 2. GET /api/auth/google/callback — 處理 Google 回呼
 * 3. POST /api/auth/google/bind — 已登入使用者綁定 Google 帳號
 *
 * @module routes/authGoogle
 */

import express, { Request, Response, Router } from "express";
import { getGoogleOAuthConfig, getFrontendUrl } from "../config/oauth.js";
import { authenticateToken } from "../middleware/auth.js";
import { oauthLimiter } from "../middleware/rateLimiter.js";
import {
  handleSocialLogin,
  upsertSocialAccount,
  updateAuthProvider,
  SocialProfile,
} from "../utils/oauth.js";
import { logger } from "../utils/logger.js";

const router: Router = express.Router();

/**
 * Google OAuth Token 回應介面
 */
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Google 使用者資料介面
 */
interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
  hd?: string;
}

/**
 * 產生 Google 授權 URL
 *
 * @param state - CSRF 防護用的隨機字串
 * @returns Google OAuth 授權 URL
 */
function buildGoogleAuthUrl(state: string): string {
  const config = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * 使用授權碼交換 Token
 *
 * @param code - Google 授權碼
 * @returns Token 回應
 */
async function exchangeCodeForToken(
  code: string,
): Promise<GoogleTokenResponse> {
  const config = getGoogleOAuthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Token 交換失敗: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

/**
 * 使用 Access Token 取得使用者資料
 *
 * @param accessToken - Google Access Token
 * @returns 使用者資料
 */
async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw new Error(`取得 Google 使用者資料失敗: ${response.status}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

/**
 * 將 Google 使用者資料轉換為統一的 SocialProfile 格式
 *
 * @param userInfo - Google 使用者資料
 * @param tokens - Google Token
 * @returns SocialProfile
 */
function mapToSocialProfile(
  userInfo: GoogleUserInfo,
  tokens: GoogleTokenResponse,
): SocialProfile {
  return {
    provider: "google",
    providerUserId: userInfo.sub,
    email: userInfo.email,
    displayName: userInfo.name,
    avatarUrl: userInfo.picture,
    googleGivenName: userInfo.given_name,
    googleFamilyName: userInfo.family_name,
    googleLocale: userInfo.locale,
    googleEmailVerified: userInfo.email_verified,
    googleHd: userInfo.hd,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString(),
    idToken: tokens.id_token,
    rawProfile: userInfo as unknown as Record<string, unknown>,
  };
}

// ============================================================
// 路由定義
// ============================================================

/**
 * 發起 Google 登入
 * @route GET /api/auth/google
 *
 * 產生 state 並重導向至 Google 授權頁面
 */
router.get("/", oauthLimiter, (req: Request, res: Response): void => {
  try {
    const config = getGoogleOAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      res.status(503).json({ error: "Google OAuth 未設定" });
      return;
    }

    // 產生 state 用於 CSRF 防護
    const state = Buffer.from(
      JSON.stringify({
        random: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
      }),
    ).toString("base64url");

    // 將 state 存入 cookie 供 callback 驗證
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 分鐘
      path: "/",
    });

    const authUrl = buildGoogleAuthUrl(state);
    logger.info("Google OAuth 重導向", { redirectUri: config.redirectUri });
    res.redirect(authUrl);
  } catch (err) {
    logger.error("Google OAuth 發起失敗", err as Error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

/**
 * Google OAuth 回呼
 * @route GET /api/auth/google/callback
 *
 * 處理 Google 回呼：交換 Token → 取得使用者資料 → 登入/建立帳號
 */
router.get("/callback", async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = getFrontendUrl();

  try {
    const { code, state, error: oauthError } = req.query;

    // 處理 Google 回傳的錯誤
    if (oauthError) {
      logger.warn("Google OAuth 使用者拒絕授權", { error: oauthError });
      res.redirect(`${frontendUrl}/login?error=access_denied`);
      return;
    }

    if (!code || typeof code !== "string") {
      logger.warn("Google OAuth callback 缺少 code");
      res.redirect(`${frontendUrl}/login?error=no_code`);
      return;
    }

    // 驗證 state（CSRF 防護）
    const storedState = req.cookies.oauth_state;
    if (!state || state !== storedState) {
      logger.warn("Google OAuth state 不匹配", {
        hasState: !!state,
        hasStoredState: !!storedState,
      });
      res.redirect(`${frontendUrl}/login?error=invalid_state`);
      return;
    }

    // 清除 state cookie
    res.clearCookie("oauth_state", { path: "/" });

    // Step 1: 交換 Token
    const tokens = await exchangeCodeForToken(code);

    // Step 2: 取得使用者資料
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    if (!userInfo.sub) {
      logger.error("Google 使用者資料缺少 sub ID");
      res.redirect(`${frontendUrl}/login?error=invalid_profile`);
      return;
    }

    // Step 3: 轉換為統一格式並處理登入
    const profile = mapToSocialProfile(userInfo, tokens);
    await handleSocialLogin(res, profile, frontendUrl);
  } catch (err) {
    logger.error("Google OAuth callback 失敗", err as Error);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
});

/**
 * 已登入使用者綁定 Google 帳號
 * @route POST /api/auth/google/bind
 *
 * 使用者已登入後，將 Google 帳號綁定至現有帳號。
 * 前端需先完成 Google 授權流程並取得 access_token。
 */
router.post(
  "/bind",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken: googleAccessToken } = req.body;
      const userId = req.user?.userId;

      if (!googleAccessToken) {
        res.status(400).json({ error: "請提供 Google Access Token" });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "未登入" });
        return;
      }

      // 取得 Google 使用者資料
      const userInfo = await fetchGoogleUserInfo(googleAccessToken);

      if (!userInfo.sub) {
        res.status(400).json({ error: "無法取得 Google 帳號資訊" });
        return;
      }

      const profile: SocialProfile = {
        provider: "google",
        providerUserId: userInfo.sub,
        email: userInfo.email,
        displayName: userInfo.name,
        avatarUrl: userInfo.picture,
        googleGivenName: userInfo.given_name,
        googleFamilyName: userInfo.family_name,
        googleLocale: userInfo.locale,
        googleEmailVerified: userInfo.email_verified,
        googleHd: userInfo.hd,
        accessToken: googleAccessToken,
        rawProfile: userInfo as unknown as Record<string, unknown>,
      };

      // 綁定社交帳號
      await upsertSocialAccount(Number(userId), profile);
      await updateAuthProvider(Number(userId), "google");

      logger.info("Google 帳號綁定成功", {
        userId,
        googleSub: userInfo.sub,
        googleEmail: userInfo.email,
      });

      res.json({
        success: true,
        message: "Google 帳號綁定成功",
        google: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      });
    } catch (err) {
      logger.error("Google 帳號綁定失敗", err as Error, {
        userId: req.user?.userId,
      });
      res.status(500).json({ error: "綁定失敗" });
    }
  },
);

export default router;
