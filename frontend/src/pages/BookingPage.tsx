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
import { zhTW } from "date-fns/locale";
import {
  bookingService,
  type AvailableSlot,
} from "@/services/booking.service";
import {
  coachService,
  type CoachPublicProfile,
} from "@/services/coach.service";
import { courseService } from "@/services";
import { useAuth } from "@/context/AuthContext";
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
        if (!cancelled) setError("載入諮詢時段失敗");
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
      setError("請提供 email 或電話至少一項");
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
        title: "送出成功",
        message: "已送出預約申請，教練確認後會以 email 通知你。",
      });
      navigate("/my-bookings");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "送出預約失敗，請稍後再試";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-luxe-muted">
        載入中...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-luxe-muted">
        教練目前未開放預約
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-light text-luxe-text mb-2">
          預約 {profile.display_name} 的諮詢時間
        </h1>
        <p className="text-sm text-luxe-muted">
          每次諮詢 {profile.default_slot_minutes} 分鐘 · 時區{" "}
          {profile.timezone} · 最短 {profile.booking_notice_hours} 小時前預約
          · 最長 {profile.booking_window_days} 天內
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
      <div className="grid lg:grid-cols-2 gap-6 bg-luxe-surface/40 rounded-xl border border-luxe-gold/15 p-4 sm:p-6">
        {/* 月曆 */}
        <div>
          <DayPicker
            mode="single"
            locale={zhTW}
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
          <p className="mt-3 text-xs text-luxe-muted">
            🟢 亮色日期有可預約時段，點擊選擇日期
          </p>
        </div>

        {/* 時段 */}
        <div>
          <h3 className="text-luxe-text font-medium mb-3">
            {selectedDay
              ? `${format(selectedDay, "yyyy 年 MM 月 dd 日", { locale: zhTW })} 可預約時段`
              : "請先在左側選日期"}
          </h3>
          {selectedDay && slotsOfDay.length === 0 && (
            <p className="text-sm text-luxe-muted">該日無可預約時段</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slotsOfDay.map((s) => (
              <button
                key={s.startIso}
                onClick={() => openSubmitModal(s)}
                className="px-3 py-2 text-sm rounded-lg border border-luxe-gold/20 text-luxe-text hover:border-luxe-gold/50 hover:bg-luxe-gold/5 transition-colors"
              >
                {s.localTime}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-luxe-muted">
        想看自己的預約紀錄？前往{" "}
        <Link to="/my-bookings" className="text-luxe-gold hover:underline">
          我的預約
        </Link>
      </div>

      {/* 送出預約 Modal */}
      <Modal
        isOpen={!!pickedSlot}
        onClose={() => setPickedSlot(null)}
        title="送出預約"
        theme="luxe"
        size="lg"
      >
        {pickedSlot && (
          <div className="space-y-4">
            <div className="p-3 bg-luxe-gold/5 border border-luxe-gold/20 rounded-lg">
              <p className="text-luxe-text text-sm">
                時段：
                <span className="text-luxe-gold ml-1">
                  {pickedSlot.localDate} {pickedSlot.localTime}
                </span>
              </p>
              <p className="text-luxe-muted text-xs mt-1">
                時長 {profile.default_slot_minutes} 分鐘
              </p>
            </div>

            <div>
              <label className="block text-sm text-luxe-muted mb-1">
                想諮詢的課程（選填）
              </label>
              <select
                value={form.courseId}
                onChange={(e) =>
                  setForm({ ...form, courseId: e.target.value })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
              >
                <option value="">不指定</option>
                {courses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_title}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              label="想聊什麼？（選填）"
              value={form.userNote}
              onChange={(e) => setForm({ ...form, userNote: e.target.value })}
              placeholder="例：想了解 XX 課程內容、有 OO 問題想討論..."
              theme="luxe"
              rows={4}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="聯絡 Email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                placeholder="預約通知會寄到此信箱"
                theme="luxe"
              />
              <Input
                label="聯絡電話"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
                placeholder="例：0912-345-678"
                theme="luxe"
              />
            </div>
            <p className="text-xs text-luxe-muted">
              email 與電話至少需填一項。
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-luxe-gold/10">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setPickedSlot(null)}
              >
                取消
              </PillButton>
              <PillButton
                theme="luxe"
                variant="filled"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "送出中..." : "送出預約"}
              </PillButton>
            </div>
          </div>
        )}
      </Modal>

      {/* react-day-picker 客製樣式（luxe 風格） */}
      <style>{`
        .coach-booking-daypicker {
          --rdp-accent-color: rgb(197, 160, 89);
          --rdp-background-color: rgba(197, 160, 89, 0.1);
          color: var(--luxe-text, #e8e4dc);
        }
        .coach-booking-daypicker .rdp-day {
          border-radius: 8px;
        }
        .coach-booking-daypicker .rdp-day_disabled {
          opacity: 0.25;
        }
        .coach-booking-daypicker .coach-booking-has-slots:not(.rdp-day_disabled) {
          color: rgb(197, 160, 89);
          font-weight: 600;
        }
        .coach-booking-daypicker .coach-booking-selected {
          background: rgba(197, 160, 89, 0.25) !important;
          color: rgb(197, 160, 89) !important;
        }
      `}</style>
    </div>
  );
};

export default BookingPage;
