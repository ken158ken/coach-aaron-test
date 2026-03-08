/**
 * LINE Login 路由
 *
 * 處理 LINE 社交登入流程：
 * 1. GET /api/auth/line — 產生 LINE 授權 URL 並重導向
 * 2. GET /api/auth/line/callback — 處理 LINE 回呼
 * 3. POST /api/auth/line/bind — 已登入使用者綁定 LINE 帳號
 *
 * @module routes/authLine
 */

import express, { Request, Response, Router } from "express";
import { getLineLoginConfig, getFrontendUrl } from "../config/oauth.js";
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
 * LINE Token 回應介面
 */
interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

/**
 * LINE 使用者資料介面
 */
interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LINE ID Token 解碼後的資料（可選的 Email 資訊）
 */
interface LineIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
  email?: string;
}

/**
 * 產生 LINE 授權 URL
 *
 * @param state - CSRF 防護用的隨機字串
 * @returns LINE OAuth 授權 URL
 */
function buildLineAuthUrl(state: string): string {
  const config = getLineLoginConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.channelId,
    redirect_uri: config.redirectUri,
    state,
    scope: "profile openid email",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * 使用授權碼交換 Token
 *
 * @param code - LINE 授權碼
 * @returns Token 回應
 */
async function exchangeCodeForToken(code: string): Promise<LineTokenResponse> {
  const config = getLineLoginConfig();
  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.channelId,
      client_secret: config.channelSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE Token 交換失敗: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<LineTokenResponse>;
}

/**
 * 使用 Access Token 取得 LINE 使用者資料
 *
 * @param accessToken - LINE Access Token
 * @returns LINE 使用者資料
 */
async function fetchLineProfile(accessToken: string): Promise<LineUserProfile> {
  const response = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`取得 LINE 使用者資料失敗: ${response.status}`);
  }

  return response.json() as Promise<LineUserProfile>;
}

/**
 * 解碼 LINE ID Token 取得 Email（不驗證簽名，僅解碼 payload）
 *
 * @param idToken - LINE ID Token (JWT)
 * @returns 解碼後的 payload，或 null
 */
function decodeLineIdToken(idToken: string): LineIdTokenPayload | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    return payload as LineIdTokenPayload;
  } catch {
    return null;
  }
}

/**
 * 將 LINE 使用者資料轉換為統一的 SocialProfile 格式
 *
 * @param profile - LINE 使用者資料
 * @param tokens - LINE Token
 * @param idTokenPayload - 解碼後的 ID Token（可選）
 * @returns SocialProfile
 */
function mapToSocialProfile(
  profile: LineUserProfile,
  tokens: LineTokenResponse,
  idTokenPayload: LineIdTokenPayload | null,
): SocialProfile {
  return {
    provider: "line",
    providerUserId: profile.userId,
    email: idTokenPayload?.email || undefined,
    displayName: profile.displayName,
    avatarUrl: profile.pictureUrl,
    lineStatusMessage: profile.statusMessage,
    linePictureUrl: profile.pictureUrl,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString(),
    idToken: tokens.id_token,
    rawProfile: {
      ...profile,
      email: idTokenPayload?.email,
    } as unknown as Record<string, unknown>,
  };
}

// ============================================================
// 路由定義
// ============================================================

/**
 * 發起 LINE 登入
 * @route GET /api/auth/line
 *
 * 產生 state 並重導向至 LINE 授權頁面
 */
