/**
 * 教練設定 + 可預約時段服務
 * @module services/coach.service
 */

import { get, post, put, patch, del } from "../api";

export interface CoachPublicProfile {
  id: number;
  display_name: string;
  timezone: string;
  default_slot_minutes: number;
  booking_notice_hours: number;
  booking_window_days: number;
  cancellation_hours: number;
  is_active: boolean;
}

export interface CoachFullProfile extends CoachPublicProfile {
  user_id: number;
  buffer_minutes: number;
  google_calendar_id: string;
}

export interface AvailabilityRule {
  id: number;
  weekday: number;        // 0=週日
  start_time: string;     // 'HH:mm:ss' or 'HH:mm'
  end_time: string;
  is_active: boolean;
}

export interface TimeOff {
  id: number;
  start_at: string;
  end_at: string;
  reason: string;
}

export interface GoogleStatus {
  connected: boolean;
  valid: boolean;
  calendarId: string;
}

/* ══════════════════════════════════════════════════════════════
   後台 Google 日曆（/admin/google-calendar 的完整日曆視圖）
   ══════════════════════════════════════════════════════════════ */

/**
 * 後台日曆上的一則活動。
 *
 * ⚠️ 時間欄位有兩種格式，取決於 `allDay`：
 *   - `allDay: false` → RFC3339（含時區位移），例如 `2026-09-01T14:00:00+08:00`
 *   - `allDay: true`  → `YYYY-MM-DD`，且 **`end` 是排他日期**（Google 與
 *     FullCalendar 的共同慣例：9/1 單日事件的 end 是 `2026-09-02`）
 *
 * `bookingId` 不為 null = 這是「會員預約」產生的事件，改時間／刪除都會
 * 連動到 bookings 表並通知會員，UI 上必須先跟操作者確認。
 */
export interface AdminCalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  bookingId: number | null;
}

/** 建立活動的輸入（時間格式規則同 AdminCalendarEvent） */
export interface AdminEventCreateInput {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  /** 只有「建立」會生效——後端 patch 不處理 conferenceData */
  addMeet?: boolean;
}

/** 編輯活動的輸入；`start`/`end` 必須成對出現（後端會擋單邊） */
export type AdminEventUpdateInput = Partial<AdminEventCreateInput>;

/** PATCH 的回應：事件本身 + 有沒有連帶改到某筆會員預約 */
export type AdminEventPatchResult = AdminCalendarEvent & {
  rescheduledBookingId: number | null;
};

/** DELETE 的回應：有沒有連帶取消某筆會員預約 */
export interface AdminEventDeleteResult {
  ok: true;
  cancelledBookingId: number | null;
}

/**
 * 日曆 API 的錯誤。
 *
 * `api.ts` 的攔截器只 reject 原始 AxiosError，呼叫端要自己挖 status；
 * 這一層把三種需要「不同 UI」的情況攤平成欄位，頁面就不必認識 axios：
 *   - `notConnected` → 尚未連結 Google（HTTP 409）→ 顯示連結引導
 *   - `status === 502` → Google API 掛了 → 錯誤橫幅 + 重試
 *   - 其他（400 驗證失敗…）→ 直接顯示 message
 */
export class CalendarApiError extends Error {
  readonly status: number;
  readonly notConnected: boolean;

  constructor(message: string, status: number, notConnected: boolean) {
    super(message);
    this.name = "CalendarApiError";
    this.status = status;
    this.notConnected = notConnected;
  }
}

/** 把 AxiosError（或任何東西）正規化成 CalendarApiError */
function toCalendarError(err: unknown): CalendarApiError {
  if (err instanceof CalendarApiError) return err;
  const e = err as {
    response?: { status?: number; data?: { error?: string; notConnected?: boolean } };
    message?: string;
  };
  const status = e?.response?.status ?? 0;
  const data = e?.response?.data;
  return new CalendarApiError(
    data?.error || e?.message || "日曆請求失敗",
    status,
    data?.notConnected === true,
  );
}

/** 包一層，讓所有日曆呼叫都吐 CalendarApiError */
async function call<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    throw toCalendarError(err);
  }
}

export const adminCalendarService = {
  /**
   * 取區間內的事件。
   * @param from - 區間起（ISO 字串）
   * @param to - 區間迄（ISO 字串）；後端限制 `to - from <= 93 天`
   */
  list: (from: string, to: string): Promise<AdminCalendarEvent[]> =>
    call(() =>
      get<AdminCalendarEvent[]>("/api/coach/google/events", {
        params: { from, to },
      }),
    ),

  create: (input: AdminEventCreateInput): Promise<AdminCalendarEvent> =>
    call(() => post<AdminCalendarEvent>("/api/coach/google/events", input)),

  update: (
    id: string,
    input: AdminEventUpdateInput,
  ): Promise<AdminEventPatchResult> =>
    call(() =>
      patch<AdminEventPatchResult>(
        `/api/coach/google/events/${encodeURIComponent(id)}`,
        input,
      ),
    ),

  remove: (id: string): Promise<AdminEventDeleteResult> =>
    call(() =>
      del<AdminEventDeleteResult>(
        `/api/coach/google/events/${encodeURIComponent(id)}`,
      ),
    ),
};

export const coachService = {
  // === 公開 ===
  getProfile: (): Promise<CoachPublicProfile> =>
    get<CoachPublicProfile>("/api/coach/profile"),
  getAvailability: (): Promise<AvailabilityRule[]> =>
    get<AvailabilityRule[]>("/api/coach/availability"),
  getTimeOff: (): Promise<TimeOff[]> =>
    get<TimeOff[]>("/api/coach/time-off"),

  // === 教練/admin ===
  getFullProfile: (): Promise<CoachFullProfile> =>
    get<CoachFullProfile>("/api/coach/profile/full"),
  updateProfile: (data: Partial<{
    displayName: string;
    timezone: string;
    defaultSlotMinutes: number;
    bufferMinutes: number;
    bookingNoticeHours: number;
    bookingWindowDays: number;
    cancellationHours: number;
    isActive: boolean;
    googleCalendarId: string;
  }>): Promise<CoachFullProfile> =>
    put<CoachFullProfile>("/api/coach/profile", data),

  createAvailability: (data: {
    weekday: number;
    startTime: string;
    endTime: string;
  }): Promise<AvailabilityRule> =>
    post<AvailabilityRule>("/api/coach/availability", data),
  updateAvailability: (
    id: number,
    data: Partial<{
      weekday: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>,
  ): Promise<AvailabilityRule> =>
    put<AvailabilityRule>(`/api/coach/availability/${id}`, data),
  deleteAvailability: (id: number): Promise<void> =>
    del(`/api/coach/availability/${id}`),

  createTimeOff: (data: {
    startAt: string;
    endAt: string;
    reason?: string;
  }): Promise<TimeOff> => post<TimeOff>("/api/coach/time-off", data),
  deleteTimeOff: (id: number): Promise<void> =>
    del(`/api/coach/time-off/${id}`),

  getGoogleStatus: (): Promise<GoogleStatus> =>
    get<GoogleStatus>("/api/coach/google/status"),
  disconnectGoogle: (): Promise<{ success: boolean }> =>
    post<{ success: boolean }>("/api/coach/google/disconnect", {}),
  /** 回傳一個絕對網址；前端呼叫 `window.location.href = url` 啟動授權 */
  getGoogleConnectUrl: (): string => "/api/coach/google/connect",
};

export default coachService;
