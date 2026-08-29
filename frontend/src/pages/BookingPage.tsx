/**
 * BookingPage — 諮詢時間預約頁
 * @module pages/BookingPage
 *
 * 流程：
 *   1. 載入教練 profile + 下 N 天可用 slot
 *   2. 用戶點月曆某天 → 右側顯示該日可選時段
 *   3. 點時段 → 開 modal（課程選填 + 訊息 + 聯絡方式）
 *   4. 送出 → 顯示「等待教練確認」
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addDays, startOfToday } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import {
  bookingService,
  type AvailableSlot,
} from "@/services/booking/booking.service";
import {
  coachService,
  type CoachPublicProfile,
} from "@/services/booking/coach.service";
import { courseService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  PillButton,
  Input,
  Textarea,
  Modal,
  useDialog,
} from "@/components/ui";

interface CourseLite {
  course_id: number;
  course_title: string;
}

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dialog = useDialog();
  const { t, isZhTW } = useLanguage();
  const dfLocale = isZhTW ? zhTW : enUS;

  const [profile, setProfile] = useState<CoachPublicProfile | null>(null);
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [pickedSlot, setPickedSlot] = useState<AvailableSlot | null>(null);

  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [form, setForm] = useState({
    courseId: "",
    userNote: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [saving, setSaving] = useState(false);

  // 載教練資料 + 未來 N 天 slot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const p = await coachService.getProfile();
        if (cancelled) return;
        setProfile(p);

        const fromYmd = format(startOfToday(), "yyyy-MM-dd");
        const toYmd = format(
          addDays(startOfToday(), p.booking_window_days),
          "yyyy-MM-dd",
        );
        const slots = await bookingService.getSlots(fromYmd, toYmd);
        if (!cancelled) setAllSlots(slots);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(t.bookingPage.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 載入課程清單（帶入預約用）
  useEffect(() => {
    courseService
      .getAll()
      .then((list) => {
        const rows = (Array.isArray(list) ? list : []) as unknown as Array<{
          course_id: number;
          course_title: string;
          status?: string;
        }>;
        setCourses(
          rows
            .filter((c) => !c.status || c.status === "published")
            .map((c) => ({
              course_id: c.course_id,
              course_title: c.course_title,
            })),
        );
      })
      .catch(() => setCourses([]));
  }, []);

  // 預填表單聯絡方式
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      contactEmail: user.email || "",
      contactPhone: user.phone_number || "",
    }));
  }, [user]);

  // 有 slot 的天數（醒目顯示）
  const daysWithSlots = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSlots) set.add(s.localDate);
    return Array.from(set).map((d) => new Date(`${d}T00:00:00+08:00`));
  }, [allSlots]);

  // 選中日的時段
  const dayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : "";
  const slotsOfDay = useMemo(
    () => allSlots.filter((s) => s.localDate === dayKey),
    [allSlots, dayKey],
  );

  const openSubmitModal = (slot: AvailableSlot) => {
    setPickedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!pickedSlot) return;
    if (!form.contactEmail && !form.contactPhone) {
      setError(t.bookingPage.contactRequired);
      return;
    }
    try {
      setSaving(true);
      await bookingService.create({
        startAt: pickedSlot.startIso,
        endAt: pickedSlot.endIso,
        courseId: form.courseId ? Number(form.courseId) : null,
        userNote: form.userNote,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
      });
      setPickedSlot(null);
      await dialog.alert({
        title: t.bookingPage.submitSuccessTitle,
        message: t.bookingPage.submitSuccessMessage,
      });
      navigate("/my-bookings");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : t.bookingPage.submitFailed;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">
        {t.common.loading}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">
        {t.bookingPage.coachUnavailable}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8" data-tour="booking-header">
        <h1 className="text-2xl sm:text-3xl font-light text-inherit mb-2">
          {t.bookingPage.heading.replace("{coach}", profile.display_name)}
        </h1>
        <p className="text-sm text-muted">
          {t.bookingPage.meta
            .replace("{minutes}", String(profile.default_slot_minutes))
            .replace("{timezone}", profile.timezone)
            .replace("{noticeHours}", String(profile.booking_notice_hours))
            .replace("{windowDays}", String(profile.booking_window_days))}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
          <button
            className="ml-2 text-red-300 hover:text-red-100"
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* 內容：左月曆 / 右時段 */}
      <div className="grid lg:grid-cols-2 gap-6 bg-surface/40 rounded-xl border border-gold/15 p-4 sm:p-6">
        {/* 月曆 */}
        <div data-tour="booking-calendar">
          <DayPicker
            mode="single"
            locale={dfLocale}
            selected={selectedDay}
            onSelect={setSelectedDay}
            disabled={[
              { before: startOfToday() },
              (day) =>
                !daysWithSlots.some(
                  (d) => format(d, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
                ),
            ]}
            modifiers={{ hasSlots: daysWithSlots }}
            modifiersClassNames={{
              hasSlots: "coach-booking-has-slots",
              selected: "coach-booking-selected",
            }}
            className="coach-booking-daypicker"
            fromDate={startOfToday()}
            toDate={addDays(startOfToday(), profile.booking_window_days)}
          />
          <p className="mt-3 text-xs text-muted">
            {t.bookingPage.calendarHint}
          </p>
        </div>

        {/* 時段 */}
        <div data-tour="booking-slots">
          <h3 className="text-inherit font-medium mb-3">
            {selectedDay
              ? t.bookingPage.slotsForDay.replace(
                  "{date}",
                  format(selectedDay, t.bookingPage.dayHeadingFormat, {
                    locale: dfLocale,
                  }),
                )
              : t.bookingPage.pickDayFirst}
          </h3>
          {selectedDay && slotsOfDay.length === 0 && (
            <p className="text-sm text-muted">{t.bookingPage.noSlotsThatDay}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slotsOfDay.map((s) => (
              <button
                key={s.startIso}
                data-tour="booking-slot"
                onClick={() => openSubmitModal(s)}
                className="px-3 py-2 text-sm rounded-lg border border-gold/20 text-inherit hover:border-gold/50 hover:bg-gold/5 transition-colors"
              >
                {s.localTime}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted" data-tour="booking-my-link">
        {t.bookingPage.viewMyBookingsPrefix}{" "}
        <Link to="/my-bookings" className="text-gold hover:underline">
          {t.myBookings.heading}
        </Link>
      </div>

      {/* 送出預約 Modal */}
      <Modal
        isOpen={!!pickedSlot}
        onClose={() => setPickedSlot(null)}
        title={t.bookingPage.submitTitle}
        theme="luxe"
        size="lg"
        tourId="booking-submit"
      >
        {pickedSlot && (
          <div className="space-y-4">
            <div
              className="p-3 bg-gold/5 border border-gold/20 rounded-lg"
              data-tour="booking-form-slot"
            >
              <p className="text-inherit text-sm">
                {t.bookingPage.slotLabel}
                <span className="text-gold ml-1">
                  {pickedSlot.localDate} {pickedSlot.localTime}
                </span>
              </p>
              <p className="text-muted text-xs mt-1">
                {t.bookingPage.durationLabel.replace(
                  "{minutes}",
                  String(profile.default_slot_minutes),
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">
                {t.bookingPage.courseLabel}
              </label>
              <select
                data-tour="booking-form-course"
                value={form.courseId}
                onChange={(e) =>
                  setForm({ ...form, courseId: e.target.value })
                }
                className="coach-booking-select studio-input w-full rounded-lg px-4 py-3 cursor-pointer"
              >
                <option value="">{t.bookingPage.courseNone}</option>
                {courses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_title}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              data-tour="booking-form-note"
              label={t.bookingPage.noteLabel}
              value={form.userNote}
              onChange={(e) => setForm({ ...form, userNote: e.target.value })}
              placeholder={t.bookingPage.notePlaceholder}
              theme="luxe"
              rows={4}
            />

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              data-tour="booking-form-contact"
            >
              <Input
                label={t.bookingPage.contactEmailLabel}
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                placeholder={t.bookingPage.contactEmailPlaceholder}
                theme="luxe"
              />
              <Input
                label={t.bookingPage.contactPhoneLabel}
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
                placeholder={t.contact.phonePlaceholder}
                theme="luxe"
              />
            </div>
            <p className="text-xs text-muted">
              {t.bookingPage.contactHint}
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-gold/10">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setPickedSlot(null)}
              >
                {t.common.cancel}
              </PillButton>
              <PillButton
                theme="luxe"
                variant="filled"
                data-tour="booking-form-submit"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? t.bookingPage.submitting : t.bookingPage.submitTitle}
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* react-day-picker 客製樣式（跟著 theme 切換） */}
      <style>{`
        .coach-booking-daypicker {
          --rdp-accent-color: var(--color-gold);
          --rdp-background-color: color-mix(in srgb, var(--color-gold) 10%, transparent);
          color: inherit;
        }
        .coach-booking-daypicker .rdp-day { border-radius: 8px; }
        .coach-booking-daypicker .rdp-day_disabled { opacity: 0.25; }
        .coach-booking-daypicker .coach-booking-has-slots:not(.rdp-day_disabled) {
          color: var(--color-gold);
          font-weight: 600;
        }
        .coach-booking-daypicker .coach-booking-selected {
          background: color-mix(in srgb, var(--color-gold) 25%, transparent) !important;
          color: var(--color-gold) !important;
        }
        /* 下拉選單的 option 在不同瀏覽器行為不一，強制用主題色 */
        .coach-booking-select option {
          background: var(--color-surface);
          color: inherit;
        }
        [data-theme="studio-light"] .coach-booking-select option {
          background: #ffffff;
          color: #1a1a1a;
        }
      `}</style>
    </div>
  );
};

export default BookingPage;
