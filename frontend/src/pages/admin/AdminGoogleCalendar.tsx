/**
 * AdminGoogleCalendar — 後台 Google 日曆（完整管理）
 * /admin/google-calendar
 * @theme luxe
 *
 * 這一頁等同「在後台直接開 Google 日曆」：
 *   - 月 / 週 / 日 / 列表視圖（手機預設列表週）
 *   - 點空白或框選時段 → 新增活動；點事件 → 詳情、編輯、刪除
 *   - 拖曳與拉伸 → 直接改期（PATCH）
 *   - 會員預約事件（`bookingId != null`）金框標示，改期／刪除會**連動 DB 並通知會員**，
 *     所以這兩個動作一律先跳確認，把後果講清楚
 *
 * 原本的「Google 帳號連結管理」沒有拿掉，收進頁頂的摺疊卡
 * （已連結時預設收合、未連結／失效時自動展開，因為那時它才是使用者要做的事）。
 *
 * 透明度白名單：luxe-gold 只用 index.css 已定義的 /5 /10 /15 /20 /25 /30
 * （border 另有 /40 /50），其餘一律走標準 Tailwind 色階。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type FullCalendarRef from "@fullcalendar/react";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useDialog, Toast } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  coachService,
  adminCalendarService,
  CalendarApiError,
  type GoogleStatus,
  type AdminCalendarEvent,
  type AdminEventCreateInput,
} from "@/services/booking/coach.service";
import {
  CalendarSurface,
  EventDetailModal,
  EventFormModal,
  addDays,
  shiftDateString,
  toApiTimes,
  toDateInput,
  toDateTimeInput,
  type EventFormValues,
} from "@/components/admin/calendar";

const DAY_MS = 86_400_000;
/** 前後各多抓一週，換月時邊緣那幾格不會空白 */
const RANGE_BUFFER_MS = 7 * DAY_MS;
/** 後端硬性上限（GET /google/events 超過 93 天回 400） */
const MAX_RANGE_MS = 93 * DAY_MS;
const MOBILE_QUERY = "(max-width: 767px)";

/** 空白表單：now 起算的下一個整半點，長度一小時 */
function blankForm(): EventFormValues {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() < 30 ? 30 : 60);
  const end = new Date(start.getTime() + 3_600_000);
  return {
    summary: "",
    allDay: false,
    startAt: toDateTimeInput(start),
    endAt: toDateTimeInput(end),
    startDate: toDateInput(start),
    endDate: toDateInput(start),
    location: "",
    description: "",
    addMeet: false,
  };
}

/**
 * 由日曆上的框選建出表單初值。
 *
 * `end` 一律是 FullCalendar 給的**排他**結束（月視圖點一天 → end 是隔天），
 * 全天欄位要退回一天才是使用者看到的「結束日」。
 * 另一組欄位也一併填好，讓使用者切換全天時不會看到空白。
 */
function formFromSelection(start: Date, end: Date, allDay: boolean): EventFormValues {
  const base = blankForm();
  if (allDay) {
    const lastDay = addDays(end, -1);
    return {
      ...base,
      allDay: true,
      startDate: toDateInput(start),
      endDate: toDateInput(lastDay < start ? start : lastDay),
      // 切回「非全天」時給一個合理預設：當天 09:00–10:00
      startAt: `${toDateInput(start)}T09:00`,
      endAt: `${toDateInput(start)}T10:00`,
    };
  }
  return {
    ...base,
    allDay: false,
    startAt: toDateTimeInput(start),
    endAt: toDateTimeInput(end),
    startDate: toDateInput(start),
    endDate: toDateInput(start),
  };
}

