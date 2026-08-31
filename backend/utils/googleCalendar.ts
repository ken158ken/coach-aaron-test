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
  bookingId?: string | number; // 你 DB 的 booking id → 寫入事件 extendedProperties 供對帳/去重
  addMeet?: boolean;         // 是否自動產生 Google Meet 連結（預設 true）
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
    const addMeet = input.addMeet !== false; // 預設自動加 Meet
    const event: calendar_v3.Schema$Event = {
      summary: input.summary,
      description: input.description || "",
      start: { dateTime: input.startIso, timeZone: coach.timezone },
      end: { dateTime: input.endIso, timeZone: coach.timezone },
      attendees: input.attendeeEmail
        ? [{ email: input.attendeeEmail }]
        : undefined,
      // 自訂提醒（覆蓋日曆預設）：提前 1 天 email + 提前 30 分鐘彈窗。
      // 會員被加為 attendee 後，此事件會出現在「會員自己的 Google 日曆」，
      // 並依 Google 規則帶提醒；attendee 亦可自行調整自己的提醒。
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
      // 把 DB 的 booking id 存進事件（私有屬性，僅日曆擁有者可見），
      // 供日後同步/對帳/去重。上限：key≤44、value≤1024 字元。
      extendedProperties:
        input.bookingId != null
          ? { private: { booking_id: String(input.bookingId) } }
          : undefined,
      // 自動產生 Google Meet 視訊連結（線上諮詢用）。requestId 需唯一。
      conferenceData: addMeet
        ? {
            createRequest: {
              requestId: `booking-${input.bookingId ?? "x"}-${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    };
    const res = await cal.events.insert({
      calendarId: coach.googleCalendarId,
      requestBody: event,
      // 關鍵：寄出邀請 → 會員（attendee）自動收到日曆邀請 email、
      // 事件自動進入他自己的 Google 日曆。無需會員授權 OAuth / token。
      // 非 Google 信箱也會收到 .ics 邀請信。
      sendUpdates: "all",
      // 必帶才會保存 conferenceData（產生 Meet 連結）
      conferenceDataVersion: addMeet ? 1 : 0,
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
      // 通知會員（attendee）此預約已取消，同步從他日曆移除
      sendUpdates: "all",
    });
    return true;
  } catch (err) {
    logger.warn("刪除 Google 事件失敗（可能已不存在）", {
      error: (err as Error)?.message || String(err),
    });
    return false;
  }
}

// =====================================================
// 後台日曆完整管理（/admin/google-calendar 日曆排程 CRUD）
// =====================================================

/** 後台日曆管理用的事件輕量表示（欄位白名單，不透傳 Google 原始物件） */
export interface AdminCalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  /** RFC3339 dateTime；全天事件為 'YYYY-MM-DD' */
  start: string;
  end: string;
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  /** 會員預約產生的事件會帶 booking id（extendedProperties.private.booking_id） */
  bookingId: number | null;
}

function toAdminEvent(e: calendar_v3.Schema$Event): AdminCalendarEvent {
  const rawBookingId = e.extendedProperties?.private?.booking_id;
  const bookingId =
    rawBookingId != null && /^\d+$/.test(rawBookingId)
      ? Number(rawBookingId)
      : null;
  return {
    id: e.id || "",
    summary: e.summary || "",
    description: e.description || "",
    location: e.location || "",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    allDay: !e.start?.dateTime,
    meetLink: e.hangoutLink || null,
    htmlLink: e.htmlLink || null,
    bookingId,
  };
}

/**
 * 列出教練日曆一段期間的事件（後台日曆視圖用）
 *
 * 回 null = 尚未連結 Google。API 失敗會 throw —— 後台管理要看得到錯誤，
 * 與 freebusy 的「靜默回空」策略刻意不同。
 */
export async function listCoachEvents(
  coach: CoachGoogleContext,
  from: Date,
  to: Date,
): Promise<AdminCalendarEvent[] | null> {
  if (!coach.googleRefreshToken) return null;
  const auth = buildAuthenticatedClient(coach.googleRefreshToken);
  const cal = google.calendar({ version: "v3", auth });
  const res = await cal.events.list({
    calendarId: coach.googleCalendarId,
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true, // 週期事件展開成單一實例，配合日曆視圖
    orderBy: "startTime",
    maxResults: 500,
    timeZone: coach.timezone,
  });
  return (res.data.items || [])
    .filter((e) => !!e.id && e.status !== "cancelled")
    .map(toAdminEvent);
}

/** 後台建立/編輯事件的輸入（時間欄位：全天給 'YYYY-MM-DD'，一般給 RFC3339） */
export interface AdminEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  addMeet?: boolean;
}

function toEventTimes(
  input: Pick<AdminEventInput, "start" | "end" | "allDay">,
  tz: string,
): Pick<calendar_v3.Schema$Event, "start" | "end"> {
  if (input.allDay) {
    // Google 全天事件的 end.date 為「排他」日期（隔天）
    return { start: { date: input.start }, end: { date: input.end } };
  }
  return {
    start: { dateTime: input.start, timeZone: tz },
    end: { dateTime: input.end, timeZone: tz },
  };
}

/** 後台建立一般活動（無 attendee；可選 Meet）。回 null = 未連結。失敗 throw。 */
export async function createAdminEvent(
  coach: CoachGoogleContext,
  input: AdminEventInput,
): Promise<AdminCalendarEvent | null> {
  if (!coach.googleRefreshToken) return null;
  const auth = buildAuthenticatedClient(coach.googleRefreshToken);
  const cal = google.calendar({ version: "v3", auth });
  const res = await cal.events.insert({
    calendarId: coach.googleCalendarId,
    requestBody: {
      summary: input.summary,
      description: input.description || "",
      location: input.location || "",
      ...toEventTimes(input, coach.timezone),
      conferenceData: input.addMeet
        ? {
            createRequest: {
              requestId: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    },
    conferenceDataVersion: input.addMeet ? 1 : 0,
  });
  return toAdminEvent(res.data);
}

/**
 * 後台編輯事件（部分更新；start/end 需成對提供）。
 *
 * sendUpdates: "all" —— 預約事件改期時會員（attendee）會收到 Google 更新通知，
 * 一般活動無 attendee 不受影響。回 null = 未連結。失敗 throw。
 */
export async function patchAdminEvent(
  coach: CoachGoogleContext,
  eventId: string,
  patch: Partial<AdminEventInput>,
): Promise<AdminCalendarEvent | null> {
  if (!coach.googleRefreshToken) return null;
  const auth = buildAuthenticatedClient(coach.googleRefreshToken);
  const cal = google.calendar({ version: "v3", auth });
  const body: calendar_v3.Schema$Event = {};
  if (patch.summary !== undefined) body.summary = patch.summary;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.location !== undefined) body.location = patch.location;
  if (patch.start && patch.end) {
    Object.assign(
      body,
      toEventTimes(
        { start: patch.start, end: patch.end, allDay: patch.allDay },
        coach.timezone,
      ),
    );
  }
  const res = await cal.events.patch({
    calendarId: coach.googleCalendarId,
    eventId,
    requestBody: body,
    sendUpdates: "all",
  });
  return toAdminEvent(res.data);
}

/**
 * 後台刪除事件。404/410（已不存在）視為成功，其他失敗 throw。
 * 回 null = 未連結。sendUpdates: "all" —— 預約事件的會員會收到取消通知。
 */
export async function deleteAdminEvent(
  coach: CoachGoogleContext,
  eventId: string,
): Promise<boolean | null> {
  if (!coach.googleRefreshToken) return null;
  const auth = buildAuthenticatedClient(coach.googleRefreshToken);
  const cal = google.calendar({ version: "v3", auth });
  try {
    await cal.events.delete({
      calendarId: coach.googleCalendarId,
      eventId,
      sendUpdates: "all",
    });
  } catch (err) {
    const e = err as { code?: unknown; response?: { status?: unknown } };
    const status = Number(e.code ?? e.response?.status);
    if (status !== 404 && status !== 410) throw err;
  }
  return true;
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
