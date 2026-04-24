/**
 * Google Calendar 整合工具
 *
 * 集中封裝：
 *   - 產生授權 URL（教練儀表板按「連結日曆」會 redirect 到這）
 *   - code -> refresh_token 交換
 *   - refresh_token -> access_token 交換
 *   - freebusy 查詢（算可預約 slot 時扣掉教練日曆已有行程）
 *   - event 建立 / 刪除（預約 approve / cancel 時同步）
 *
 * 若 coach.google_refresh_token 為 null，freebusy 會回空陣列、
 * event 建立 / 刪除會 silently no-op — 呼叫端不必自己判斷是否已連結。
 *
 * @module utils/googleCalendar
 */

import { google, calendar_v3 } from "googleapis";
import { getGoogleOAuthConfig } from "../config/oauth.js";
import { logger } from "./logger.js";

/** 授權要求的 scope — 包含讀寫事件 */
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

/** 教練 profile 中跟 Google 相關的欄位 */
export interface CoachGoogleContext {
  googleCalendarId: string;            // 通常 'primary'
  googleRefreshToken: string | null;   // null = 尚未連結
  timezone: string;                    // e.g. 'Asia/Taipei'
}

/** 建立 OAuth2 client（共用於授權流程與 token 交換） */
function buildOAuth2Client() {
  const cfg = getGoogleOAuthConfig();
  return new google.auth.OAuth2({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    // 為教練日曆連結設計的專屬 redirect
    redirectUri: `${
      process.env.OAUTH_CALLBACK_BASE_URL || "http://localhost:5000"
    }/api/coach/google/callback`,
  });
}

/**
 * 產生教練「連結 Google 日曆」的授權 URL
 *
 * 注意：這跟登入用的 google OAuth 是獨立 flow，scope 更大（含 calendar），
 * 所以 redirect_uri 不同，不會弄髒現有登入流程。
 *
 * @param state CSRF 用隨機字串，callback 時要驗證
 */
export function buildCoachConsentUrl(state: string): string {
  const oauth2 = buildOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // 強制 consent 才能拿到 refresh_token
    scope: CALENDAR_SCOPES,
    state,
  });
}

/**
 * callback 時用 code 換 token（主要取 refresh_token 存 DB）
 */
export async function exchangeCoachCode(code: string): Promise<{
  refreshToken: string | null;
  accessToken: string;
}> {
  const oauth2 = buildOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return {
    refreshToken: tokens.refresh_token || null,
    accessToken: tokens.access_token || "",
  };
}

/** 帶 refresh_token 的 OAuth client，可直接用來呼叫 API */
function buildAuthenticatedClient(refreshToken: string) {
  const oauth2 = buildOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

/** freebusy 單段 busy 區間（RFC3339 字串） */
export interface BusyInterval {
  start: string;
  end: string;
}

/**
 * 查詢教練日曆在 [from, to] 區間的 busy 時段
 *
 * 若 refreshToken 為 null 或 API 錯誤，回空陣列（不阻擋預約流程）
 */
export async function getCoachBusyIntervals(
  coach: CoachGoogleContext,
  from: Date,
  to: Date,
): Promise<BusyInterval[]> {
  if (!coach.googleRefreshToken) return [];

  try {
    const auth = buildAuthenticatedClient(coach.googleRefreshToken);
    const cal = google.calendar({ version: "v3", auth });
    const res = await cal.freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        timeZone: coach.timezone,
        items: [{ id: coach.googleCalendarId }],
      },
    });
    const busy = res.data.calendars?.[coach.googleCalendarId]?.busy || [];
    return busy
      .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
      .map((b) => ({ start: b.start, end: b.end }));
  } catch (err) {
    logger.warn("freebusy 查詢失敗，視為無忙碌時段", {
      error: (err as Error)?.message || String(err),
    });
    return [];
  }
}

/** 建立事件的輸入 */
export interface CreateEventInput {
  startIso: string;          // '2026-05-01T14:00:00+08:00'
  endIso: string;
  summary: string;           // 事件標題，例：「諮詢 — 小明」
  description?: string;
  attendeeEmail?: string;    // 會議成員
}

/**
 * 在教練日曆上建立事件
 *
 * refresh_token 為 null 時回 null（不報錯），呼叫端寫入 bookings.google_event_id = null 即可
 */
export async function createCoachEvent(
  coach: CoachGoogleContext,
  input: CreateEventInput,
): Promise<string | null> {
  if (!coach.googleRefreshToken) return null;

  try {
    const auth = buildAuthenticatedClient(coach.googleRefreshToken);
    const cal = google.calendar({ version: "v3", auth });
    const event: calendar_v3.Schema$Event = {
      summary: input.summary,
      description: input.description || "",
      start: { dateTime: input.startIso, timeZone: coach.timezone },
      end: { dateTime: input.endIso, timeZone: coach.timezone },
      attendees: input.attendeeEmail
        ? [{ email: input.attendeeEmail }]
        : undefined,
      reminders: { useDefault: true },
    };
    const res = await cal.events.insert({
      calendarId: coach.googleCalendarId,
      requestBody: event,
    });
    return res.data.id || null;
  } catch (err) {
    logger.error("建立 Google 事件失敗", err as Error);
    return null;
  }
}

/**
 * 刪除教練日曆上的事件（確認取消時用）
 *
 * 失敗不 throw（事件可能已被人手動刪掉）
 */
export async function deleteCoachEvent(
  coach: CoachGoogleContext,
  eventId: string,
): Promise<boolean> {
  if (!coach.googleRefreshToken || !eventId) return false;

  try {
    const auth = buildAuthenticatedClient(coach.googleRefreshToken);
    const cal = google.calendar({ version: "v3", auth });
    await cal.events.delete({
      calendarId: coach.googleCalendarId,
      eventId,
    });
    return true;
  } catch (err) {
    logger.warn("刪除 Google 事件失敗（可能已不存在）", {
      error: (err as Error)?.message || String(err),
    });
    return false;
  }
}

/** 單純測試 refresh_token 是否仍有效 */
export async function verifyCoachToken(
  refreshToken: string,
): Promise<boolean> {
  try {
    const oauth2 = buildAuthenticatedClient(refreshToken);
    const res = await oauth2.getAccessToken();
    return !!res.token;
  } catch {
    return false;
  }
}