/** 由既有事件建出表單初值（API 格式 → input 格式） */
function formFromEvent(e: AdminCalendarEvent): EventFormValues {
  const base = blankForm();
  if (e.allDay) {
    const lastDay = shiftDateString(e.end, -1);
    return {
      ...base,
      summary: e.summary,
      location: e.location,
      description: e.description,
      allDay: true,
      startDate: e.start,
      endDate: lastDay < e.start ? e.start : lastDay,
      startAt: `${e.start}T09:00`,
      endAt: `${e.start}T10:00`,
    };
  }
  const s = new Date(e.start);
  const en = new Date(e.end);
  return {
    ...base,
    summary: e.summary,
    location: e.location,
    description: e.description,
    allDay: false,
    startAt: toDateTimeInput(s),
    endAt: toDateTimeInput(en),
    startDate: toDateInput(s),
    endDate: toDateInput(s),
  };
}

const AdminGoogleCalendar: React.FC = () => {
  const { confirm, alert } = useDialog();
  const { t, isZhTW } = useLanguage();
  const g = t.adminGoogleCalendarPage;
  const c = t.adminCalendar;

  // ── 連結狀態（原有功能） ──────────────────────────────
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  // ── 日曆 ─────────────────────────────────────────────
  /** FullCalendar 只在 client 掛載後才渲染：server 端輸出的是骨架，避免 hydration 落差 */
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState<boolean>(false);
  const rangeRef = useRef<{ from: string; to: string } | null>(null);
  /** 快速換月時，晚回來的舊請求不可以蓋掉新資料 */
  const reqIdRef = useRef<number>(0);
  const calRef = useRef<FullCalendarRef | null>(null);

  // ── 彈窗 ─────────────────────────────────────────────
  const [detailEvent, setDetailEvent] = useState<AdminCalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<EventFormValues>(blankForm);
  const [editing, setEditing] = useState<AdminCalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [toast, setToast] = useState<{
    key: number;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ key: Date.now(), message, type });
    },
    [],
  );
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.matchMedia(MOBILE_QUERY).matches);
  }, []);

  // ── 連結狀態載入 ─────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await coachService.getGoogleStatus();
      setStatus(data);
      // 沒連好時，設定卡才是使用者現在該做的事 → 自動展開
      if (!(data.connected && data.valid)) setPanelOpen(true);
    } catch (err) {
      setStatusError((err as Error).message || g.statusLoadFailed);
      setStatus(null);
      setPanelOpen(true);
    } finally {
      setStatusLoading(false);
    }
  }, [g.statusLoadFailed]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connected = status?.connected ?? false;
  const valid = status?.valid ?? false;
  const isLinked = connected && valid;

  const handleConnect = useCallback(() => {
    const url = coachService.getGoogleConnectUrl();
    // 用「彈窗」授權，讓本頁不整頁重載 → 網站登入狀態不會遺失。
    const popup = window.open(url, "gcal_oauth", "width=520,height=680");
    if (!popup) {
      // 彈窗被瀏覽器封鎖 → 退回整頁導轉（callback 會導回本頁）
      window.location.href = url;
      return;
    }
    // 彈窗完成後會 postMessage 通知；同源才採信，收到就刷新狀態
    let poll = 0;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string } | null;
      if (d && d.type === "gcal") {
        window.removeEventListener("message", onMsg);
        window.clearInterval(poll);
        setNotConnected(false);
        void loadStatus();
      }
    };
    window.addEventListener("message", onMsg);
    // 保底：偵測彈窗關閉後刷新狀態（萬一沒收到訊息，例如跨網域）
    poll = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(poll);
        window.removeEventListener("message", onMsg);
        setNotConnected(false);
        void loadStatus();
      }
    }, 800);
  }, [loadStatus]);

  const handleDisconnect = useCallback(async () => {
    const ok = await confirm({
      title: g.disconnectTitle,
      message: g.disconnectMessage,
      confirmText: g.disconnectBtn,
      cancelText: t.common.cancel,
      variant: "danger",
    });
    if (!ok) return;

    setDisconnecting(true);
    try {
      const res = await coachService.disconnectGoogle();
      if (!res.success) throw new Error(g.disconnectFailed);
      setEvents([]);
      await loadStatus();
      await alert({
        title: g.disconnectedTitle,
        message: g.disconnectedMessage,
        type: "success",
      });
    } catch (err) {
      await alert({
        title: g.actionFailedTitle,
        message: (err as Error).message || g.disconnectErrorMessage,
        type: "error",
      });
    } finally {
      setDisconnecting(false);
    }
  }, [alert, confirm, g, loadStatus, t.common.cancel]);

  // ── 事件載入 ─────────────────────────────────────────
  const loadEvents = useCallback(
    async (range: { from: string; to: string }) => {
      const id = ++reqIdRef.current;
      setEventsLoading(true);
      setEventsError(null);
      try {
        const data = await adminCalendarService.list(range.from, range.to);
        if (id !== reqIdRef.current) return;
        setEvents(data);
        setNotConnected(false);
      } catch (err) {
        if (id !== reqIdRef.current) return;
        const e = err as CalendarApiError;
        if (e.notConnected) {
          setNotConnected(true);
          setEvents([]);
          setPanelOpen(true);
        } else {
          setEventsError(e.message || c.loadFailedBody);
        }
      } finally {
        if (id === reqIdRef.current) setEventsLoading(false);
      }
    },
    [c.loadFailedBody],
  );

  /** 重抓目前視圖的區間（新增／編輯／刪除後，以及「重新整理」鈕） */
  const reload = useCallback(() => {
    if (rangeRef.current) void loadEvents(rangeRef.current);
  }, [loadEvents]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const from = new Date(arg.start.getTime() - RANGE_BUFFER_MS);
      let to = new Date(arg.end.getTime() + RANGE_BUFFER_MS);
      // 後端擋 93 天；月視圖 42 天 + 兩週緩衝遠低於上限，這裡只是保險
      if (to.getTime() - from.getTime() > MAX_RANGE_MS) {
        to = new Date(from.getTime() + MAX_RANGE_MS);
      }
      const range = { from: from.toISOString(), to: to.toISOString() };
      rangeRef.current = range;
      void loadEvents(range);
    },
    [loadEvents],
  );

  // ── 建立 ─────────────────────────────────────────────
  const openCreate = useCallback((initial: EventFormValues) => {
    setFormMode("create");
    setEditing(null);
    setFormInitial(initial);
    setFormOpen(true);
  }, []);

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      openCreate(formFromSelection(arg.start, arg.end, arg.allDay));
    },
    [openCreate],
  );

  const handleNewClick = useCallback(() => {
    openCreate(blankForm());
  }, [openCreate]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    // 收掉日曆上殘留的框選highlight
    calRef.current?.getApi().unselect();
  }, []);

  // ── 詳情 / 編輯 ──────────────────────────────────────
  const handleEventClick = useCallback((arg: EventClickArg) => {
    const raw = arg.event.extendedProps.raw as AdminCalendarEvent | undefined;
    if (!raw) return;
    setDetailEvent(raw);
    setDetailOpen(true);
  }, []);

  const handleEdit = useCallback((event: AdminCalendarEvent) => {
    setDetailOpen(false);
    setFormMode("edit");
    setEditing(event);
    setFormInitial(formFromEvent(event));
    setFormOpen(true);
  }, []);

  /** 送出新增／編輯 */
  const handleSubmit = useCallback(
    async (payload: AdminEventCreateInput) => {
      setSubmitting(true);
      try {
        if (formMode === "create") {
          await adminCalendarService.create(payload);
          showToast(c.createdToast);
        } else if (editing) {
          // 會員預約改時間 = 連動改期 + 通知會員 → 先問清楚
          const timeChanged =
            payload.start !== editing.start ||
            payload.end !== editing.end ||
            (payload.allDay ?? false) !== editing.allDay;
          if (editing.bookingId != null && timeChanged) {
            const ok = await confirm({
              title: c.confirmRescheduleTitle,
              message: c.confirmRescheduleBody,
              confirmText: c.confirmRescheduleOk,
              cancelText: t.common.cancel,
            });
            if (!ok) {
              setSubmitting(false);
              return;
            }
          }
          const res = await adminCalendarService.update(editing.id, payload);
          showToast(
            res.rescheduledBookingId != null
              ? c.rescheduledToast.replace("{id}", String(res.rescheduledBookingId))
              : c.updatedToast,
          );
        }
        setFormOpen(false);
        setEditing(null);
        calRef.current?.getApi().unselect();
        reload();
      } catch (err) {
        showToast((err as Error).message || c.actionFailed, "error");
      } finally {
        setSubmitting(false);
      }
    },
    [c, confirm, editing, formMode, reload, showToast, t.common.cancel],
  );

  // ── 刪除 ─────────────────────────────────────────────
  const handleDelete = useCallback(
    async (event: AdminCalendarEvent) => {
      const isBooking = event.bookingId != null;
      const ok = await confirm({
        title: isBooking ? c.confirmDeleteBookingTitle : c.confirmDeleteTitle,
        message: isBooking ? c.confirmDeleteBookingBody : c.confirmDeleteBody,
        confirmText: isBooking ? c.confirmDeleteBookingOk : t.common.delete,
        cancelText: t.common.cancel,
        variant: "danger",
      });
      if (!ok) return;

      setDeleting(true);
      try {
        const res = await adminCalendarService.remove(event.id);
        showToast(
          res.cancelledBookingId != null
            ? c.cancelledBookingToast.replace("{id}", String(res.cancelledBookingId))
            : c.deletedToast,
        );
        setDetailOpen(false);
        setDetailEvent(null);
        reload();
      } catch (err) {
        showToast((err as Error).message || c.actionFailed, "error");
      } finally {
        setDeleting(false);
      }
    },
    [c, confirm, reload, showToast, t.common.cancel, t.common.delete],
  );

  // ── 拖曳 / 拉伸改期 ──────────────────────────────────
  const applyDragChange = useCallback(
    async (info: EventDropArg | EventResizeDoneArg) => {
      const ev = info.event;
      const raw = ev.extendedProps.raw as AdminCalendarEvent | undefined;
      const start = ev.start;
      if (!raw || !start) {
        info.revert();
        return;
      }
      const end =
        ev.end ?? new Date(start.getTime() + (ev.allDay ? DAY_MS : 3_600_000));

      // 會員預約不能變成全天（後端會用 400 擋，這裡先攔下來給更好的訊息）
      if (raw.bookingId != null && ev.allDay && !raw.allDay) {
        info.revert();
        await alert({
          title: c.actionFailed,
          message: c.bookingLockedAllDay,
          type: "error",
        });
        return;
      }

      if (raw.bookingId != null) {
        const ok = await confirm({
          title: c.confirmRescheduleTitle,
          message: c.confirmRescheduleBody,
          confirmText: c.confirmRescheduleOk,
          cancelText: t.common.cancel,
        });
        if (!ok) {
          info.revert();
          return;
        }
      }

      try {
        const res = await adminCalendarService.update(raw.id, {
          ...toApiTimes(start, end, ev.allDay),
          allDay: ev.allDay,
        });
        showToast(
          res.rescheduledBookingId != null
            ? c.rescheduledToast.replace("{id}", String(res.rescheduledBookingId))
            : c.updatedToast,
        );
        reload();
      } catch (err) {
        info.revert();
        showToast((err as Error).message || c.actionFailed, "error");
      }
    },
    [alert, c, confirm, reload, showToast, t.common.cancel],
  );

  const handleEventDrop = useCallback(
    (arg: EventDropArg) => {
      void applyDragChange(arg);
    },
    [applyDragChange],
  );
  const handleEventResize = useCallback(
    (arg: EventResizeDoneArg) => {
      void applyDragChange(arg);
    },
    [applyDragChange],
  );

  // ── 連結狀態卡的內容（沿用原本四種狀態） ─────────────
  const statusPill = useMemo(() => {
    if (statusLoading) {
      return { label: g.statusLoading, cls: "text-luxe-muted border-luxe-gold/20" };
    }
    if (statusError) {
      return { label: g.statusLoadFailed, cls: "text-red-400 border-red-500/40" };
    }
    if (isLinked) {
      return {
        label: c.connectionConnected,
        cls: "text-green-400 border-green-500/40",
      };
    }
    if (connected && !valid) {
      return {
        label: c.connectionExpired,
        cls: "text-amber-400 border-amber-500/40",
      };
    }
    return {
      label: c.connectionDisconnected,
      cls: "text-luxe-muted border-luxe-gold/20",
    };
  }, [c, connected, g, isLinked, statusError, statusLoading, valid]);

  const renderStatusDetail = (): React.ReactNode => {
    if (statusLoading) {
      return (
        <div className="flex items-center gap-3 text-luxe-muted text-sm">
          <span className="w-4 h-4 border border-t-transparent border-luxe-gold rounded-full animate-spin" />
          {g.statusLoading}
        </div>
      );
    }
    if (statusError) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <p className="text-sm font-medium text-red-400">{g.statusLoadFailed}</p>
            <p className="text-xs text-luxe-muted mt-1">{statusError}</p>
          </div>
        </div>
      );
    }
    if (isLinked) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-400">{g.statusConnected}</p>
            <p className="text-xs text-luxe-muted mt-1 break-all">
              {g.calendarIdLabel}
              <span className="text-luxe-text ml-1">
                {status?.calendarId || "primary"}
              </span>
            </p>
          </div>
        </div>
      );
    }
    if (connected && !valid) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-400">{g.statusExpired}</p>
            <p className="text-xs text-luxe-muted mt-1">{g.statusExpiredHint}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-3">
        <span className="text-xl">⚪</span>
        <div>
          <p className="text-sm font-medium text-luxe-text">{g.statusNone}</p>
          <p className="text-xs text-luxe-muted mt-1">{g.statusNoneHint}</p>
        </div>
      </div>
    );
  };

  const showCalendar = mounted && isLinked && !notConnected;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={clearToast}
        />
      )}

      {/* Header */}
      <div>
        <span className="text-xs text-luxe-muted uppercase tracking-widest">Admin</span>
        <h1 className="text-2xl font-light text-luxe-text mt-1">{g.pageTitle}</h1>
        <p className="text-sm text-luxe-muted mt-1">{g.pageSubtitle}</p>
      </div>

      {/* ═══ 連結設定（摺疊卡） ═══ */}
      <div
        data-tour="gcal-connection"
        className="bg-luxe-surface border border-luxe-gold/10 rounded-xl overflow-hidden"
      >
        <button
          type="button"
          data-tour="gcal-connection-toggle"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 text-left hover:bg-luxe-gold/5 transition-colors"
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-luxe-text">
              {c.connectionHeading}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${statusPill.cls}`}
            >
              {statusPill.label}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-luxe-muted shrink-0">
            <span className="hidden sm:inline">
              {panelOpen ? c.connectionCollapse : c.connectionExpand}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${panelOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>

        {panelOpen && (
          <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-luxe-gold/10 pt-5">
            <div data-tour="gcal-status">{renderStatusDetail()}</div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                data-tour="gcal-connect"
                onClick={handleConnect}
                disabled={statusLoading || disconnecting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {isLinked ? g.switchBtn : g.connectBtn}
              </button>

              <button
                data-tour="gcal-disconnect"
                onClick={handleDisconnect}
                disabled={!connected || statusLoading || disconnecting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {disconnecting ? (
                  <>
                    <span className="w-4 h-4 border border-t-transparent border-red-400 rounded-full animate-spin" />
                    {t.adminCommon.processing}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    {g.disconnectBtn}
                  </>
                )}
              </button>
            </div>

            {/* 共用帳號說明 */}
            <div data-tour="gcal-shared-note">
              <h3 className="text-sm font-medium text-luxe-text flex items-center gap-2 mb-2">
                <span>👥</span>
                {g.sharedHeading}
              </h3>
              <p className="text-sm text-luxe-muted leading-relaxed">{g.sharedBody}</p>
            </div>

            {/* 已啟用功能 */}
            <div data-tour="gcal-features">
              <h3 className="text-sm font-medium text-luxe-text flex items-center gap-2 mb-1">
                <span>✨</span>
                {g.featuresHeading}
              </h3>
              <p className="text-xs text-luxe-muted mb-3">{g.featuresHint}</p>
              <ul className="space-y-2">
                {g.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-luxe-muted"
                  >
                    <span className="text-luxe-gold mt-0.5 shrink-0">✓</span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 未連結引導 ═══ */}
      {mounted && !statusLoading && !isLinked && (
        <div className="bg-luxe-surface border border-luxe-gold/15 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-lg font-light text-luxe-text">{c.notConnectedTitle}</h2>
          <p className="text-sm text-luxe-muted mt-2 max-w-xl mx-auto leading-relaxed">
            {c.notConnectedBody}
          </p>
          <button
            onClick={handleConnect}
            className="mt-5 px-5 py-2.5 rounded-lg text-sm font-medium bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 transition-colors"
          >
            {c.notConnectedCta}
          </button>
        </div>
      )}

      {/* ═══ 日曆 ═══ */}
      {showCalendar && (
        <div className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-3 sm:p-5">
          {/* 動作列 */}
          <div
            data-tour="gcal-actions"
            className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4"
          >
            <button
              data-tour="gcal-new"
              onClick={handleNewClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 transition-colors"
            >
              <span className="text-base leading-none">＋</span>
              {c.newEventBtn}
            </button>
            <button
              data-tour="gcal-refresh"
              onClick={reload}
              disabled={eventsLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-luxe-gold/20 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">{c.refreshBtn}</span>
            </button>

            <span className="text-xs text-luxe-muted">
              {c.eventCount.replace("{n}", String(events.length))}
            </span>

            {/* 圖例 */}
            <div
              data-tour="gcal-legend"
              className="flex items-center gap-3 ml-auto text-xs text-luxe-muted"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-luxe-gold/25 border border-luxe-gold" />
                {c.legendBooking}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-luxe-gold/15 border border-luxe-gold/30" />
                {c.legendGeneral}
              </span>
            </div>
          </div>

          <p className="text-xs text-luxe-muted mb-3 leading-relaxed">
            {c.legendHint}
          </p>

          {/* 錯誤橫幅（日曆仍留在畫面上，重試不必重載整頁） */}
          {eventsError && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-400">{c.loadFailedTitle}</p>
                <p className="text-xs text-luxe-muted mt-0.5 break-words">
                  {eventsError}
                </p>
              </div>
              <button
                onClick={reload}
                className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                {c.retryBtn}
              </button>
            </div>
          )}

          {/* 日曆本體 + loading 遮罩 */}
          <div className="relative">
            <CalendarSurface
              ref={calRef}
              events={events}
              isMobile={isMobile}
              isZhTW={isZhTW}
              bookingBadgeLabel={c.bookingBadge}
              untitledLabel={c.untitled}
              onDatesSet={handleDatesSet}
              onSelect={handleSelect}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
            />
            {eventsLoading && (
              <div className="gcal-loading-overlay absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
                <span className="flex items-center gap-2 text-sm text-luxe-gold">
                  <span className="w-4 h-4 border border-t-transparent border-luxe-gold rounded-full animate-spin" />
                  {c.loadingEvents}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SSR / 尚未掛載時的骨架，避免 hydration 落差 */}
      {!mounted && (
        <div className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-8">
          <div className="h-72 rounded-lg bg-luxe-gold/5 animate-pulse" />
        </div>
      )}

      {/* ═══ 彈窗 ═══ */}
      <EventFormModal
        isOpen={formOpen}
        mode={formMode}
        initial={formInitial}
        lockAllDay={editing?.bookingId != null}
        submitting={submitting}
        onClose={closeForm}
        onSubmit={(payload) => void handleSubmit(payload)}
      />

      <EventDetailModal
        isOpen={detailOpen}
        event={detailEvent}
        deleting={deleting}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
        onDelete={(event) => void handleDelete(event)}
      />
    </div>
  );
};

export default AdminGoogleCalendar;
