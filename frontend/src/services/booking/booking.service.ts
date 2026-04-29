/**
 * 諮詢預約服務
 * @module services/booking.service
 */

import { get, post } from "../api";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "等待教練確認",
  confirmed: "已確認",
  rejected: "已拒絕",
  cancelled: "已取消",
  completed: "已完成",
};

export interface AvailableSlot {
  startIso: string;
  endIso: string;
  localDate: string;   // 'YYYY-MM-DD'
  localTime: string;   // 'HH:mm'
}

export interface MyBooking {
  id: number;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  user_note: string;
  coach_note: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  rejected_at: string | null;
  cancelled_by: "user" | "coach" | "admin" | null;
  course: {
    course_id: number;
    course_title: string;
    course_slug: string;
    course_thumbnail_url: string | null;
  } | null;
}

export interface CoachBookingRow extends Omit<MyBooking, "course"> {
  google_event_id: string | null;
  user: {
    user_id: number;
    name: string;
    display_name: string;
    email: string;
    phone_number?: string;
  } | null;
  course: {
    course_id: number;
    course_title: string;
    course_slug: string;
  } | null;
}

export const bookingService = {
  // === 用戶面 ===
  getSlots: (fromYmd: string, toYmd: string): Promise<AvailableSlot[]> =>
    get<AvailableSlot[]>(`/api/bookings/slots?from=${fromYmd}&to=${toYmd}`),

  create: (data: {
    startAt: string;
    endAt: string;
    courseId?: number | null;
    userNote?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<MyBooking> => post<MyBooking>("/api/bookings", data),

  getMine: (): Promise<MyBooking[]> => get<MyBooking[]>("/api/bookings/mine"),

  cancelMine: (id: number): Promise<MyBooking> =>
    post<MyBooking>(`/api/bookings/${id}/cancel`, {}),

  // === 教練 / admin 面 ===
  getCoachAll: (params?: {
    status?: BookingStatus[];
    from?: string;
    to?: string;
  }): Promise<CoachBookingRow[]> => {
    const q = new URLSearchParams();
    if (params?.status?.length) q.set("status", params.status.join(","));
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const qs = q.toString();
    return get<CoachBookingRow[]>(
      `/api/bookings/coach/all${qs ? `?${qs}` : ""}`,
    );
  },
  getCoachPending: (): Promise<CoachBookingRow[]> =>
    get<CoachBookingRow[]>("/api/bookings/coach/pending"),
  approve: (id: number, coachNote?: string): Promise<CoachBookingRow> =>
    post<CoachBookingRow>(`/api/bookings/${id}/approve`, {
      coachNote: coachNote || "",
    }),
  reject: (id: number, coachNote?: string): Promise<CoachBookingRow> =>
    post<CoachBookingRow>(`/api/bookings/${id}/reject`, {
      coachNote: coachNote || "",
    }),
  coachCancel: (id: number, coachNote?: string): Promise<CoachBookingRow> =>
    post<CoachBookingRow>(`/api/bookings/${id}/coach-cancel`, {
      coachNote: coachNote || "",
    }),
};

export default bookingService;
