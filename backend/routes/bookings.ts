/**
 * @fileoverview 預約路由
 *
 * 用戶面（登入即可）：
 *   GET    /api/bookings/slots?from&to        取可預約時段
 *   POST   /api/bookings                      送出預約（pending）
 *   GET    /api/bookings/mine                 自己的預約
 *   POST   /api/bookings/:id/cancel           取消自己的預約
 *
 * 教練/admin 面：
 *   GET    /api/bookings/coach/all            全部預約（可 filter by status）
 *   GET    /api/bookings/coach/pending        待審核
 *   POST   /api/bookings/:id/approve          批准 + 同步 Google
 *   POST   /api/bookings/:id/reject           拒絕
 *   POST   /api/bookings/:id/coach-cancel     教練取消 confirmed
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireCoachOrAdmin, getActiveCoach } from "../middleware/coachAuth.js";
import {
  computeAvailableSlots,
  isSlotAvailable,
  type AvailabilityRule,
  type CoachSettings,
  type Interval,
} from "../utils/slots.js";
import {
  getCoachBusyIntervals,
  createCoachEvent,
  deleteCoachEvent,
  type CoachGoogleContext,
} from "../utils/googleCalendar.js";
import { logger } from "../utils/logger.js";
import { createNotification } from "../utils/notifications.js";

/** 取教練 user_id（給通知教練用） */
async function getCoachUserId(coachId: number): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from("coach_profile")
    .select("user_id")
    .eq("id", coachId)
    .maybeSingle();
  return data?.user_id || null;
}

/** 把 ISO 時間格成 YYYY/MM/DD HH:mm（給通知 body 用） */
function fmtBookingTime(iso: string): string {
  const d = new Date(iso);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

const router: Router = express.Router();

// =======================================================
// 共用 helper
// =======================================================

async function loadCoachSettingsAndRules(): Promise<{
  coachId: number;
  google: CoachGoogleContext;
  settings: CoachSettings;
  rules: AvailabilityRule[];
} | null> {
  const coach = await getActiveCoach();
  if (!coach) return null;

  const { data: profile, error: pErr } = await supabaseAdmin
    .from("coach_profile")
    .select(
      "id, timezone, default_slot_minutes, buffer_minutes, booking_notice_hours, booking_window_days, google_calendar_id, google_refresh_token",
    )
    .eq("id", coach.id)
    .single();
  if (pErr || !profile) return null;

  const { data: rules, error: rErr } = await supabaseAdmin
    .from("coach_availability_rules")
    .select("weekday, start_time, end_time")
    .eq("coach_id", coach.id)
    .eq("is_active", true);
  if (rErr) return null;

  return {
    coachId: coach.id,
    google: {
      googleCalendarId: profile.google_calendar_id,
      googleRefreshToken: profile.google_refresh_token,
      timezone: profile.timezone,
    },
    settings: {
      timezone: profile.timezone,
      defaultSlotMinutes: profile.default_slot_minutes,
      bufferMinutes: profile.buffer_minutes,
      bookingNoticeHours: profile.booking_notice_hours,
      bookingWindowDays: profile.booking_window_days,
    },
    rules: (rules || []).map((r) => ({
      weekday: r.weekday,
      // DB 回的 TIME 會是 'HH:mm:ss' 字串
      startTime: String(r.start_time).slice(0, 5),
      endTime: String(r.end_time).slice(0, 5),
    })),
  };
}

async function loadBusyIntervals(
  coachId: number,
  google: CoachGoogleContext,
  from: Date,
  to: Date,
): Promise<Interval[]> {
  // 1. 現有 pending/confirmed 預約
  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("start_at, end_at")
    .eq("coach_id", coachId)
    .in("status", ["pending", "confirmed"])
    .gte("end_at", from.toISOString())
    .lte("start_at", to.toISOString());

  // 2. 休假
  const { data: timeOff } = await supabaseAdmin
    .from("coach_time_off")
    .select("start_at, end_at")
    .eq("coach_id", coachId)
    .gte("end_at", from.toISOString())
    .lte("start_at", to.toISOString());

  // 3. Google busy（若已連結）
  const gBusy = await getCoachBusyIntervals(google, from, to);

  const toInterval = (s: string | Date, e: string | Date): Interval => ({
    start: s instanceof Date ? s : new Date(s),
    end: e instanceof Date ? e : new Date(e),
  });

  return [
    ...(existing || []).map((b) => toInterval(b.start_at, b.end_at)),
    ...(timeOff || []).map((t) => toInterval(t.start_at, t.end_at)),
    ...gBusy.map((g) => toInterval(g.start, g.end)),
  ];
}

// =======================================================
// 用戶面 API（需登入）
// =======================================================

/** GET /api/bookings/slots?from=YYYY-MM-DD&to=YYYY-MM-DD */
router.get(
  "/slots",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const fromStr = String(req.query.from || "");
      const toStr = String(req.query.to || "");
      if (!fromStr || !toStr) {
        res.status(400).json({ error: "需指定 from 與 to 日期" });
        return;
      }
      const from = new Date(`${fromStr}T00:00:00Z`);
      const to = new Date(`${toStr}T00:00:00Z`);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        res.status(400).json({ error: "日期格式錯誤" });
        return;
      }

      const ctx = await loadCoachSettingsAndRules();
      if (!ctx) {
        res.json([]);
        return;
      }
      const busy = await loadBusyIntervals(ctx.coachId, ctx.google, from, to);
      const slots = computeAvailableSlots(
        ctx.settings,
        ctx.rules,
        busy,
        from,
        to,
      );
      res.json(slots);
    } catch (err) {
      console.error("Get slots error:", err);
      res.status(500).json({ error: "取得時段失敗" });
    }
  },
);

