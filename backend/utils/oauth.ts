/**
 * OAuth 共用工具
 *
 * 提供社交登入流程中共用的功能：
 * - JWT Token 產生與 Cookie 設定
 * - 使用者查找與建立
 * - 社交帳號關聯管理
 *
 * @module utils/oauth
 */

import jwt from "jsonwebtoken";
import { Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "./logger.js";

/**
 * OAuth Exchange — 使用最小 JWT（僅含 userId）取代 in-memory Map
 *
 * Vercel Serverless 無狀態，in-memory 資料無法跨 instance 共享。
 * 改用極短 JWT（~150 chars），僅包含 userId + purpose，
 * exchange 端點再從資料庫查詢完整使用者資料。
 */

/**
 * 產生最小 OAuth exchange token（僅含 userId）
 *
 * @param userId - 使用者 ID
 * @returns 短 JWT（~150 字元）
 */
export function generateExchangeCode(userId: number): string {
  return jwt.sign({ sub: userId, p: "ox" }, process.env.JWT_SECRET || "", {
    expiresIn: "60s",
  });
}

/**
 * 驗證並解析 exchange token，回傳 userId
 *
 * @param token - exchange JWT
 * @returns userId 或 null
 */
export function verifyExchangeToken(token: string): number | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "",
    ) as unknown as { sub: number; p: string };
    if (decoded.p !== "ox") return null;
    return decoded.sub;
  } catch {
    return null;
  }
}

/**
 * 社交帳號個人資料介面
 */
export interface SocialProfile {
  provider: "google" | "line";
  providerUserId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  // Google 專用
  googleGivenName?: string;
  googleFamilyName?: string;
  googleLocale?: string;
  googleEmailVerified?: boolean;
  googleHd?: string;
  // LINE 專用
  lineStatusMessage?: string;
  linePictureUrl?: string;
  // Token
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  idToken?: string;
  // 原始資料
  rawProfile?: Record<string, unknown>;
}

/**
 * 設定 JWT Cookie 並回傳使用者資訊
 *
 * @param res - Express Response
 * @param user - 使用者資料
 * @param isAdmin - 是否為管理員
 */
export function setAuthCookie(
  res: Response,
  user: {
    user_id: number;
    username: string;
    email: string;
    display_name: string;
    avatar_url?: string;
    avatar_base64?: string;
    sex?: boolean;
  },
  isAdmin: boolean,
): void {
  const token = jwt.sign(
    {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      sex: user.sex,
      isAdmin,
    },
    process.env.JWT_SECRET || "",
    { expiresIn: "7d" },
  );

  const cookieOptions: import("express").CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie("token", token, cookieOptions);
}

/**
 * 檢查使用者是否為管理員
 *
 * @param email - 使用者 Email
 * @returns 是否為管理員
 */
export async function checkIsAdmin(email: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("admin_whitelist")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * 透過社交帳號查找已綁定的使用者
 *
 * @param provider - 提供者名稱 ('google' | 'line')
 * @param providerUserId - 提供者的使用者 ID
 * @returns 關聯的使用者資料，或 null
 */
export async function findUserBySocialAccount(
  provider: string,
  providerUserId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { data: socialAccount } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id")
      .eq("provider", provider)
      .eq("provider_user_id", providerUserId)
      .single();

    if (!socialAccount) return null;

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("user_id", socialAccount.user_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();

    return user;
  } catch {
    return null;
  }
}

/**
 * 透過 Email 查找使用者
 *
 * @param email - 電子郵件
 * @returns 使用者資料，或 null
 */
export async function findUserByEmail(
  email: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();
    return data;
  } catch {
    return null;
  }
}

/**
 * 建立新使用者（社交登入）
 *
 * @param profile - 社交帳號個人資料
 * @returns 新建立的使用者，或 null
 */
