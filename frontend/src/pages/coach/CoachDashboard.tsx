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
import { zhTW } from "date-fns/locale";
import {
  bookingService,
  BOOKING_STATUS_LABEL,
  type CoachBookingRow,
  type BookingStatus,
} from "@/services/booking.service";
import {
  coachService,
  type AvailabilityRule,
  type TimeOff,
  type CoachFullProfile,
  type GoogleStatus,
} from "@/services/coach.service";
import { useCoachAccess } from "@/hooks/useCoachAccess";
import {
  PillButton,
  Input,
  Modal,
  Textarea,
  useDialog,
} from "@/components/ui";
import { Toggle } from "@/components/ui/form";

type TabType = "pending" | "all" | "schedule" | "google";

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  completed: "bg-gold/15 text-gold border-gold/30",
};

const GOOGLE_MSG: Record<string, string> = {
  connected: "✅ Google 日曆已連結",
  denied: "❌ 已拒絕授權",
  no_code: "❌ 授權流程異常（缺少 code）",
  bad_state: "❌ 授權狀態不匹配，請重試",
  no_refresh: "⚠️ Google 未回傳 refresh_token，請到 Google 帳號設定撤銷此應用後再試",
  error: "❌ 授權失敗，請稍後再試",
};

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const { canAccess, loading: accessLoading } = useCoachAccess();
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
      setBanner(GOOGLE_MSG[g] || g);
      const sp = new URLSearchParams(searchParams);
      sp.delete("google");
      setSearchParams(sp, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      await dialog.alert({ title: "失敗", message: "批准失敗" });
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
      await dialog.alert({ title: "失敗", message: "拒絕失敗" });
    }
  };
  const handleCoachCancel = async (b: CoachBookingRow) => {
    const ok = await dialog.confirm({
      title: "取消預約",
      message: `確定要取消 ${b.user?.display_name || b.user?.name || "用戶"} 的預約？`,
      variant: "danger",
      confirmText: "取消",
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
      await dialog.alert({ title: "失敗", message: "儲存失敗" });
    }
  };
  const deleteRule = async (r: AvailabilityRule) => {
    const ok = await dialog.confirm({
      title: "刪除規則",
      message: `${WEEKDAYS[r.weekday]} ${String(r.start_time).slice(0, 5)}-${String(r.end_time).slice(0, 5)}`,
      variant: "danger",
      confirmText: "刪除",
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
      await dialog.alert({ title: "失敗", message: "新增休假失敗" });
    }
  };
  const deleteTimeOff = async (t: TimeOff) => {
    const ok = await dialog.confirm({
      title: "刪除休假",
      message: t.reason || "此休假",
      variant: "danger",
      confirmText: "刪除",
    });
    if (!ok) return;
    await coachService.deleteTimeOff(t.id);
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
        載入中...
      </div>
    );
  }
  if (!canAccess) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-inherit">
            教練儀表板
          </h1>
          <p className="text-sm text-muted mt-1">
            {profile?.display_name} · 管理預約、時段與 Google 日曆整合
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
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { k: "pending", label: `🔔 待審核 (${pendingList.length})` },
          { k: "all", label: "📅 全部預約" },
          { k: "schedule", label: "⚙️ 時段設定" },
          { k: "google", label: "🔗 Google 日曆" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as TabType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.k
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-muted hover:text-inherit hover:bg-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        <div className="space-y-3">
          {pendingList.length === 0 ? (
            <div className="text-center py-12 text-muted">
              沒有待審核的預約
            </div>
          ) : (
            pendingList.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
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
              尚無預約紀錄
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
                        {b.user?.display_name || b.user?.name || "(匿名)"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}
                      >
                        {BOOKING_STATUS_LABEL[b.status]}
                      </span>
                      {b.google_event_id && (
                        <span className="text-xs text-muted">
                          🔗 已同步 Google
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {format(new Date(b.start_at), "yyyy/MM/dd (EEE) HH:mm", {
                        locale: zhTW,
                      })}{" "}
                      - {format(new Date(b.end_at), "HH:mm", { locale: zhTW })}
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
                        批註：{b.coach_note}
                      </p>
                    )}
                  </div>
                  {["pending", "confirmed"].includes(b.status) && (
                    <button
                      onClick={() => handleCoachCancel(b)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      取消
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
        <div className="space-y-8">
          {/* Profile 設定 */}
          {profile && (
            <section className="bg-surface rounded-lg border border-gold/15 p-4">
              <h2 className="text-inherit font-medium mb-3">基本設定</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="顯示名稱"
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  onBlur={() => saveProfile({ display_name: profile.display_name })}
                  theme="luxe"
                />
                <Input
                  label="諮詢時長（分鐘）"
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
                  label="前置時間（小時）"
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
                  label="可訂範圍（天）"
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
                  label="取消時效（小時）"
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
                    {profile.is_active ? "✅ 開放預約" : "⏸ 暫停預約"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted mt-2">
                修改後失焦（離開欄位）自動儲存
              </p>
            </section>
          )}

          {/* 每週規則 */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gold/15">
              <h2 className="text-inherit font-medium">每週可預約時段</h2>
              <PillButton
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
                + 新增規則
              </PillButton>
            </div>
            <div className="space-y-2">
              {rules.length === 0 && (
                <p className="text-sm text-muted text-center py-6">
                  尚無規則，點右上「新增規則」開始
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
                      編輯
                    </PillButton>
                    <button
                      onClick={() => deleteRule(r)}
                      className="text-red-400 hover:text-red-300 text-sm px-1"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 休假 */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gold/15">
              <h2 className="text-inherit font-medium">休假區間</h2>
              <PillButton
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
                + 新增休假
              </PillButton>
            </div>
            <div className="space-y-2">
              {timeOffs.length === 0 && (
                <p className="text-sm text-muted text-center py-6">
                  未來無休假安排
                </p>
              )}
              {timeOffs.map((t) => (
                <div
                  key={t.id}
                  className="bg-surface rounded-lg border border-gold/10 p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-inherit text-sm">
                      {format(new Date(t.start_at), "yyyy/MM/dd HH:mm", {
                        locale: zhTW,
                      })}{" "}
                      —{" "}
                      {format(new Date(t.end_at), "yyyy/MM/dd HH:mm", {
                        locale: zhTW,
                      })}
                    </p>
                    {t.reason && (
                      <p className="text-xs text-muted mt-1">{t.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTimeOff(t)}
                    className="text-red-400 hover:text-red-300 text-sm px-1"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Google Tab */}
      {tab === "google" && (
        <section className="bg-surface rounded-lg border border-gold/15 p-6 max-w-xl">
          <h2 className="text-inherit font-medium mb-3">Google 日曆同步</h2>
          <p className="text-sm text-muted mb-4">
            連結後，可預約時段會自動避開你 Google 日曆中已有的行程；批准預約時也會自動在日曆建立事件。
          </p>
          <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg mb-4">
            <p className="text-sm text-inherit">
              狀態：
              {googleStatus?.connected ? (
                googleStatus.valid ? (
                  <span className="text-emerald-400 ml-1">
                    ✅ 已連結（Token 有效）
                  </span>
                ) : (
                  <span className="text-amber-400 ml-1">
                    ⚠️ 已連結但 Token 失效，請重新連結
                  </span>
                )
              ) : (
                <span className="text-muted ml-1">⚪ 未連結</span>
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
                {googleStatus?.connected ? "重新連結" : "連結 Google 日曆"}
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
                解除連結
              </PillButton>
            )}
          </div>
        </section>
      )}

      {/* ===== Review Modal (pending booking) ===== */}
      <Modal
        isOpen={!!reviewing}
        onClose={() => setReviewing(null)}
        title="審核預約"
        theme="luxe"
        size="lg"
      >
        {reviewing && (
          <div className="space-y-4">
            <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg">
              <p className="text-inherit">
                <span className="text-muted text-sm">用戶：</span>
                {reviewing.user?.display_name || reviewing.user?.name}
              </p>
              <p className="text-inherit text-sm mt-1">
                <span className="text-muted">時段：</span>
                {format(
                  new Date(reviewing.start_at),
                  "yyyy/MM/dd (EEE) HH:mm",
                  { locale: zhTW },
                )}{" "}
                -{" "}
                {format(new Date(reviewing.end_at), "HH:mm", { locale: zhTW })}
              </p>
              <p className="text-muted text-xs mt-1">
                聯絡：{reviewing.contact_email || "—"} · {reviewing.contact_phone || "—"}
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
              label="批註（選填，拒絕時建議說明理由）"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="例：時段調整為下週三 14:00 / 很抱歉該時段臨時有事"
              theme="luxe"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-gold/10">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setReviewing(null)}
              >
                返回
              </PillButton>
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={handleReject}
              >
                拒絕
              </PillButton>
              <PillButton
                theme="luxe"
                variant="filled"
                onClick={handleApprove}
              >
                批准 + 同步 Google
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Availability rule modal ===== */}
      <Modal
        isOpen={!!ruleModal}
        onClose={() => setRuleModal(null)}
        title={ruleModal?.editing ? "編輯規則" : "新增規則"}
        theme="luxe"
        size="lg"
      >
        {ruleModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">週幾</label>
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
                label="開始"
                type="time"
                value={ruleModal.startTime}
                onChange={(e) =>
                  setRuleModal({ ...ruleModal, startTime: e.target.value })
                }
                theme="luxe"
              />
              <Input
                label="結束"
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
                取消
              </PillButton>
              <PillButton theme="luxe" variant="filled" onClick={saveRule}>
                儲存
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Time off modal ===== */}
      <Modal
        isOpen={!!timeOffModal}
        onClose={() => setTimeOffModal(null)}
        title="新增休假"
        theme="luxe"
        size="lg"
      >
        {timeOffModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">
                  開始時間
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
                  結束時間
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
              label="備註（選填）"
              value={timeOffModal.reason}
              onChange={(e) =>
                setTimeOffModal({ ...timeOffModal, reason: e.target.value })
              }
              placeholder="例如：連假、出國、受訓"
              theme="luxe"
            />
            <div className="flex justify-end gap-3 pt-2">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setTimeOffModal(null)}
              >
                取消
              </PillButton>
              <PillButton theme="luxe" variant="filled" onClick={saveTimeOff}>
                新增
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
  onOpen: () => void;
}> = ({ b, onOpen }) => (
  <div
    onClick={onOpen}
    className="bg-surface rounded-lg border border-gold/15 p-4 cursor-pointer hover:border-gold/40 transition-colors"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-inherit font-medium">
            {b.user?.display_name || b.user?.name || "(匿名)"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>
            {BOOKING_STATUS_LABEL[b.status]}
          </span>
        </div>
        <p className="text-sm text-muted">
          {format(new Date(b.start_at), "yyyy/MM/dd (EEE) HH:mm", {
            locale: zhTW,
          })}
          {" - "}
          {format(new Date(b.end_at), "HH:mm", { locale: zhTW })}
        </p>
        {b.user_note && (
          <p className="text-sm text-inherit/80 mt-2 line-clamp-2">
            {b.user_note}
          </p>
        )}
      </div>
      <span className="text-gold text-xs">點擊審核 →</span>
    </div>
  </div>
);

export default CoachDashboard;