router.get("/", oauthLimiter, (req: Request, res: Response): void => {
  try {
    const config = getLineLoginConfig();
    if (!config.channelId || !config.channelSecret) {
      res.status(503).json({ error: "LINE Login 未設定" });
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
    res.cookie("oauth_state_line", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 分鐘
      path: "/",
    });

    const authUrl = buildLineAuthUrl(state);
    logger.info("LINE Login 重導向", { redirectUri: config.redirectUri });
    res.redirect(authUrl);
  } catch (err) {
    logger.error("LINE Login 發起失敗", err as Error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

/**
 * LINE Login 回呼
 * @route GET /api/auth/line/callback
 *
 * 處理 LINE 回呼：交換 Token → 取得使用者資料 → 登入/建立帳號
 */
router.get("/callback", async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = getFrontendUrl();

  try {
    const {
      code,
      state,
      error: oauthError,
      error_description: errorDesc,
    } = req.query;

    // 處理 LINE 回傳的錯誤
    if (oauthError) {
      logger.warn("LINE Login 使用者拒絕授權", {
        error: oauthError,
        description: errorDesc,
      });
      res.redirect(`${frontendUrl}/login?error=access_denied`);
      return;
    }

    if (!code || typeof code !== "string") {
      logger.warn("LINE Login callback 缺少 code");
      res.redirect(`${frontendUrl}/login?error=no_code`);
      return;
    }

    // 驗證 state（CSRF 防護）
    const storedState = req.cookies.oauth_state_line;
    if (!state || state !== storedState) {
      logger.warn("LINE Login state 不匹配", {
        hasState: !!state,
        hasStoredState: !!storedState,
      });
      res.redirect(`${frontendUrl}/login?error=invalid_state`);
      return;
    }

    // 清除 state cookie
    res.clearCookie("oauth_state_line", { path: "/" });

    // Step 1: 交換 Token
    const tokens = await exchangeCodeForToken(code);

    // Step 2: 取得使用者資料
    const lineProfile = await fetchLineProfile(tokens.access_token);

    // Step 3: 解碼 ID Token 取得 Email（如有）
    let idTokenPayload: LineIdTokenPayload | null = null;
    if (tokens.id_token) {
      idTokenPayload = decodeLineIdToken(tokens.id_token);
    }

    if (!lineProfile.userId) {
      logger.error("LINE 使用者資料缺少 userId");
      res.redirect(`${frontendUrl}/login?error=invalid_profile`);
      return;
    }

    // Step 4: 轉換為統一格式並處理登入
    const profile = mapToSocialProfile(lineProfile, tokens, idTokenPayload);
    await handleSocialLogin(res, profile, frontendUrl);
  } catch (err) {
    logger.error("LINE Login callback 失敗", err as Error);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
});

/**
 * 已登入使用者綁定 LINE 帳號
 * @route POST /api/auth/line/bind
 *
 * 使用者已登入後，將 LINE 帳號綁定至現有帳號。
 * 前端需先完成 LINE 授權流程並取得 access_token。
 */
router.post(
  "/bind",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken: lineAccessToken } = req.body;
      const userId = req.user?.userId;

      if (!lineAccessToken) {
        res.status(400).json({ error: "請提供 LINE Access Token" });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "未登入" });
        return;
      }

      // 取得 LINE 使用者資料
      const lineProfile = await fetchLineProfile(lineAccessToken);

      if (!lineProfile.userId) {
        res.status(400).json({ error: "無法取得 LINE 帳號資訊" });
        return;
      }

      const profile: SocialProfile = {
        provider: "line",
        providerUserId: lineProfile.userId,
        displayName: lineProfile.displayName,
        avatarUrl: lineProfile.pictureUrl,
        lineStatusMessage: lineProfile.statusMessage,
        linePictureUrl: lineProfile.pictureUrl,
        accessToken: lineAccessToken,
        rawProfile: lineProfile as unknown as Record<string, unknown>,
      };

      // 綁定社交帳號
      await upsertSocialAccount(Number(userId), profile);
      await updateAuthProvider(Number(userId), "line");

      logger.info("LINE 帳號綁定成功", {
        userId,
        lineUserId: lineProfile.userId,
        lineDisplayName: lineProfile.displayName,
      });

      res.json({
        success: true,
        message: "LINE 帳號綁定成功",
        line: {
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
        },
      });
    } catch (err) {
      logger.error("LINE 帳號綁定失敗", err as Error, {
        userId: req.user?.userId,
      });
      res.status(500).json({ error: "綁定失敗" });
    }
  },
);

export default router;
