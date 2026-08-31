/**
 * EventDetailModal — 單一活動詳情（可轉去編輯／刪除）
 * @module components/admin/calendar/EventDetailModal
 *
 * 會員預約事件（`bookingId != null`）會多一塊警語，把「動這個事件會連帶
 * 動到會員預約」講在使用者按下編輯／刪除**之前**，而不是只靠事後的確認框。
 */

import React from "react";
import { Modal } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import type { AdminCalendarEvent } from "@/services/booking/coach.service";
import { formatEventRange } from "./datetime";

export interface EventDetailModalProps {
  isOpen: boolean;
  event: AdminCalendarEvent | null;
  deleting: boolean;
  onClose: () => void;
  onEdit: (event: AdminCalendarEvent) => void;
  onDelete: (event: AdminCalendarEvent) => void;
}

/** 一列「標籤 + 內容」 */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <p className="text-xs tracking-widest uppercase text-muted mb-1">{label}</p>
    <div className="text-sm leading-relaxed break-words">{children}</div>
  </div>
);

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  event,
  deleting,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t, isZhTW } = useLanguage();
  const c = t.adminCalendar;

  if (!event) return null;

  const isBooking = event.bookingId != null;
  const locale = isZhTW ? "zh-TW" : "en-US";

  const footer = (
    <>
      <button
        type="button"
        onClick={() => onDelete(event)}
        disabled={deleting}
        data-tour="gcal-detail-delete"
        className="px-4 py-2 rounded-lg text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center gap-2 mr-auto"
      >
        {deleting && (
          <span className="w-3.5 h-3.5 border border-t-transparent border-red-400 rounded-full animate-spin" />
        )}
        {deleting ? t.adminCommon.deleting : t.common.delete}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-lg text-sm border border-luxe-gold/20 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 transition-colors"
      >
        {t.common.cancel}
      </button>
      <button
        type="button"
        onClick={() => onEdit(event)}
        disabled={deleting}
        data-tour="gcal-detail-edit"
        className="px-5 py-2 rounded-lg text-sm font-medium bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 transition-colors disabled:opacity-50"
      >
        {t.common.edit}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={c.detailTitle}
      size="lg"
      footer={footer}
      tourId="gcal-event-detail"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* 標題 + 預約徽章 */}
        <div className="flex items-start gap-2 flex-wrap">
          <h4 className="text-lg font-light flex-1 min-w-0 break-words">
            {event.summary || c.untitled}
          </h4>
          {isBooking && (
            <span className="shrink-0 text-[11px] px-2 py-1 rounded border bg-luxe-gold/20 text-luxe-gold border-luxe-gold/40">
              {c.bookingBadge} #{event.bookingId}
            </span>
          )}
        </div>

        {isBooking && (
          <div className="rounded-lg border border-luxe-gold/30 bg-luxe-gold/10 px-3 py-2.5">
            <p className="text-sm text-luxe-gold font-medium">
              {c.bookingNoticeTitle}
            </p>
            <p className="text-xs text-luxe-muted mt-1 leading-relaxed">
              {c.bookingNoticeBody}
            </p>
          </div>
        )}

        <Row label={c.detailTime}>
          {formatEventRange(event.start, event.end, event.allDay, locale)}
        </Row>

        {event.location && <Row label={c.detailLocation}>{event.location}</Row>}

        {event.description && (
          <Row label={c.detailDescription}>
            {/* 純文字輸出：Google 的 description 可能含 HTML，這裡刻意不 render */}
            <p className="whitespace-pre-wrap">{event.description}</p>
          </Row>
        )}

        {/* 外部連結 */}
        <div className="flex flex-wrap gap-2 pt-1">
          {event.meetLink && (
            <a
              href={event.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg text-sm border border-luxe-gold/30 bg-luxe-gold/10 text-luxe-gold hover:bg-luxe-gold/20 transition-colors"
            >
              {c.joinMeetBtn}
            </a>
          )}
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              data-tour="gcal-detail-google"
              className="px-3.5 py-2 rounded-lg text-sm border border-luxe-gold/20 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 transition-colors"
            >
              {c.openInGoogleBtn}
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailModal;