export async function createUserFromSocial(
  profile: SocialProfile,
): Promise<Record<string, unknown> | null> {
  try {
    const username =
      profile.displayName ||
      profile.email?.split("@")[0] ||
      `user_${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        username,
        email:
          profile.email ||
          `${profile.provider}_${profile.providerUserId}@oauth.local`,
        password_hash: "", // 社交登入不需要密碼
        display_name: profile.displayName || username,
        avatar_url: profile.avatarUrl || null,
        // 註：users.sex 欄位已於 migration 025 移除，這裡不可再帶（會 42703 導致註冊失敗）
        email_verified:
          profile.provider === "google" && profile.googleEmailVerified === true,
        auth_provider: profile.provider,
      })
      .select()
      .single();

    if (error) {
      logger.error("建立社交使用者失敗", error as unknown as Error, {
        provider: profile.provider,
        email: profile.email,
      });
      return null;
    }

    // 為新使用者建立所有課程的售價可見性記錄（預設 false）
    if (data?.user_id) {
      try {
        const { data: allCourses } = await supabaseAdmin
          .from("courses")
          .select("course_id")
          .is("deleted_at", null);

        if (allCourses && allCourses.length > 0) {
          const rows = allCourses.map((c: { course_id: number }) => ({
            user_id: data.user_id,
            course_id: c.course_id,
            show_price: false,
          }));
          await supabaseAdmin
            .from("user_course_price_visibility")
            .upsert(rows, { onConflict: "user_id,course_id" });
        }
      } catch (visErr) {
        logger.error("建立售價可見性記錄失敗（OAuth）", visErr as Error);
      }
    }

    return data;
  } catch (err) {
    logger.error("建立社交使用者例外", err as Error);
    return null;
  }
}

/**
 * 建立或更新社交帳號綁定記錄
 *
 * @param userId - 使用者 ID
 * @param profile - 社交帳號個人資料
 */
export async function upsertSocialAccount(
  userId: number,
  profile: SocialProfile,
): Promise<void> {
  try {
    const record = {
      user_id: userId,
      provider: profile.provider,
      provider_user_id: profile.providerUserId,
      provider_email: profile.email || null,
      provider_display_name: profile.displayName || null,
      provider_avatar_url: profile.avatarUrl || null,
      // Google 專用
      google_given_name: profile.googleGivenName || null,
      google_family_name: profile.googleFamilyName || null,
      google_locale: profile.googleLocale || null,
      google_email_verified: profile.googleEmailVerified ?? null,
      google_hd: profile.googleHd || null,
      // LINE 專用
      line_status_message: profile.lineStatusMessage || null,
      line_picture_url: profile.linePictureUrl || null,
      // Token
      access_token: profile.accessToken || null,
      refresh_token: profile.refreshToken || null,
      token_expires_at: profile.tokenExpiresAt || null,
      id_token: profile.idToken || null,
      // 原始資料
      raw_profile: profile.rawProfile || null,
      // 更新登入時間
      last_login_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("user_social_accounts")
      .upsert(record, {
        onConflict: "user_id,provider",
      });

    if (error) {
      logger.error("Upsert 社交帳號失敗", error as unknown as Error, {
        userId,
        provider: profile.provider,
      });
    }
  } catch (err) {
    logger.error("Upsert 社交帳號例外", err as Error);
  }
}

/**
 * 更新使用者的 auth_provider 欄位
 *
 * @param userId - 使用者 ID
 * @param provider - 新的認證提供者
 */
export async function updateAuthProvider(
  userId: number,
  provider: string,
): Promise<void> {
  try {
    // 查詢該使用者已綁定的社交帳號數量
    const { data: socialAccounts } = await supabaseAdmin
      .from("user_social_accounts")
      .select("provider")
      .eq("user_id", userId);

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("password_hash, auth_provider")
      .eq("user_id", userId)
      .single();

    let authProvider = provider;
    const hasPassword = user?.password_hash && user.password_hash.length > 0;
    const socialCount = socialAccounts?.length || 0;

    // 如果有密碼且有社交帳號，或者有多個社交帳號，設為 'multiple'
    if ((hasPassword && socialCount > 0) || socialCount > 1) {
      authProvider = "multiple";
    }

    await supabaseAdmin
      .from("users")
      .update({ auth_provider: authProvider })
      .eq("user_id", userId);
  } catch (err) {
    logger.error("更新 auth_provider 失敗", err as Error, { userId });
  }
}

/**
 * 完整的社交登入處理流程
 *
 * 1. 查找已綁定的社交帳號
 * 2. 如有，更新社交資料並登入
 * 3. 如無，查找相同 Email 的使用者
 * 4. 如有相同 Email，綁定並登入
 * 5. 如無，建立新使用者 + 社交帳號
 *
 * @param res - Express Response
 * @param profile - 社交帳號資料
 * @param frontendUrl - 前端 URL（登入後重導向）
 */
export async function handleSocialLogin(
  res: Response,
  profile: SocialProfile,
  frontendUrl: string,
): Promise<void> {
  try {
    // Step 1: 查找已綁定的社交帳號
    let user = await findUserBySocialAccount(
      profile.provider,
      profile.providerUserId,
    );

    if (user) {
      // 已綁定的帳號 → 更新社交資料並登入
      logger.info("社交登入 - 已綁定使用者", {
        provider: profile.provider,
        userId: user.user_id,
      });

      await upsertSocialAccount(user.user_id as number, profile);
      await supabaseAdmin
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("user_id", user.user_id);
    } else if (profile.email) {
      // Step 2: 尋找相同 Email 的使用者
      user = await findUserByEmail(profile.email);

      if (user) {
        // 相同 Email → 自動綁定
        logger.info("社交登入 - 自動綁定至現有帳號", {
          provider: profile.provider,
          userId: user.user_id,
          email: profile.email,
        });

        await upsertSocialAccount(user.user_id as number, profile);
        await updateAuthProvider(user.user_id as number, profile.provider);
        await supabaseAdmin
          .from("users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("user_id", user.user_id);
      }
    }

    if (!user) {
      // Step 3: 建立新使用者
      logger.info("社交登入 - 建立新使用者", {
        provider: profile.provider,
        email: profile.email,
      });

      user = await createUserFromSocial(profile);
      if (!user) {
        logger.error("社交登入 - 建立使用者失敗");
        res.redirect(`${frontendUrl}/login?error=create_failed`);
        return;
      }

      await upsertSocialAccount(user.user_id as number, profile);
    }

    // Step 4: 產生最小 exchange JWT（僅含 userId，~150 字元）並重導向至前端
    // Vercel Serverless 無狀態，不能用 in-memory Map，改用極短 JWT
    const exchangeToken = generateExchangeCode(user.user_id as number);

    logger.info("社交登入成功 - 產生 exchange token", {
      provider: profile.provider,
      userId: user.user_id,
      email: user.email,
    });

    const redirectUrl = `${frontendUrl}/login?auth_code=${exchangeToken}&provider=${encodeURIComponent(profile.provider)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    logger.error("社交登入處理失敗", err as Error, {
      provider: profile.provider,
    });
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
}