/** POST /api/bookings — 送出預約 */
router.post(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "未登入" });
        return;
      }
      const {
        startAt,
        endAt,
        courseId,
        userNote,
        contactEmail,
        contactPhone,
      } = req.body;

      if (!startAt || !endAt) {
        res.status(400).json({ error: "起訖時間為必填" });
        return;
      }
      if (!contactEmail && !contactPhone) {
        res.status(400).json({ error: "請提供 email 或電話至少一項" });
        return;
      }

      const ctx = await loadCoachSettingsAndRules();
      if (!ctx) {
        res.status(404).json({ error: "尚未設定教練" });
        return;
      }

      const start = new Date(startAt);
      const end = new Date(endAt);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: "時間格式錯誤" });
        return;
      }

      // 重新驗證 slot 真的可預約（避免前端繞過）
      const busy = await loadBusyIntervals(ctx.coachId, ctx.google, start, end);
      if (!isSlotAvailable(ctx.settings, ctx.rules, busy, start, end)) {
        res.status(409).json({ error: "該時段已不可預約" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .insert({
          coach_id: ctx.coachId,
          user_id: Number(userId),
          course_id: courseId || null,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          status: "pending",
          user_note: userNote || "",
          contact_email: contactEmail || "",
          contact_phone: contactPhone || "",
        })
        .select()
        .single();
      if (error) throw error;

      // 通知教練：有新預約待審核
      const coachUserId = await getCoachUserId(ctx.coachId);
      if (coachUserId) {
        void createNotification({
          userId: coachUserId,
          type: "booking_pending",
          title: "🔔 有新預約待審核",
          body: `預約時間：${fmtBookingTime(start.toISOString())}`,
          link: "/coach",
          metadata: { booking_id: data.id, user_id: Number(userId) },
        }).catch(() => {});
      }

      res.json(data);
    } catch (err) {
      console.error("Create booking error:", err);
      res.status(500).json({ error: "送出預約失敗" });
    }
  },
);

/** GET /api/bookings/mine — 自己的預約 */
router.get(
  "/mine",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select(
          `id, start_at, end_at, status, user_note, coach_note, contact_email, contact_phone,
           created_at, confirmed_at, cancelled_at, rejected_at, cancelled_by,
           course:courses(course_id, course_title, course_slug, course_thumbnail_url)`,
        )
        .eq("user_id", Number(userId))
        .order("start_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get my bookings error:", err);
      res.status(500).json({ error: "取得預約失敗" });
    }
  },
);

