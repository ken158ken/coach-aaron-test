/**
 * 教練設定 + 可預約時段服務
 * @module services/coach.service
 */

import { get, post, put, del } from "./api";

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
