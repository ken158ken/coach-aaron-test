/**
 * @fileoverview 教練設定路由
 *
 * 涵蓋：
 *   - GET /profile            公開，給 booking 頁讀基本設定（不含 refresh_token）
 *   - PUT /profile            教練/admin 改設定
 *   - GET /availability       公開，週期規則
 *   - POST/PUT/DELETE         教練/admin 管理週期規則
 *   - GET /time-off           公開，休假清單
 *   - POST/DELETE             教練/admin 管理休假
 *   - GET /google/status      教練/admin 看連結狀態
 *   - GET /google/connect     教練/admin 起動 OAuth
 *   - GET /google/callback    OAuth 回調（無需 auth middleware）
 *   - POST /google/disconnect 教練/admin 解除連結
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireCoachOrAdmin, getActiveCoach } from "../middleware/coachAuth.js";
import {
  buildCoachConsentUrl,
  exchangeCoachCode,
  verifyCoachToken,
  listCoachEvents,
  createAdminEvent,
  patchAdminEvent,
  deleteAdminEvent,
  type CoachGoogleContext,
  type AdminEventInput,
} from "../utils/googleCalendar.js";
import { getFrontendUrl } from "../config/oauth.js";
import { logger } from "../utils/logger.js";
import { createNotification } from "../utils/notifications.js";
import { formatInTimeZone } from "date-fns-tz";

const router: Router = express.Router();

// =======================================================
// 公開 API — 給 booking 頁使用
// =======================================================

/** GET /api/coach/profile — 公開教練基本資訊（不含敏感欄位） */
router.get("/profile", async (_req: Request, res: Response): Promise<void> => {
  try {
    const coach = await getActiveCoach();
    if (!coach) {
      res.status(404).json({ error: "尚未設定教練" });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from("coach_profile")
      .select(
        "id, display_name, timezone, default_slot_minutes, booking_notice_hours, booking_window_days, cancellation_hours, is_active",
      )
      .eq("id", coach.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get coach profile error:", err);
    res.status(500).json({ error: "取得教練資料失敗" });
  }
});

/** GET /api/coach/availability — 公開，週期規則 */
router.get(
  "/availability",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const coach = await getActiveCoach();
      if (!coach) {
        res.json([]);
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("coach_availability_rules")
        .select("id, weekday, start_time, end_time, is_active")
        .eq("coach_id", coach.id)
        .eq("is_active", true)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get availability error:", err);
      res.status(500).json({ error: "取得可預約時段失敗" });
    }
  },
);

/** GET /api/coach/time-off — 公開，休假清單（供前端月曆標示） */
router.get(
  "/time-off",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const coach = await getActiveCoach();
      if (!coach) {
        res.json([]);
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("coach_time_off")
        .select("id, start_at, end_at, reason")
        .eq("coach_id", coach.id)
        .gte("end_at", new Date().toISOString())
        .order("start_at", { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error("Get time-off error:", err);
      res.status(500).json({ error: "取得休假資料失敗" });
    }
  },
);

// =======================================================
// 管理員 API — 教練本人或 admin
// =======================================================

/** PUT /api/coach/profile — 更新設定 */
router.put(
  "/profile",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const {
        displayName,
        timezone,
        defaultSlotMinutes,
        bufferMinutes,
        bookingNoticeHours,
        bookingWindowDays,
        cancellationHours,
        isActive,
        googleCalendarId,
      } = req.body;

      const patch: Record<string, unknown> = {};
      if (displayName !== undefined) patch.display_name = displayName;
      if (timezone !== undefined) patch.timezone = timezone;
      if (defaultSlotMinutes !== undefined)
        patch.default_slot_minutes = defaultSlotMinutes;
      if (bufferMinutes !== undefined) patch.buffer_minutes = bufferMinutes;
      if (bookingNoticeHours !== undefined)
        patch.booking_notice_hours = bookingNoticeHours;
      if (bookingWindowDays !== undefined)
        patch.booking_window_days = bookingWindowDays;
      if (cancellationHours !== undefined)
        patch.cancellation_hours = cancellationHours;
      if (isActive !== undefined) patch.is_active = isActive;
      if (googleCalendarId !== undefined)
        patch.google_calendar_id = googleCalendarId;

      const { data, error } = await supabaseAdmin
        .from("coach_profile")
        .update(patch)
        .eq("id", coachId)
        .select(
          "id, display_name, timezone, default_slot_minutes, buffer_minutes, booking_notice_hours, booking_window_days, cancellation_hours, is_active, google_calendar_id",
        )
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update coach profile error:", err);
      res.status(500).json({ error: "更新教練設定失敗" });
    }
  },
);

