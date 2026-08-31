/**
 * CoachDashboard — 教練儀表板（教練本人 / admin 可用）
 * @module pages/coach/CoachDashboard
 *
 * 四個 tab：
 *   🔔 待審核預約
 *   📅 全部預約
 *   ⚙️ 時段設定（週規則 + 休假）
 *   🔗 Google 日曆連結
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import type { Locale } from "date-fns";
import {
  bookingService,
  type CoachBookingRow,
  type BookingStatus,
} from "@/services/booking/booking.service";
import {
  coachService,
  type AvailabilityRule,
  type TimeOff,
  type CoachFullProfile,
  type GoogleStatus,
} from "@/services/booking/coach.service";
import { useCoachAccess } from "@/hooks/useCoachAccess";
import {
  PillButton,
  Input,
  Modal,
  Textarea,
  useDialog,
} from "@/components/ui";
import { Toggle } from "@/components/ui/form";
import { useLanguage } from "@/context/LanguageContext";
import type { AllTranslations } from "@/context/LanguageContext";

type TabType = "pending" | "all" | "schedule" | "google";

/** 週幾（索引 0 = 週日），文案走翻譯字典 */
const weekdayNames = (t: AllTranslations): string[] => [
  t.coachDash.sun,
  t.coachDash.mon,
  t.coachDash.tue,
  t.coachDash.wed,
  t.coachDash.thu,
  t.coachDash.fri,
  t.coachDash.sat,
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  completed: "bg-gold/15 text-gold border-gold/30",
};

