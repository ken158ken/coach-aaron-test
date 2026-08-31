/**
 * EventFormModal — 新增／編輯日曆活動
 * @module components/admin/calendar/EventFormModal
 *
 * 表單自己負責「使用者輸入 → API payload」的驗證與轉換，頁面只收成品，
 * 因此排他日期（全天事件 end = 隔天）這種容易寫錯的細節只存在一處。
 *
 * 兩個刻意的限制：
 *   1. `addMeet` 只在新增時出現 —— 後端的 PATCH 不處理 conferenceData，
 *      擺出來只會給使用者一個按了沒反應的勾選框。
 *   2. 會員預約事件（`lockAllDay`）不給切全天 —— 後端會用 400 擋，
 *      在這裡就鎖住比讓使用者填完才被退件好。
 */

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import type { AdminEventCreateInput } from "@/services/booking/coach.service";
import { fromInput, shiftDateString } from "./datetime";

/** 表單的原始輸入值（皆為 input 元素直接吃的字串格式） */
export interface EventFormValues {
  summary: string;
  allDay: boolean;
  /** 一般事件用：`YYYY-MM-DDTHH:mm` */
  startAt: string;
  endAt: string;
  /** 全天事件用：`YYYY-MM-DD`，**含當天**的結束日（送出時才 +1 變排他） */
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  addMeet: boolean;
}

export interface EventFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  /** 初值（由頁面依「框選的時段」或「既有事件」算好） */
  initial: EventFormValues;
  /** 會員預約事件：鎖住全天切換 */
  lockAllDay?: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: AdminEventCreateInput) => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  mode,
  initial,
  lockAllDay = false,
  submitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const c = t.adminCalendar;

  const [values, setValues] = useState<EventFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  // 每次開啟（或換一個事件）都重置成新的初值
  useEffect(() => {
    if (isOpen) {
      setValues(initial);
      setError(null);
    }
  }, [isOpen, initial]);

  const set = <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ): void => setValues((v) => ({ ...v, [key]: value }));

  const title = mode === "create" ? c.createTitle : c.editTitle;

  /** 驗證並組出 API payload；失敗回 null 並設好錯誤訊息 */
  const buildPayload = (): AdminEventCreateInput | null => {
    const summary = values.summary.trim();
    if (!summary) {
      setError(c.errSummaryRequired);
      return null;
    }

    let start: string;
    let end: string;
    if (values.allDay) {
      if (!values.startDate || !values.endDate) {
        setError(c.errTimeInvalid);
        return null;
      }
      if (values.endDate < values.startDate) {
        setError(c.errEndDateBeforeStart);
        return null;
      }
      start = values.startDate;
      // 使用者填的是「含當天」的結束日，Google/FullCalendar 要排他 → +1 天
      end = shiftDateString(values.endDate, 1);
    } else {
      const s = fromInput(values.startAt);
      const e = fromInput(values.endAt);
      if (!s || !e) {
        setError(c.errTimeInvalid);
        return null;
      }
      if (e.getTime() <= s.getTime()) {
        setError(c.errEndBeforeStart);
        return null;
      }
      start = s.toISOString();
      end = e.toISOString();
    }

    return {
      summary,
      description: values.description,
      location: values.location,
      start,
      end,
      allDay: values.allDay,
      ...(mode === "create" && values.addMeet ? { addMeet: true } : {}),
    };
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (payload) onSubmit(payload);
  };

  const footer = useMemo(
    () => (
      <>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-sm border border-luxe-gold/20 text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 transition-colors disabled:opacity-50"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          form="gcal-event-form"
          disabled={submitting}
          data-tour="gcal-form-save"
          className="px-5 py-2 rounded-lg text-sm font-medium bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && (
            <span className="w-3.5 h-3.5 border border-t-transparent border-luxe-gold rounded-full animate-spin" />
          )}
          {submitting ? t.adminCommon.saving : c.saveBtn}
        </button>
      </>
    ),
    [onClose, submitting, t, c.saveBtn],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={footer}
      tourId="gcal-event-form"
    >
      <form
        id="gcal-event-form"
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        {/* 標題 */}
        <div>
          <label
            htmlFor="gcal-summary"
            className="block text-xs tracking-widest uppercase text-muted mb-1.5"
          >
            {c.fieldSummary}
          </label>
          <input
            id="gcal-summary"
            className="studio-input w-full"
            value={values.summary}
            maxLength={200}
            onChange={(e) => set("summary", e.target.value)}
            placeholder={c.summaryPlaceholder}
            autoFocus
          />
        </div>

        {/* 全天切換 */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={values.allDay}
              disabled={lockAllDay}
              onChange={(e) => set("allDay", e.target.checked)}
              className="accent-[var(--color-gold)] disabled:opacity-40"
            />
            <span className={lockAllDay ? "opacity-50" : ""}>{c.fieldAllDay}</span>
          </label>
          {lockAllDay && (
            <p className="text-xs text-luxe-muted mt-1">{c.bookingLockedAllDay}</p>
          )}
        </div>

        {/* 時間 */}
        {values.allDay ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gcal-start-date"
                className="block text-xs tracking-widest uppercase text-muted mb-1.5"
              >
                {c.fieldStartDate}
              </label>
              <input
                id="gcal-start-date"
                type="date"
                className="studio-input w-full"
                value={values.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="gcal-end-date"
                className="block text-xs tracking-widest uppercase text-muted mb-1.5"
              >
                {c.fieldEndDate}
              </label>
              <input
                id="gcal-end-date"
                type="date"
                className="studio-input w-full"
                value={values.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
              <p className="text-xs text-luxe-muted mt-1">{c.endDateHint}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gcal-start-at"
                className="block text-xs tracking-widest uppercase text-muted mb-1.5"
              >
                {c.fieldStart}
              </label>
              <input
                id="gcal-start-at"
                type="datetime-local"
                className="studio-input w-full"
                value={values.startAt}
                onChange={(e) => set("startAt", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="gcal-end-at"
                className="block text-xs tracking-widest uppercase text-muted mb-1.5"
              >
                {c.fieldEnd}
              </label>
              <input
                id="gcal-end-at"
                type="datetime-local"
                className="studio-input w-full"
                value={values.endAt}
                onChange={(e) => set("endAt", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 地點 */}
        <div>
          <label
            htmlFor="gcal-location"
            className="block text-xs tracking-widest uppercase text-muted mb-1.5"
          >
            {c.fieldLocation}
          </label>
          <input
            id="gcal-location"
            className="studio-input w-full"
            value={values.location}
            maxLength={300}
            onChange={(e) => set("location", e.target.value)}
            placeholder={c.locationPlaceholder}
          />
        </div>

        {/* 描述 */}
        <div>
          <label
            htmlFor="gcal-description"
            className="block text-xs tracking-widest uppercase text-muted mb-1.5"
          >
            {c.fieldDescription}
          </label>
          <textarea
            id="gcal-description"
            rows={4}
            className="studio-input w-full resize-none"
            value={values.description}
            maxLength={5000}
            onChange={(e) => set("description", e.target.value)}
            placeholder={c.descriptionPlaceholder}
          />
        </div>

        {/* Google Meet（僅新增） */}
        {mode === "create" && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={values.addMeet}
                onChange={(e) => set("addMeet", e.target.checked)}
                className="accent-[var(--color-gold)]"
              />
              <span>{c.fieldAddMeet}</span>
            </label>
            <p className="text-xs text-luxe-muted mt-1">{c.addMeetHint}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};

export default EventFormModal;