/** POST /api/bookings/:id/cancel — 用戶取消自己的 */
router.post(
  "/:id/cancel",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      // 先撈此預約驗證所有權 + 時間
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("id, user_id, start_at, status, google_event_id, coach_id")
        .eq("id", id)
        .single();
      if (!booking) {
        res.status(404).json({ error: "預約不存在" });
        return;
      }
      if (Number(booking.user_id) !== Number(userId)) {
        res.status(403).json({ error: "無權限取消此預約" });
        return;
      }
      if (!["pending", "confirmed"].includes(booking.status)) {
        res
          .status(400)
          .json({ error: `目前狀態 ${booking.status} 不可取消` });
        return;
      }

      // confirmed 必須在 cancellation_hours 之前
      if (booking.status === "confirmed") {
        const { data: profile } = await supabaseAdmin
          .from("coach_profile")
          .select("cancellation_hours")
          .eq("id", booking.coach_id)
          .single();
        const cutoffHours = profile?.cancellation_hours ?? 24;
        const diffMs =
          new Date(booking.start_at).getTime() - Date.now();
        if (diffMs / 3_600_000 < cutoffHours) {
          res
            .status(400)
            .json({
              error: `開始前 ${cutoffHours} 小時內不可取消，請直接聯絡教練`,
            });
          return;
        }
      }

      // 若有 Google event，一起刪
      if (booking.google_event_id) {
        const { data: profile } = await supabaseAdmin
          .from("coach_profile")
          .select("google_calendar_id, google_refresh_token, timezone")
          .eq("id", booking.coach_id)
          .single();
        if (profile) {
          await deleteCoachEvent(
            {
              googleCalendarId: profile.google_calendar_id,
              googleRefreshToken: profile.google_refresh_token,
              timezone: profile.timezone,
            },
            booking.google_event_id,
          );
        }
      }

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: "user",
          google_event_id: null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // 用戶取消 confirmed 預約 → 通知教練（你之前的需求）
      if (booking.status === "confirmed") {
        const coachUserId = await getCoachUserId(booking.coach_id);
        if (coachUserId) {
          void createNotification({
            userId: coachUserId,
            type: "booking_cancelled",
            title: "⚠️ 用戶取消已確認的預約",
            body: `原本時間：${fmtBookingTime(booking.start_at)}`,
            link: "/coach",
            metadata: { booking_id: booking.id, cancelled_by: "user" },
          }).catch(() => {});
        }
      }

      res.json(data);
    } catch (err) {
      console.error("Cancel booking error:", err);
      res.status(500).json({ error: "取消預約失敗" });
    }
  },
);

// =======================================================
// 教練 / admin 面 API
// =======================================================

/** GET /api/bookings/coach/all?status=pending,confirmed&from&to */
router.get(
  "/coach/all",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const statusFilter = String(req.query.status || "");
      const statuses = statusFilter
        ? statusFilter.split(",").filter(Boolean)
        : ["pending", "confirmed", "rejected", "cancelled", "completed"];

      let q = supabaseAdmin
        .from("bookings")
        .select(
          `id, start_at, end_at, status, user_note, coach_note, contact_email, contact_phone,
           google_event_id, created_at, confirmed_at, cancelled_at, rejected_at, cancelled_by,
           user:users(user_id, name, display_name, email, phone_number),
           course:courses(course_id, course_title, course_slug)`,
        )
        .eq("coach_id", coachId)
        .in("status", statuses)
        .order("start_at", { ascending: true });

      if (req.query.from) q = q.gte("start_at", String(req.query.from));
      if (req.query.to) q = q.lte("start_at", String(req.query.to));

      const { data, error } = await q;
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get all bookings error:", err);
      res.status(500).json({ error: "取得預約失敗" });
    }
  },
);

/** GET /api/bookings/coach/pending */
router.get(
  "/coach/pending",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select(
          `id, start_at, end_at, status, user_note, contact_email, contact_phone, created_at,
           user:users(user_id, name, display_name, email),
           course:courses(course_id, course_title)`,
        )
        .eq("coach_id", coachId)
        .eq("status", "pending")
        .order("start_at", { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get pending bookings error:", err);
      res.status(500).json({ error: "取得待審核預約失敗" });
    }
  },
);