/** GET /api/coach/profile/full — 教練/admin 看完整設定（含 buffer 等） */
router.get(
  "/profile/full",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const { data, error } = await supabaseAdmin
        .from("coach_profile")
        .select(
          "id, user_id, display_name, timezone, default_slot_minutes, buffer_minutes, booking_notice_hours, booking_window_days, cancellation_hours, is_active, google_calendar_id",
        )
        .eq("id", coachId)
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Get coach full profile error:", err);
      res.status(500).json({ error: "取得教練資料失敗" });
    }
  },
);

/** POST /api/coach/availability — 新增週期規則 */
router.post(
  "/availability",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const { weekday, startTime, endTime } = req.body;
      if (
        typeof weekday !== "number" ||
        weekday < 0 ||
        weekday > 6 ||
        typeof startTime !== "string" ||
        typeof endTime !== "string"
      ) {
        res.status(400).json({ error: "參數錯誤" });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("coach_availability_rules")
        .insert({
          coach_id: coachId,
          weekday,
          start_time: startTime,
          end_time: endTime,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create availability error:", err);
      res.status(500).json({ error: "新增時段失敗" });
    }
  },
);

/** PUT /api/coach/availability/:id */
router.put(
  "/availability/:id",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { weekday, startTime, endTime, isActive } = req.body;
      const patch: Record<string, unknown> = {};
      if (weekday !== undefined) patch.weekday = weekday;
      if (startTime !== undefined) patch.start_time = startTime;
      if (endTime !== undefined) patch.end_time = endTime;
      if (isActive !== undefined) patch.is_active = isActive;
      const { data, error } = await supabaseAdmin
        .from("coach_availability_rules")
        .update(patch)
        .eq("id", id)
        .eq("coach_id", req.coach!.id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Update availability error:", err);
      res.status(500).json({ error: "更新時段失敗" });
    }
  },
);

/** DELETE /api/coach/availability/:id */
router.delete(
  "/availability/:id",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("coach_availability_rules")
        .delete()
        .eq("id", id)
        .eq("coach_id", req.coach!.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete availability error:", err);
      res.status(500).json({ error: "刪除時段失敗" });
    }
  },
);

/** POST /api/coach/time-off */
router.post(
  "/time-off",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const { startAt, endAt, reason } = req.body;
      if (!startAt || !endAt) {
        res.status(400).json({ error: "起訖時間為必填" });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from("coach_time_off")
        .insert({
          coach_id: coachId,
          start_at: startAt,
          end_at: endAt,
          reason: reason || "",
        })
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Create time-off error:", err);
      res.status(500).json({ error: "新增休假失敗" });
    }
  },
);

/** DELETE /api/coach/time-off/:id */
router.delete(
  "/time-off/:id",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("coach_time_off")
        .delete()
        .eq("id", id)
        .eq("coach_id", req.coach!.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error("Delete time-off error:", err);
      res.status(500).json({ error: "刪除休假失敗" });
    }
  },
);

// =======================================================
// Google Calendar 連結 flow
// =======================================================

/** GET /api/coach/google/status */
router.get(
  "/google/status",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      const { data, error } = await supabaseAdmin
        .from("coach_profile")
        .select("google_refresh_token, google_calendar_id")
        .eq("id", coachId)
        .single();
      if (error) throw error;
      const connected = !!data.google_refresh_token;
      let valid = false;
      if (connected) valid = await verifyCoachToken(data.google_refresh_token!);
      res.json({
        connected,
        valid,
        calendarId: data.google_calendar_id,
      });
    } catch (err) {
      console.error("Get Google status error:", err);
      res.status(500).json({ error: "查詢狀態失敗" });
    }
  },
);

/** GET /api/coach/google/connect — 起動授權 */
router.get(
  "/google/connect",
  authenticateToken,
  requireCoachOrAdmin,
  (req: Request, res: Response): void => {
    try {
      // 把 coach_id + timestamp 包進 state（CSRF + 綁定目標）
      const payload = {
        coachId: req.coach!.id,
        userId: req.user!.userId,
        random: Math.random().toString(36).slice(2),
        ts: Date.now(),
      };
      const state = Buffer.from(JSON.stringify(payload)).toString("base64url");
      res.cookie("coach_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path: "/",
      });
      const url = buildCoachConsentUrl(state);
      res.redirect(url);
    } catch (err) {
      console.error("Google connect redirect error:", err);
      res.status(500).json({ error: "啟動授權失敗" });
    }
  },
);