const googleMessages = (t: AllTranslations): Record<string, string> => ({
  connected: t.coachDash.googleMsgConnected,
  denied: t.coachDash.googleMsgDenied,
  no_code: t.coachDash.googleMsgNoCode,
  bad_state: t.coachDash.googleMsgBadState,
  no_refresh: t.coachDash.googleMsgNoRefresh,
  error: t.coachDash.googleMsgError,
});

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const { canAccess, loading: accessLoading } = useCoachAccess();
  const { t, isZhTW } = useLanguage();
  const dfLocale = isZhTW ? zhTW : enUS;
  const WEEKDAYS = weekdayNames(t);
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<TabType>("pending");
  const [banner, setBanner] = useState<string | null>(null);

  // 權限檢查
  useEffect(() => {
    if (!accessLoading && !canAccess) {
      navigate("/", { replace: true });
    }
  }, [accessLoading, canAccess, navigate]);

  // Google callback 回來的訊息
  useEffect(() => {
    const g = searchParams.get("google");
    if (g) {
      setBanner(googleMessages(t)[g] || g);
      const sp = new URLSearchParams(searchParams);
      sp.delete("google");
      setSearchParams(sp, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  // ====== 預約 ======
  const [pendingList, setPendingList] = useState<CoachBookingRow[]>([]);
  const [allList, setAllList] = useState<CoachBookingRow[]>([]);
  const [reviewing, setReviewing] = useState<CoachBookingRow | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchPending = useCallback(() => {
    bookingService.getCoachPending().then(setPendingList).catch(console.error);
  }, []);
  const fetchAll = useCallback(() => {
    bookingService
      .getCoachAll()
      .then(setAllList)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    fetchPending();
    fetchAll();
  }, [canAccess, fetchPending, fetchAll]);

  const handleApprove = async () => {
    if (!reviewing) return;
    try {
      await bookingService.approve(reviewing.id, reviewNote);
      setReviewing(null);
      setReviewNote("");
      fetchPending();
      fetchAll();
    } catch (err) {
      console.error(err);
      await dialog.alert({
        title: t.coachDash.failedTitle,
        message: t.coachDash.approveFailed,
      });
    }
  };
  const handleReject = async () => {
    if (!reviewing) return;
    try {
      await bookingService.reject(reviewing.id, reviewNote);
      setReviewing(null);
      setReviewNote("");
      fetchPending();
      fetchAll();
    } catch (err) {
      console.error(err);
      await dialog.alert({
        title: t.coachDash.failedTitle,
        message: t.coachDash.rejectFailed,
      });
    }
  };
  const handleCoachCancel = async (b: CoachBookingRow) => {
    const ok = await dialog.confirm({
      title: t.myBookings.cancelTitle,
      message: t.coachDash.cancelBookingMessage.replace(
        "{name}",
        b.user?.display_name || b.user?.name || t.chatUi.userFallback,
      ),
      variant: "danger",
      confirmText: t.common.cancel,
    });
    if (!ok) return;
    await bookingService.coachCancel(b.id);
    fetchAll();
    fetchPending();
  };

  // ====== 時段設定 ======
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [ruleModal, setRuleModal] = useState<null | {
    editing?: AvailabilityRule;
    weekday: number;
    startTime: string;
    endTime: string;
  }>(null);
  const [timeOffModal, setTimeOffModal] = useState<null | {
    startAt: string;
    endAt: string;
    reason: string;
  }>(null);

  const fetchRules = useCallback(() => {
    coachService.getAvailability().then(setRules).catch(console.error);
  }, []);
  const fetchTimeOffs = useCallback(() => {
    coachService.getTimeOff().then(setTimeOffs).catch(console.error);
  }, []);
  useEffect(() => {
    if (!canAccess) return;
    fetchRules();
    fetchTimeOffs();
  }, [canAccess, fetchRules, fetchTimeOffs]);

  const saveRule = async () => {
    if (!ruleModal) return;
    try {
      if (ruleModal.editing) {
        await coachService.updateAvailability(ruleModal.editing.id, {
          weekday: ruleModal.weekday,
          startTime: ruleModal.startTime,
          endTime: ruleModal.endTime,
        });
      } else {
        await coachService.createAvailability({
          weekday: ruleModal.weekday,
          startTime: ruleModal.startTime,
          endTime: ruleModal.endTime,
        });
      }
      setRuleModal(null);
      fetchRules();
    } catch (err) {
      console.error(err);
      await dialog.alert({
        title: t.coachDash.failedTitle,
        message: t.coachDash.saveFailed,
      });
    }
  };
  const deleteRule = async (r: AvailabilityRule) => {
    const ok = await dialog.confirm({
      title: t.coachDash.deleteRuleTitle,
      message: `${WEEKDAYS[r.weekday]} ${String(r.start_time).slice(0, 5)}-${String(r.end_time).slice(0, 5)}`,
      variant: "danger",
      confirmText: t.common.delete,
    });
    if (!ok) return;
    await coachService.deleteAvailability(r.id);
    fetchRules();
  };

  const saveTimeOff = async () => {
    if (!timeOffModal) return;
    try {
      await coachService.createTimeOff({
        startAt: new Date(timeOffModal.startAt).toISOString(),
        endAt: new Date(timeOffModal.endAt).toISOString(),
        reason: timeOffModal.reason,
      });
      setTimeOffModal(null);
      fetchTimeOffs();
    } catch (err) {
      console.error(err);
      await dialog.alert({
        title: t.coachDash.failedTitle,
        message: t.coachDash.addTimeOffFailed,
      });
    }
  };
  const deleteTimeOff = async (off: TimeOff) => {
    const ok = await dialog.confirm({
      title: t.coachDash.deleteTimeOffTitle,
      message: off.reason || t.coachDash.thisTimeOff,
      variant: "danger",
      confirmText: t.common.delete,
    });
    if (!ok) return;
    await coachService.deleteTimeOff(off.id);
    fetchTimeOffs();
  };

  // ====== Profile 設定 ======
  const [profile, setProfile] = useState<CoachFullProfile | null>(null);
  useEffect(() => {
    if (!canAccess) return;
    coachService.getFullProfile().then(setProfile).catch(console.error);
  }, [canAccess]);
  const saveProfile = async (patch: Partial<CoachFullProfile>) => {
    if (!profile) return;
    try {
      const updated = await coachService.updateProfile({
        displayName: patch.display_name,
        defaultSlotMinutes: patch.default_slot_minutes,
        bufferMinutes: patch.buffer_minutes,
        bookingNoticeHours: patch.booking_notice_hours,
        bookingWindowDays: patch.booking_window_days,
        cancellationHours: patch.cancellation_hours,
        isActive: patch.is_active,
      });
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // ====== Google ======
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const refreshGoogleStatus = useCallback(() => {
    coachService.getGoogleStatus().then(setGoogleStatus).catch(console.error);
  }, []);
  useEffect(() => {
    if (!canAccess) return;
    refreshGoogleStatus();
  }, [canAccess, refreshGoogleStatus]);

  if (accessLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">
        {t.common.loading}
      </div>
    );
  }
  if (!canAccess) {
    return null;
  }

  // 權限確認完成前不渲染內容（route 只有 RequireAuth，避免未授權內容閃現）
  if (accessLoading || !canAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" aria-label="loading" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-inherit">
            {t.coachDash.heading}
          </h1>
          <p className="text-sm text-muted mt-1">
            {profile?.display_name} · {t.coachDash.subtitle}
          </p>
        </div>
      </div>

      {banner && (
        <div className="mb-4 p-3 bg-gold/10 border border-gold/30 rounded-lg text-sm text-inherit flex items-center justify-between">
          <span>{banner}</span>
          <button
            className="text-muted hover:text-inherit"
            onClick={() => setBanner(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div data-tour="coach-tabs" className="flex flex-wrap gap-2 mb-6">
        {[
          {
            k: "pending",
            label: t.coachDash.tabPending.replace(
              "{count}",
              String(pendingList.length),
            ),
          },
          { k: "all", label: t.coachDash.tabAll },
          { k: "schedule", label: t.coachDash.tabSchedule },
          { k: "google", label: t.coachDash.tabGoogle },
        ].map((tb) => (
          <button
            key={tb.k}
            data-tour={`coach-tab-${tb.k}`}
            onClick={() => setTab(tb.k as TabType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tb.k
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-muted hover:text-inherit hover:bg-surface"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        <div data-tour="coach-pending-list" className="space-y-3">
          {pendingList.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {t.coachDash.noPending}
            </div>
          ) : (
            pendingList.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                t={t}
                dfLocale={dfLocale}
                onOpen={() => {
                  setReviewing(b);
                  setReviewNote("");
                }}
              />
            ))
          )}
        </div>
      )}

      {/* All Tab */}
      {tab === "all" && (
        <div className="space-y-3">
          {allList.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {t.coachDash.noBookings}
            </div>
          ) : (
            allList.map((b) => (
              <div
                key={b.id}
                className="bg-surface rounded-lg border border-gold/10 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-inherit font-medium">
                        {b.user?.display_name ||
                          b.user?.name ||
                          t.coachDash.anonymous}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}
                      >
                        {t.bookingStatus[b.status]}
                      </span>
                      {b.google_event_id && (
                        <span className="text-xs text-muted">
                          {t.coachDash.syncedWithGoogle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {format(new Date(b.start_at), "yyyy/MM/dd (EEE) HH:mm", {
                        locale: dfLocale,
                      })}{" "}
                      -{" "}
                      {format(new Date(b.end_at), "HH:mm", {
                        locale: dfLocale,
                      })}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {b.contact_email || "—"} · {b.contact_phone || "—"}
                    </p>
                    {b.user_note && (
                      <p className="text-sm text-inherit/80 mt-2">
                        {b.user_note}
                      </p>
                    )}
                    {b.coach_note && (
                      <p className="text-xs text-gold/70 mt-1">
                        {t.coachDash.noteLabel}
                        {b.coach_note}
                      </p>
                    )}
                  </div>
                  {["pending", "confirmed"].includes(b.status) && (
                    <button
                      onClick={() => handleCoachCancel(b)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      {t.common.cancel}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {tab === "schedule" && (
        <div data-tour="coach-schedule-panel" className="space-y-8">
          {/* Profile 設定 */}
          {profile && (
            <section
              data-tour="coach-profile-settings"
              className="bg-surface rounded-lg border border-gold/15 p-4"
            >
              <h2 className="text-inherit font-medium mb-3">
                {t.coachDash.basicSettings}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t.member.displayName}
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  onBlur={() => saveProfile({ display_name: profile.display_name })}
                  theme="luxe"
                />
                <Input
                  label={t.coachDash.slotMinutes}
                  type="number"
                  value={profile.default_slot_minutes}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      default_slot_minutes: Number(e.target.value),
                    })
                  }
                  onBlur={() =>
                    saveProfile({
                      default_slot_minutes: profile.default_slot_minutes,
                    })
                  }
                  theme="luxe"
                />
                <Input
                  label={t.coachDash.noticeHours}
                  type="number"
                  value={profile.booking_notice_hours}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      booking_notice_hours: Number(e.target.value),
                    })
                  }
                  onBlur={() =>
                    saveProfile({
                      booking_notice_hours: profile.booking_notice_hours,
                    })
                  }
                  theme="luxe"
                />
                <Input
                  label={t.coachDash.windowDays}
                  type="number"
                  value={profile.booking_window_days}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      booking_window_days: Number(e.target.value),
                    })
                  }
                  onBlur={() =>
                    saveProfile({
                      booking_window_days: profile.booking_window_days,
                    })
                  }
                  theme="luxe"
                />
                <Input
                  label={t.coachDash.cancellationHours}
                  type="number"
                  value={profile.cancellation_hours}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      cancellation_hours: Number(e.target.value),
                    })
                  }
                  onBlur={() =>
                    saveProfile({
                      cancellation_hours: profile.cancellation_hours,
                    })
                  }
                  theme="luxe"
                />
                <div className="flex items-end gap-2">
                  <Toggle
                    theme="luxe"
                    checked={profile.is_active}
                    onChange={(v) => {
                      setProfile({ ...profile, is_active: v });
                      saveProfile({ is_active: v });
                    }}
                  />
                  <span className="text-sm text-inherit">
                    {profile.is_active
                      ? t.coachDash.bookingOpen
                      : t.coachDash.bookingPaused}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted mt-2">
                {t.coachDash.autoSaveHint}
              </p>
            </section>
          )}

          {/* 每週規則 */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gold/15">
              <h2 className="text-inherit font-medium">
                {t.coachDash.weeklySlots}
              </h2>
              <PillButton
                data-tour="coach-add-rule"
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRuleModal({
                    weekday: 1,
                    startTime: "14:00",
                    endTime: "18:00",
                  })
                }
              >
                {t.coachDash.addRule}
              </PillButton>
            </div>
            <div className="space-y-2">
              {rules.length === 0 && (
                <p className="text-sm text-muted text-center py-6">
                  {t.coachDash.noRules}
                </p>
              )}
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface rounded-lg border border-gold/10 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gold text-sm font-medium">
                      {WEEKDAYS[r.weekday]}
                    </span>
                    <span className="text-inherit text-sm">
                      {String(r.start_time).slice(0, 5)} —{" "}
                      {String(r.end_time).slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PillButton
                      theme="luxe"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRuleModal({
                          editing: r,
                          weekday: r.weekday,
                          startTime: String(r.start_time).slice(0, 5),
                          endTime: String(r.end_time).slice(0, 5),
                        })
                      }
                    >
                      {t.common.edit}
                    </PillButton>
                    <button
                      onClick={() => deleteRule(r)}
                      className="text-red-400 hover:text-red-300 text-sm px-1"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 休假 */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gold/15">
              <h2 className="text-inherit font-medium">{t.coachDash.timeOff}</h2>
              <PillButton
                data-tour="coach-add-timeoff"
                theme="luxe"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1,
                    0,
                    0,
                  );
                  const end = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1,
                    23,
                    59,
                  );
                  const fmt = (d: Date) =>
                    d.toISOString().slice(0, 16);
                  setTimeOffModal({
                    startAt: fmt(start),
                    endAt: fmt(end),
                    reason: "",
                  });
                }}
              >
                {t.coachDash.addTimeOff}
              </PillButton>
            </div>
            <div className="space-y-2">
              {timeOffs.length === 0 && (
                <p className="text-sm text-muted text-center py-6">
                  {t.coachDash.noTimeOff}
                </p>
              )}
              {timeOffs.map((off) => (
                <div
                  key={off.id}
                  className="bg-surface rounded-lg border border-gold/10 p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-inherit text-sm">
                      {format(new Date(off.start_at), "yyyy/MM/dd HH:mm", {
                        locale: dfLocale,
                      })}{" "}
                      —{" "}
                      {format(new Date(off.end_at), "yyyy/MM/dd HH:mm", {
                        locale: dfLocale,
                      })}
                    </p>
                    {off.reason && (
                      <p className="text-xs text-muted mt-1">{off.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTimeOff(off)}
                    className="text-red-400 hover:text-red-300 text-sm px-1"
                  >
                    {t.common.delete}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Google Tab */}
      {tab === "google" && (
        <section
          data-tour="coach-google-panel"
          className="bg-surface rounded-lg border border-gold/15 p-6 max-w-xl"
        >
          <h2 className="text-inherit font-medium mb-3">
            {t.coachDash.googleSyncTitle}
          </h2>
          <p className="text-sm text-muted mb-4">{t.coachDash.googleSyncDesc}</p>
          <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg mb-4">
            <p className="text-sm text-inherit">
              {t.coachDash.statusLabel}
              {googleStatus?.connected ? (
                googleStatus.valid ? (
                  <span className="text-emerald-400 ml-1">
                    {t.coachDash.googleConnected}
                  </span>
                ) : (
                  <span className="text-amber-400 ml-1">
                    {t.coachDash.googleTokenExpired}
                  </span>
                )
              ) : (
                <span className="text-muted ml-1">
                  {t.coachDash.googleNotConnected}
                </span>
              )}
            </p>
            {googleStatus?.calendarId && (
              <p className="text-xs text-muted mt-1">
                Calendar ID: {googleStatus.calendarId}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <a
              href={coachService.getGoogleConnectUrl()}
              className="inline-block"
            >
              <PillButton theme="luxe" variant="filled">
                {googleStatus?.connected
                  ? t.coachDash.reconnect
                  : t.coachDash.connectGoogle}
              </PillButton>
            </a>
            {googleStatus?.connected && (
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={async () => {
                  await coachService.disconnectGoogle();
                  refreshGoogleStatus();
                }}
              >
                {t.coachDash.disconnect}
              </PillButton>
            )}
          </div>
        </section>
      )}

      {/* ===== Review Modal (pending booking) ===== */}
      <Modal
        isOpen={!!reviewing}
        onClose={() => setReviewing(null)}
        title={t.coachDash.reviewTitle}
        theme="luxe"
        size="lg"
        tourId="coach-review"
      >
        {reviewing && (
          <div className="space-y-4">
            <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg">
              <p className="text-inherit">
                <span className="text-muted text-sm">{t.coachDash.userLabel}</span>
                {reviewing.user?.display_name || reviewing.user?.name}
              </p>
              <p className="text-inherit text-sm mt-1">
                <span className="text-muted">{t.bookingPage.slotLabel}</span>
                {format(
                  new Date(reviewing.start_at),
                  "yyyy/MM/dd (EEE) HH:mm",
                  { locale: dfLocale },
                )}{" "}
                -{" "}
                {format(new Date(reviewing.end_at), "HH:mm", {
                  locale: dfLocale,
                })}
              </p>
              <p className="text-muted text-xs mt-1">
                {t.coachDash.contactLabel}
                {reviewing.contact_email || "—"} ·{" "}
                {reviewing.contact_phone || "—"}
              </p>
              {reviewing.course && (
                <p className="text-muted text-xs mt-1">
                  📚 {reviewing.course.course_title}
                </p>
              )}
              {reviewing.user_note && (
                <p className="text-inherit text-sm mt-2 whitespace-pre-wrap">
                  {reviewing.user_note}
                </p>
              )}
            </div>
            <Textarea
              data-tour="coach-review-note"
              label={t.coachDash.reviewNoteLabel}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={t.coachDash.reviewNotePlaceholder}
              theme="luxe"
              rows={3}
            />
            <div
              data-tour="coach-review-actions"
              className="flex justify-end gap-3 pt-2 border-t border-gold/10"
            >
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setReviewing(null)}
              >
                {t.common.back}
              </PillButton>
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={handleReject}
              >
                {t.coachDash.reject}
              </PillButton>
              <PillButton
                theme="luxe"
                variant="filled"
                onClick={handleApprove}
              >
                {t.coachDash.approveAndSync}
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Availability rule modal ===== */}
      <Modal
        isOpen={!!ruleModal}
        onClose={() => setRuleModal(null)}
        title={
          ruleModal?.editing
            ? t.coachDash.editRuleTitle
            : t.coachDash.newRuleTitle
        }
        theme="luxe"
        size="lg"
      >
        {ruleModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">
                {t.coachDash.weekdayLabel}
              </label>
              <select
                value={ruleModal.weekday}
                onChange={(e) =>
                  setRuleModal({
                    ...ruleModal,
                    weekday: Number(e.target.value),
                  })
                }
                className="coach-booking-select studio-input w-full rounded-lg px-4 py-3 cursor-pointer"
              >
                {WEEKDAYS.map((w, i) => (
                  <option key={i} value={i}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t.coachDash.startLabel}
                type="time"
                value={ruleModal.startTime}
                onChange={(e) =>
                  setRuleModal({ ...ruleModal, startTime: e.target.value })
                }
                theme="luxe"
              />
              <Input
                label={t.coachDash.endLabel}
                type="time"
                value={ruleModal.endTime}
                onChange={(e) =>
                  setRuleModal({ ...ruleModal, endTime: e.target.value })
                }
                theme="luxe"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setRuleModal(null)}
              >
                {t.common.cancel}
              </PillButton>
              <PillButton theme="luxe" variant="filled" onClick={saveRule}>
                {t.common.save}
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Time off modal ===== */}
      <Modal
        isOpen={!!timeOffModal}
        onClose={() => setTimeOffModal(null)}
        title={t.coachDash.addTimeOffTitle}
        theme="luxe"
        size="lg"
      >
        {timeOffModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">
                  {t.coachDash.startTimeLabel}
                </label>
                <input
                  type="datetime-local"
                  value={timeOffModal.startAt}
                  onChange={(e) =>
                    setTimeOffModal({
                      ...timeOffModal,
                      startAt: e.target.value,
                    })
                  }
                  className="studio-input w-full rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">
                  {t.coachDash.endTimeLabel}
                </label>
                <input
                  type="datetime-local"
                  value={timeOffModal.endAt}
                  onChange={(e) =>
                    setTimeOffModal({ ...timeOffModal, endAt: e.target.value })
                  }
                  className="studio-input w-full rounded-lg px-4 py-3"
                />
              </div>
            </div>
            <Input
              label={t.coachDash.reasonLabel}
              value={timeOffModal.reason}
              onChange={(e) =>
                setTimeOffModal({ ...timeOffModal, reason: e.target.value })
              }
              placeholder={t.coachDash.reasonPlaceholder}
              theme="luxe"
            />
            <div className="flex justify-end gap-3 pt-2">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setTimeOffModal(null)}
              >
                {t.common.cancel}
              </PillButton>
              <PillButton theme="luxe" variant="filled" onClick={saveTimeOff}>
                {t.common.create}
              </PillButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/** 待審核卡片 */
const BookingCard: React.FC<{
  b: CoachBookingRow;
  t: AllTranslations;
  dfLocale: Locale;
  onOpen: () => void;
}> = ({ b, t, dfLocale, onOpen }) => (
  <div
    data-tour="coach-pending-card"
    onClick={onOpen}
    className="bg-surface rounded-lg border border-gold/15 p-4 cursor-pointer hover:border-gold/40 transition-colors"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-inherit font-medium">
            {b.user?.display_name || b.user?.name || t.coachDash.anonymous}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}
          >
            {t.bookingStatus[b.status]}
          </span>
        </div>
        <p className="text-sm text-muted">
          {format(new Date(b.start_at), "yyyy/MM/dd (EEE) HH:mm", {
            locale: dfLocale,
          })}
          {" - "}
          {format(new Date(b.end_at), "HH:mm", { locale: dfLocale })}
        </p>
        {b.user_note && (
          <p className="text-sm text-inherit/80 mt-2 line-clamp-2">
            {b.user_note}
          </p>
        )}
      </div>
      <span className="text-gold text-xs">{t.coachDash.tapToReview}</span>
    </div>
  </div>
);

export default CoachDashboard;