/** POST /api/bookings/:id/approve — 批准 + 同步 Google */
router.post(
  "/:id/approve",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const coachId = req.coach!.id;
      const { coachNote } = req.body;

      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select(
          "id, status, start_at, end_at, coach_id, user_id, contact_email, user_note, course_id",
        )
        .eq("id", id)
        .single();
      if (!booking || Number(booking.coach_id) !== Number(coachId)) {
        res.status(404).json({ error: "預約不存在或非此教練" });
        return;
      }
      if (booking.status !== "pending") {
        res
          .status(400)
          .json({ error: `狀態 ${booking.status} 不可批准（需 pending）` });
        return;
      }

      // 拿教練 profile 建 Google event
      const { data: profile } = await supabaseAdmin
        .from("coach_profile")
        .select("google_calendar_id, google_refresh_token, timezone, display_name")
        .eq("id", coachId)
        .single();

      // 取用戶名稱作為 summary
      const { data: u } = await supabaseAdmin
        .from("users")
        .select("name, display_name, email")
        .eq("user_id", booking.user_id)
        .single();
      const attendeeName = u?.display_name || u?.name || u?.email || "用戶";
      const attendeeEmail = booking.contact_email || u?.email;

      let googleEventId: string | null = null;
      if (profile) {
        googleEventId = await createCoachEvent(
          {
            googleCalendarId: profile.google_calendar_id,
            googleRefreshToken: profile.google_refresh_token,
            timezone: profile.timezone,
          },
          {
            startIso: new Date(booking.start_at).toISOString(),
            endIso: new Date(booking.end_at).toISOString(),
            summary: `諮詢 — ${attendeeName}`,
            description: booking.user_note || "",
            attendeeEmail,
          },
        );
      }

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          coach_note: coachNote || "",
          google_event_id: googleEventId,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // 通知用戶：預約已批准
      void createNotification({
        userId: booking.user_id,
        type: "booking_approved",
        title: "✅ 預約已確認",
        body: `${fmtBookingTime(booking.start_at)} 的諮詢已被教練批准`,
        link: "/my-bookings",
        metadata: { booking_id: booking.id },
      }).catch(() => {});

      res.json(data);
    } catch (err) {
      logger.error("Approve booking failed", err as Error);
      res.status(500).json({ error: "批准預約失敗" });
    }
  },
);

/** POST /api/bookings/:id/reject */
router.post(
  "/:id/reject",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const coachId = req.coach!.id;
      const { coachNote } = req.body;

      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("status, coach_id, user_id, start_at")
        .eq("id", id)
        .single();
      if (!booking || Number(booking.coach_id) !== Number(coachId)) {
        res.status(404).json({ error: "預約不存在或非此教練" });
        return;
      }
      if (booking.status !== "pending") {
        res.status(400).json({ error: "僅 pending 可拒絕" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          coach_note: coachNote || "",
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // 通知用戶：被拒絕
      void createNotification({
        userId: booking.user_id,
        type: "booking_rejected",
        title: "❌ 預約被婉拒",
        body: coachNote
          ? `教練回覆：${coachNote}`
          : `${fmtBookingTime(booking.start_at)} 的諮詢未被批准`,
        link: "/my-bookings",
        metadata: { booking_id: Number(id) },
      }).catch(() => {});

      res.json(data);
    } catch (err) {
      console.error("Reject booking error:", err);
      res.status(500).json({ error: "拒絕預約失敗" });
    }
  },
);

/** POST /api/bookings/:id/coach-cancel — 教練取消已確認的 */
router.post(
  "/:id/coach-cancel",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const coachId = req.coach!.id;
      const { coachNote } = req.body;

      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("status, coach_id, user_id, start_at, google_event_id")
        .eq("id", id)
        .single();
      if (!booking || Number(booking.coach_id) !== Number(coachId)) {
        res.status(404).json({ error: "預約不存在或非此教練" });
        return;
      }
      if (!["pending", "confirmed"].includes(booking.status)) {
        res.status(400).json({ error: "該狀態不可取消" });
        return;
      }

      if (booking.google_event_id) {
        const { data: profile } = await supabaseAdmin
          .from("coach_profile")
          .select("google_calendar_id, google_refresh_token, timezone")
          .eq("id", coachId)
          .single();
        if (profile) {
          await deleteCoachEvent(
            {
              googleCalendarId: profile.google_calendar_id,
              googleRefreshToken: profile.google_refresh_token,
              timezone: profile.timezone,
            },
            booking.google_event_id,
          );
        }
      }

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: req.isAdmin ? "admin" : "coach",
          coach_note: coachNote || "",
          google_event_id: null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // 通知用戶：教練取消
      void createNotification({
        userId: booking.user_id,
        type: "booking_cancelled",
        title: "⚠️ 預約被教練取消",
        body: coachNote
          ? `教練說明：${coachNote}`
          : `原本時間：${fmtBookingTime(booking.start_at)}`,
        link: "/my-bookings",
        metadata: { booking_id: Number(id), cancelled_by: "coach" },
      }).catch(() => {});

      res.json(data);
    } catch (err) {
      console.error("Coach cancel error:", err);
      res.status(500).json({ error: "取消預約失敗" });
    }
  },
);

export default router;