/**
 * 產生「連結完成後自我關閉彈窗 + 通知開啟者刷新狀態」的 HTML。
 * 連 Google 日曆改用彈窗流程：admin 頁面不整頁導轉、不重載，
 * 因此網站登入狀態不會因這個 OAuth 來回而遺失。
 * 若非彈窗（直接開此網址）則退回導向 /admin/google-calendar。
 */
function closePopupHtml(status: string, frontendUrl: string): string {
  const backUrl = `${frontendUrl}/admin/google-calendar?google=${encodeURIComponent(
    status,
  )}`;
  const label =
    status === "connected" ? "✅ 已連結 Google 日曆" : `連結結果：${status}`;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Google 日曆</title></head>
<body style="font-family:system-ui,sans-serif;background:#0e0e10;color:#ececec;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center;line-height:1.9">
<p style="font-size:18px;margin:0">${label}</p>
<p style="color:#888;font-size:14px;margin:8px 0 0">此視窗會自動關閉…</p>
</div>
<script>
(function () {
  try { if (window.opener) window.opener.postMessage({ type: "gcal", status: ${JSON.stringify(
    status,
  )} }, "*"); } catch (e) {}
  setTimeout(function () {
    window.close();
    setTimeout(function () { window.location.replace(${JSON.stringify(
      backUrl,
    )}); }, 500);
  }, 250);
})();
</script>
</body></html>`;
}

/** GET /api/coach/google/callback — OAuth 回調（不需 auth，驗 state） */
router.get(
  "/google/callback",
  async (req: Request, res: Response): Promise<void> => {
    const frontendUrl = getFrontendUrl();
    // 一律以「自我關閉彈窗 HTML」回應，不整頁導轉 → 不影響網站登入狀態
    const finish = (status: string): void => {
      res.send(closePopupHtml(status, frontendUrl));
    };
    try {
      const { code, state, error: oauthError } = req.query;
      const storedState = req.cookies.coach_oauth_state;
      res.clearCookie("coach_oauth_state", { path: "/" });

      if (oauthError) {
        finish("denied");
        return;
      }
      if (!code || typeof code !== "string") {
        finish("no_code");
        return;
      }
      if (!state || state !== storedState) {
        finish("bad_state");
        return;
      }

      // 解 state 拿 coachId
      let coachId: number | null = null;
      try {
        const payload = JSON.parse(
          Buffer.from(String(state), "base64url").toString("utf8"),
        );
        coachId = payload.coachId;
      } catch {
        /* ignore */
      }
      if (!coachId) {
        finish("bad_state");
        return;
      }

      const { refreshToken } = await exchangeCoachCode(code);
      if (!refreshToken) {
        // 若用戶已經授權過未重新 consent，Google 不會回 refresh_token
        logger.warn("Google 未回傳 refresh_token，請教練到 Google 帳號設定撤銷後重試", {
          coachId,
        });
        finish("no_refresh");
        return;
      }
      await supabaseAdmin
        .from("coach_profile")
        .update({ google_refresh_token: refreshToken })
        .eq("id", coachId);
      finish("connected");
    } catch (err) {
      logger.error("Google callback 失敗", err as Error);
      finish("error");
    }
  },
);

/** POST /api/coach/google/disconnect */
router.post(
  "/google/disconnect",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const coachId = req.coach!.id;
      await supabaseAdmin
        .from("coach_profile")
        .update({ google_refresh_token: null })
        .eq("id", coachId);
      res.json({ success: true });
    } catch (err) {
      console.error("Disconnect Google error:", err);
      res.status(500).json({ error: "解除連結失敗" });
    }
  },
);

// =======================================================
// 後台日曆完整管理（升級版 /admin/google-calendar 使用）
//
// 教練/管理員可像操作 Google 日曆一樣對「任何事件」CRUD。
// 特殊處理：會員預約產生的事件（extendedProperties.private.booking_id）
//   - 拖拉/編輯時間 → 同步 bookings.start_at/end_at + 站內通知會員（改期）
//   - 刪除 → 連動取消該預約 + 站內通知會員（業主 2026-08-31 拍板）
// =======================================================

/** 載入 Google 操作 context（refresh token 存 DB，非環境變數） */
async function loadGoogleContext(
  coachId: number,
): Promise<CoachGoogleContext | null> {
  const { data: profile } = await supabaseAdmin
    .from("coach_profile")
    .select("google_calendar_id, google_refresh_token, timezone")
    .eq("id", coachId)
    .single();
  if (!profile) return null;
  return {
    googleCalendarId: profile.google_calendar_id,
    googleRefreshToken: profile.google_refresh_token,
    timezone: profile.timezone,
  };
}

const EVENT_LIMITS = { summary: 200, description: 5000, location: 300 };
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Google event id：base32hex + 週期實例後綴（保守放行常見字元） */
const EVENT_ID_RE = /^[A-Za-z0-9_-]{5,300}$/;

/** 驗證/正規化事件輸入。partial=true 時所有欄位可省略（PATCH 用） */
function parseEventInput(
  body: unknown,
  partial: boolean,
):
  | { ok: true; value: Partial<AdminEventInput> }
  | { ok: false; error: string } {
  const b = (body || {}) as Record<string, unknown>;
  const out: Partial<AdminEventInput> = {};

  if (b.summary !== undefined || !partial) {
    if (typeof b.summary !== "string" || !b.summary.trim()) {
      return { ok: false, error: "標題必填" };
    }
    if (b.summary.trim().length > EVENT_LIMITS.summary) {
      return { ok: false, error: `標題上限 ${EVENT_LIMITS.summary} 字` };
    }
    out.summary = b.summary.trim();
  }
  if (b.description !== undefined) {
    if (
      typeof b.description !== "string" ||
      b.description.length > EVENT_LIMITS.description
    ) {
      return { ok: false, error: "描述格式錯誤或過長" };
    }
    out.description = b.description;
  }
  if (b.location !== undefined) {
    if (
      typeof b.location !== "string" ||
      b.location.length > EVENT_LIMITS.location
    ) {
      return { ok: false, error: "地點格式錯誤或過長" };
    }
    out.location = b.location;
  }

  if (b.start !== undefined || b.end !== undefined || !partial) {
    if (typeof b.start !== "string" || typeof b.end !== "string") {
      return { ok: false, error: "start/end 需成對提供" };
    }
    const isAllDay = b.allDay === true;
    if (isAllDay) {
      if (!DATE_ONLY_RE.test(b.start) || !DATE_ONLY_RE.test(b.end)) {
        return { ok: false, error: "全天事件日期格式需為 YYYY-MM-DD" };
      }
      if (b.end <= b.start) {
        // Google 全天 end 為排他日期：單日事件請送 start 隔天
        return { ok: false, error: "全天事件的結束日需晚於開始日" };
      }
    } else {
      const s = new Date(b.start);
      const e = new Date(b.end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return { ok: false, error: "時間格式錯誤" };
      }
      if (e.getTime() <= s.getTime()) {
        return { ok: false, error: "結束需晚於開始" };
      }
      if (e.getTime() - s.getTime() > 14 * 24 * 3_600_000) {
        return { ok: false, error: "單一事件長度上限 14 天" };
      }
    }
    out.start = b.start;
    out.end = b.end;
    out.allDay = isAllDay;
  }
  if (b.addMeet !== undefined) out.addMeet = b.addMeet === true;
  return { ok: true, value: out };
}

/** 查此 Google 事件是否對應仍有效（pending/confirmed）的會員預約 */
async function findLinkedBooking(
  coachId: number,
  eventId: string,
): Promise<{ id: number; user_id: number; start_at: string } | null> {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, start_at")
    .eq("google_event_id", eventId)
    .eq("coach_id", coachId)
    .in("status", ["pending", "confirmed"])
    .maybeSingle();
  return (data as { id: number; user_id: number; start_at: string } | null) || null;
}

const fmtEventTime = (iso: string, tz: string): string =>
  formatInTimeZone(new Date(iso), tz, "yyyy/MM/dd HH:mm");

/** GET /api/coach/google/events?from=ISO&to=ISO — 期間內事件列表 */
router.get(
  "/google/events",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const from = new Date(String(req.query.from || ""));
      const to = new Date(String(req.query.to || ""));
      if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
        res.status(400).json({ error: "需指定有效的 from/to 區間" });
        return;
      }
      if (to.getTime() - from.getTime() > 93 * 24 * 3_600_000) {
        res.status(400).json({ error: "查詢區間上限 93 天" });
        return;
      }
      const ctx = await loadGoogleContext(req.coach!.id);
      if (!ctx) {
        res.status(404).json({ error: "教練資料不存在" });
        return;
      }
      const events = await listCoachEvents(ctx, from, to);
      if (events === null) {
        res.status(409).json({ error: "尚未連結 Google 日曆", notConnected: true });
        return;
      }
      res.json(events);
    } catch (err) {
      logger.error("讀取 Google 日曆事件失敗", err as Error);
      res.status(502).json({ error: "讀取 Google 日曆失敗，請稍後再試" });
    }
  },
);

/** POST /api/coach/google/events — 建立活動 */
router.post(
  "/google/events",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = parseEventInput(req.body, false);
      if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      const ctx = await loadGoogleContext(req.coach!.id);
      if (!ctx) {
        res.status(404).json({ error: "教練資料不存在" });
        return;
      }
      const event = await createAdminEvent(ctx, parsed.value as AdminEventInput);
      if (event === null) {
        res.status(409).json({ error: "尚未連結 Google 日曆", notConnected: true });
        return;
      }
      res.status(201).json(event);
    } catch (err) {
      logger.error("建立日曆活動失敗", err as Error);
      res.status(502).json({ error: "建立活動失敗，請稍後再試" });
    }
  },
);

/** PATCH /api/coach/google/events/:eventId — 編輯活動（預約事件改期會同步 DB） */
router.patch(
  "/google/events/:eventId",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = String(req.params.eventId ?? "");
      if (!EVENT_ID_RE.test(eventId)) {
        res.status(400).json({ error: "事件 id 格式錯誤" });
        return;
      }
      const parsed = parseEventInput(req.body, true);
      if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      if (Object.keys(parsed.value).length === 0) {
        res.status(400).json({ error: "沒有要更新的欄位" });
        return;
      }
      const coachId = req.coach!.id;
      const ctx = await loadGoogleContext(coachId);
      if (!ctx) {
        res.status(404).json({ error: "教練資料不存在" });
        return;
      }

      // 預約事件：改時間 → 連動改期；不可改為全天
      const changesTime = !!(parsed.value.start && parsed.value.end);
      const linked = changesTime ? await findLinkedBooking(coachId, eventId) : null;
      if (linked && parsed.value.allDay) {
        res.status(400).json({ error: "會員預約事件不可改為全天活動" });
        return;
      }

      const event = await patchAdminEvent(ctx, eventId, parsed.value);
      if (event === null) {
        res.status(409).json({ error: "尚未連結 Google 日曆", notConnected: true });
        return;
      }

      if (linked && changesTime) {
        const newStart = new Date(parsed.value.start!).toISOString();
        const newEnd = new Date(parsed.value.end!).toISOString();
        await supabaseAdmin
          .from("bookings")
          .update({ start_at: newStart, end_at: newEnd })
          .eq("id", linked.id);
        void createNotification({
          userId: linked.user_id,
          type: "booking_rescheduled",
          title: "🕒 預約時間已調整",
          body: `新時間：${fmtEventTime(newStart, ctx.timezone)}（原：${fmtEventTime(linked.start_at, ctx.timezone)}）`,
          link: "/my-bookings",
          metadata: { booking_id: linked.id },
        }).catch(() => {});
      }

      res.json({ ...event, rescheduledBookingId: linked ? linked.id : null });
    } catch (err) {
      logger.error("更新日曆活動失敗", err as Error);
      res.status(502).json({ error: "更新活動失敗，請稍後再試" });
    }
  },
);

/** DELETE /api/coach/google/events/:eventId — 刪除活動（預約事件連動取消） */
router.delete(
  "/google/events/:eventId",
  authenticateToken,
  requireCoachOrAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = String(req.params.eventId ?? "");
      if (!EVENT_ID_RE.test(eventId)) {
        res.status(400).json({ error: "事件 id 格式錯誤" });
        return;
      }
      const coachId = req.coach!.id;
      const ctx = await loadGoogleContext(coachId);
      if (!ctx) {
        res.status(404).json({ error: "教練資料不存在" });
        return;
      }

      const linked = await findLinkedBooking(coachId, eventId);

      // 先刪 Google（404/410 容忍），再改 DB —— 失敗可安全重試
      const deleted = await deleteAdminEvent(ctx, eventId);
      if (deleted === null) {
        res.status(409).json({ error: "尚未連結 Google 日曆", notConnected: true });
        return;
      }

      if (linked) {
        await supabaseAdmin
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancelled_by: req.isAdmin ? "admin" : "coach",
            coach_note: "教練自後台日曆移除此排程",
            google_event_id: null,
          })
          .eq("id", linked.id);
        void createNotification({
          userId: linked.user_id,
          type: "booking_cancelled",
          title: "⚠️ 預約被教練取消",
          body: `原本時間：${fmtEventTime(linked.start_at, ctx.timezone)}`,
          link: "/my-bookings",
          metadata: { booking_id: linked.id, cancelled_by: "coach" },
        }).catch(() => {});
      }

      res.json({ ok: true, cancelledBookingId: linked ? linked.id : null });
    } catch (err) {
      logger.error("刪除日曆活動失敗", err as Error);
      res.status(502).json({ error: "刪除活動失敗，請稍後再試" });
    }
  },
);

export default router;
