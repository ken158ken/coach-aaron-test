/**
 * Facebook (Meta) OAuth 路由
 *
 * 處理 Facebook 社交登入流程：
 * 1. GET /api/auth/facebook — 產生 Facebook 授權 URL 並重導向
 * 2. GET /api/auth/facebook/callback — 處理 Facebook 回呼
 * 3. POST /api/auth/facebook/bind — 已登入使用者綁定 Facebook 帳號
 *
 * @module routes/authFacebook
 */

import express, { Request, Response, Router } from "express";
import { getFacebookOAuthConfig, getFrontendUrl } from "../config/oauth.js";
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
 * Facebook OAuth Token 回應介面
 */
interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Facebook 使用者資料介面
 */
interface FacebookUserInfo {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  picture?: {
    data: {
      url: string;
      is_silhouette: boolean;
    };
  };
  locale?: string;
  link?: string;
}

/**
 * 產生 Facebook 授權 URL
 *
 * @param state - CSRF 防護用的隨機字串
 * @returns Facebook OAuth 授權 URL
 */
function buildFacebookAuthUrl(state: string): string {
  const config = getFacebookOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "email,public_profile",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

/**
 * 使用授權碼交換 Token
 *
 * @param code - Facebook 授權碼
 * @returns Token 回應
 */
async function exchangeCodeForToken(
  code: string,
): Promise<FacebookTokenResponse> {
  const config = getFacebookOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook Token 交換失敗: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<FacebookTokenResponse>;
}

/**
 * 使用 Access Token 取得使用者資料
 *
 * @param accessToken - Facebook Access Token
 * @returns 使用者資料
 */
async function fetchFacebookUserInfo(
  accessToken: string,
): Promise<FacebookUserInfo> {
  const fields = "id,name,first_name,last_name,email,picture,locale,link";
  const response = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=${fields}&access_token=${accessToken}`,
  );

  if (!response.ok) {
    throw new Error(`取得 Facebook 使用者資料失敗: ${response.status}`);
  }

  return response.json() as Promise<FacebookUserInfo>;
}

/**
 * 將 Facebook 使用者資料轉換為統一的 SocialProfile 格式
 *
 * @param userInfo - Facebook 使用者資料
 * @param tokens - Facebook Token
 * @returns SocialProfile
 */
function mapToSocialProfile(
  userInfo: FacebookUserInfo,
  tokens: FacebookTokenResponse,
): SocialProfile {
  return {
    provider: "facebook",
    providerUserId: userInfo.id,
    email: userInfo.email,
    displayName: userInfo.name,
    avatarUrl: userInfo.picture?.data?.url,
    facebookFirstName: userInfo.first_name,
    facebookLastName: userInfo.last_name,
    facebookLocale: userInfo.locale,
    facebookLink: userInfo.link,
    accessToken: tokens.access_token,
    tokenExpiresAt: new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString(),
    rawProfile: userInfo as unknown as Record<string, unknown>,
  };
}

// ============================================================
// 路由定義
// ============================================================

/**
 * 發起 Facebook 登入
 * @route GET /api/auth/facebook
 *
 * 產生 state 並重導向至 Facebook 授權頁面
 */
router.get("/", oauthLimiter, (req: Request, res: Response): void => {
  try {
    const config = getFacebookOAuthConfig();
    if (!config.appId || !config.appSecret) {
      res.status(503).json({ error: "Facebook Login 未設定" });
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
    res.cookie("oauth_state_facebook", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 分鐘
      path: "/",
    });

    const authUrl = buildFacebookAuthUrl(state);
    logger.info("Facebook OAuth 重導向", { redirectUri: config.redirectUri });
    res.redirect(authUrl);
  } catch (err) {
    logger.error("Facebook OAuth 發起失敗", err as Error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

/**
 * Facebook OAuth 回呼
 * @route GET /api/auth/facebook/callback
 *
 * 處理 Facebook 回呼：交換 Token → 取得使用者資料 → 登入/建立帳號
 */
router.get("/callback", async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = getFrontendUrl();

  try {
    const { code, state, error: oauthError, error_reason } = req.query;

    // 處理 Facebook 回傳的錯誤
    if (oauthError) {
      logger.warn("Facebook OAuth 使用者拒絕授權", {
        error: oauthError,
        reason: error_reason,
      });
      res.redirect(`${frontendUrl}/login?error=access_denied`);
      return;
    }

    if (!code || typeof code !== "string") {
      logger.warn("Facebook OAuth callback 缺少 code");
      res.redirect(`${frontendUrl}/login?error=no_code`);
      return;
    }

    // 驗證 state（CSRF 防護）
    const storedState = req.cookies.oauth_state_facebook;
    if (!state || state !== storedState) {
      logger.warn("Facebook OAuth state 不匹配", {
        hasState: !!state,
        hasStoredState: !!storedState,
      });
      res.redirect(`${frontendUrl}/login?error=invalid_state`);
      return;
    }

    // 清除 state cookie
    res.clearCookie("oauth_state_facebook", { path: "/" });

    // Step 1: 交換 Token
    const tokens = await exchangeCodeForToken(code);

    // Step 2: 取得使用者資料
    const userInfo = await fetchFacebookUserInfo(tokens.access_token);

    if (!userInfo.id) {
      logger.error("Facebook 使用者資料缺少 ID");
      res.redirect(`${frontendUrl}/login?error=invalid_profile`);
      return;
    }

    // Step 3: 轉換為統一格式
    const socialProfile = mapToSocialProfile(userInfo, tokens);

    logger.info("Facebook OAuth 取得使用者資料", {
      facebookId: userInfo.id,
      name: userInfo.name,
      hasEmail: !!userInfo.email,
    });

    // Step 4: 社交登入處理（查找/建立使用者 + 設定 Cookie + 重導向）
    await handleSocialLogin(res, socialProfile, frontendUrl);
  } catch (err) {
    logger.error("Facebook OAuth callback 失敗", err as Error);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
});

/**
 * 已登入使用者綁定 Facebook 帳號
 * @route POST /api/auth/facebook/bind
 *
 * 使用 code 綁定 Facebook 帳號到現有使用者
 */
router.post(
  "/bind",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body;
      const userId = (req as Request & { user: { userId: number } }).user
        .userId;

      if (!code || typeof code !== "string") {
        res.status(400).json({ error: "缺少 code" });
        return;
      }

      // 交換 Token
      const tokens = await exchangeCodeForToken(code);

      // 取得使用者資料
      const userInfo = await fetchFacebookUserInfo(tokens.access_token);

      if (!userInfo.id) {
        res.status(400).json({ error: "無法取得 Facebook 使用者資料" });
        return;
      }

      const socialProfile = mapToSocialProfile(userInfo, tokens);

      // 儲存社交帳號綁定
      await upsertSocialAccount(userId, socialProfile);
      await updateAuthProvider(userId, "facebook");

      logger.info("Facebook 帳號綁定成功", {
        userId,
        facebookId: userInfo.id,
      });

      res.json({
        message: "Facebook 帳號綁定成功",
        provider: "facebook",
        displayName: userInfo.name,
        email: userInfo.email,
      });
    } catch (err) {
      logger.error("Facebook 帳號綁定失敗", err as Error);
      res.status(500).json({ error: "綁定失敗，請稍後再試" });
    }
  },
);

export default router;
