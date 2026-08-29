/**
 * MyBookingsPage — 我的預約紀錄
 * @module pages/MyBookingsPage
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import {
  bookingService,
  type MyBooking,
  type BookingStatus,
} from "@/services/booking/booking.service";
import { PillButton, useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  completed: "bg-gold/15 text-gold border-gold/30",
};

const MyBookingsPage: React.FC = () => {
  const dialog = useDialog();
  const { t, isZhTW } = useLanguage();
  const dfLocale = isZhTW ? zhTW : enUS;
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await bookingService.getMine();
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError(t.myBookings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (b: MyBooking) => {
    const confirmed = await dialog.confirm({
      title: t.myBookings.cancelTitle,
      message: t.myBookings.cancelMessage.replace(
        "{time}",
        format(new Date(b.start_at), "yyyy/MM/dd HH:mm", { locale: dfLocale }),
      ),
      variant: "danger",
      confirmText: t.myBookings.cancelTitle,
    });
    if (!confirmed) return;
    try {
      await bookingService.cancelMine(b.id);
      fetchBookings();
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : t.myBookings.cancelFailed;
      setError(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-inherit">
            {t.myBookings.heading}
          </h1>
          <p className="text-sm text-muted mt-1">{t.myBookings.subtitle}</p>
        </div>
        <Link to="/booking">
          <PillButton theme="luxe" variant="outline" data-tour="mybookings-new">
            {t.myBookings.newBooking}
          </PillButton>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div data-tour="mybookings-list">
      {loading ? (
        <div className="text-center py-12 text-muted">{t.common.loading}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-muted">
          {t.myBookings.empty}
          <Link to="/booking" className="text-gold hover:underline">
            {t.myBookings.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              data-tour="mybookings-card"
              className="bg-surface rounded-lg border border-gold/15 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-inherit font-medium">
                      {format(new Date(b.start_at), "yyyy/MM/dd (EEE) HH:mm", {
                        locale: dfLocale,
                      })}
                    </span>
                    <span className="text-muted text-sm">
                      ~{" "}
                      {format(new Date(b.end_at), "HH:mm", {
                        locale: dfLocale,
                      })}
                    </span>
                    <span
                      data-tour="mybookings-status"
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        STATUS_STYLE[b.status] || ""
                      }`}
                    >
                      {t.bookingStatus[b.status]}
                    </span>
                  </div>
                  {b.course && (
                    <p className="text-xs text-muted mb-1">
                      {t.myBookings.relatedCourse}
                      {/* 路由只支援數字 id（App.tsx: courses/:id），slug 會 404 */}
                      <Link
                        to={`/courses/${b.course.course_id}`}
                        className="text-gold hover:underline ml-1"
                      >
                        {b.course.course_title}
                      </Link>
                    </p>
                  )}
                  {b.user_note && (
                    <p className="text-sm text-inherit/80 mt-2">
                      {b.user_note}
                    </p>
                  )}
                  {b.coach_note && (
                    <p className="text-sm text-gold/80 mt-2">
                      {t.myBookings.coachNote}
                      {b.coach_note}
                    </p>
                  )}
                  <p className="text-xs text-muted mt-2">
                    {t.myBookings.submittedAt}{" "}
                    {format(new Date(b.created_at), "yyyy/MM/dd HH:mm", {
                      locale: dfLocale,
                    })}
                  </p>
                </div>
                {["pending", "confirmed"].includes(b.status) && (
                  <PillButton
                    theme="luxe"
                    variant="outline"
                    size="sm"
                    data-tour="mybookings-cancel"
                    onClick={() => handleCancel(b)}
                  >
                    {t.common.cancel}
                  </PillButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
