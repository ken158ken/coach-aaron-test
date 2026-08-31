/**
 * CalendarSurface — FullCalendar 的薄包裝（後台 Google 日曆）
 * @module components/admin/calendar/CalendarSurface
 *
 * 只負責「畫日曆 + 把互動事件往上丟」，不碰 API、不管 modal，
 * 資料流與錯誤處理全在 AdminGoogleCalendar 頁面。
 *
 * SSR 安全性：
 *   FullCalendar v6 在 Node 匯入不會炸（樣式是 runtime 才 inject 進 document.head，
 *   內部有 `el.isConnected` 保護），renderToString 會安靜地產出一個空 div。
 *   但為了避免「server 空 div → client 完整日曆」的 hydration 落差，
 *   呼叫端（頁面）用 mounted 旗標確保這個元件只在 client 掛載後才渲染。
 *
 * 工具列刻意用 FullCalendar 內建的 headerToolbar：按鈕文字（今天／月／週／日／
 * 列表）直接吃 locale，不必再自己維護一份 i18n 字串。
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import zhTwLocale from "@fullcalendar/core/locales/zh-tw";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { AdminCalendarEvent } from "@/services/booking/coach.service";
import "./fullcalendar-luxe.css";

export interface CalendarSurfaceProps {
  /** 目前區間的事件（由頁面抓好） */
  events: AdminCalendarEvent[];
  /** 手機版（<768px）→ 預設 listWeek，桌機 → dayGridMonth */
  isMobile: boolean;
  /** 站內語言；en 用 FullCalendar 內建英文，zh-TW 掛 zh-tw locale */
  isZhTW: boolean;
  /** 「會員預約」徽章文字（i18n 由頁面傳入） */
  bookingBadgeLabel: string;
  /** 無標題事件的替代文字 */
  untitledLabel: string;
  /** 視圖區間變動（換月／換視圖／按今天）→ 頁面據此重抓資料 */
  onDatesSet: (arg: DatesSetArg) => void;
  /** 點空白或框選時段 → 開「新增活動」 */
  onSelect: (arg: DateSelectArg) => void;
  /** 點既有事件 → 開詳情 */
  onEventClick: (arg: EventClickArg) => void;
  /** 拖曳改期 */
  onEventDrop: (arg: EventDropArg) => void;
  /** 拉長／縮短 */
  onEventResize: (arg: EventResizeDoneArg) => void;
}

/*
 * ⚠️ 這兩個陣列**一定要放在元件外面**（或 useMemo）。
 *
 * `@fullcalendar/react` 每次 render 都會把收到的 props 跟上一次做淺比較，
 * 只要有任何一個「值變了」就呼叫 `calendar.resetOptions()`。傳 inline 陣列／物件
 * （`plugins={[a, b]}`、`locales={[x]}`、`headerToolbar={{...}}`）等於每次 render
 * 都是新參考 → 每次都 resetOptions → FullCalendar 重建視圖 → 再次觸發 `datesSet`
 * → 頁面又去抓資料 → setState → 再 render……變成**每秒兩次的無限重抓迴圈**
 * （實測 30 秒打了 62 次 GET，等於一直在敲 Google API）。
 *
 * 同理，下面的 `events` / `headerToolbar` / `eventContent` 也都要 memo 化。
 */
const PLUGINS = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];
const LOCALES = [zhTwLocale];

/** AdminCalendarEvent → FullCalendar EventInput */
function toFcEvent(e: AdminCalendarEvent, untitled: string): EventInput {
  return {
    id: e.id,
    title: e.summary || untitled,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    classNames: e.bookingId != null ? ["gcal-booking-event"] : [],
    // 原始資料整包帶著走，handler 才能判斷 bookingId、meetLink…
    extendedProps: { raw: e },
  };
}

const CalendarSurface = forwardRef<FullCalendar, CalendarSurfaceProps>(
  function CalendarSurface(
    {
      events,
      isMobile,
      isZhTW,
      bookingBadgeLabel,
      untitledLabel,
      onDatesSet,
      onSelect,
      onEventClick,
      onEventDrop,
      onEventResize,
    },
    ref,
  ) {
    const shellRef = useRef<HTMLDivElement>(null);
    const initialView = isMobile ? "listWeek" : "dayGridMonth";

    /*
     * 固定高度（不是 height="auto"），三個視圖共用同一個值。
     *
     * 1. auto 會讓 timeGrid 把 24 小時整個攤平：頁面破兩千 px，而且沒有內部
     *    捲軸 —— `scrollTime` 形同虛設，每次切到週視圖都停在午夜。
     * 2. 高度必須是**常數**。曾經試過「只有 timeGrid 給固定值」，但那要先從
     *    `datesSet` 得知目前視圖再改 prop，於是切視圖時 height 會變動一次，
     *    FullCalendar 重算版面並把捲動位置歸零，scrollTime 一樣失效。
     *
     * 配 `expandRows`：月視圖的六列剛好撐滿這個高度（不會有內部捲軸），
     * timeGrid 與列表則自己長出捲軸 —— 跟 Google 日曆的行為一致。
     */
    const height = isMobile ? 560 : 760;

    /*
     * 幫 FullCalendar 自己畫的工具列補上 data-tour。
     *
     * 教學導覽的規矩是「只用 [data-tour=...] 定位」，但工具列是套件內部渲染的，
     * 沒有地方掛屬性。與其讓導覽去記 .fc-header-toolbar 這種會隨版本改的
     * class，不如在這裡蓋一次章 —— 導覽端就只認得 data-tour。
     * 刻意不給依賴陣列：FullCalendar 換視圖時會重建工具列 DOM，每次 render
     * 都重蓋才不會掉。成本是兩個 querySelector。
     */
    useEffect(() => {
      const root = shellRef.current;
      if (!root) return;
      root
        .querySelector(".fc-header-toolbar")
        ?.setAttribute("data-tour", "gcal-toolbar");
      root
        .querySelector(".fc-header-toolbar .fc-toolbar-chunk:last-child")
        ?.setAttribute("data-tour", "gcal-views");
    });

    /** 事件內容：預約事件多一顆金色徽章 */
    const renderEventContent = useCallback(
      (arg: EventContentArg): React.ReactNode => {
        const raw = arg.event.extendedProps.raw as AdminCalendarEvent | undefined;
        const isBooking = raw?.bookingId != null;
        // list 視圖的欄位結構是 table，塞 <div> 會壞版 → 用 inline 元素
        if (arg.view.type === "listWeek") {
          return (
            <span className="gcal-event-inner">
              {isBooking && (
                <span className="gcal-event-badge">{bookingBadgeLabel}</span>
              )}
              <span className="gcal-event-text">{arg.event.title}</span>
            </span>
          );
        }
        return (
          <div className="gcal-event-inner">
            {isBooking && <span className="gcal-event-badge">{bookingBadgeLabel}</span>}
            {arg.timeText && <span className="gcal-event-text">{arg.timeText}</span>}
            <span className="gcal-event-text">{arg.event.title}</span>
          </div>
        );
      },
      [bookingBadgeLabel],
    );

    /** headerToolbar 是物件 → 必須 memo，否則每次 render 都會 resetOptions（見上方註解） */
    const headerToolbar = useMemo(
      () => ({
        left: "prev,next today",
        center: "title",
        right: isMobile
          ? "listWeek,timeGridDay,dayGridMonth"
          : "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      }),
      [isMobile],
    );

    /** 只有資料真的換了才產生新陣列 */
    const fcEvents = useMemo(
      () => events.map((e) => toFcEvent(e, untitledLabel)),
      [events, untitledLabel],
    );

    return (
      <div className="gcal-shell" ref={shellRef} data-tour="gcal-grid">
        <FullCalendar
          ref={ref}
          plugins={PLUGINS}
          /* zh-tw locale 讓工具列按鈕、月份、星期全部中文化；en 走內建預設 */
          locales={LOCALES}
          locale={isZhTW ? "zh-tw" : "en"}
          initialView={initialView}
          headerToolbar={headerToolbar}
          firstDay={1}
          height={height}
          expandRows
          nowIndicator
          dayMaxEventRows={4}
          slotDuration="00:30:00"
          scrollTime="08:00:00"
          /* 建立：點一下或框選空檔 */
          selectable
          selectMirror
          /* 拖拉改期／改長度 */
          editable
          eventResizableFromStart
          eventDurationEditable
          eventStartEditable
          /* 「+N 更多」用 popover，不要整頁跳視圖 */
          moreLinkClick="popover"
          events={fcEvents}
          eventContent={renderEventContent}
          datesSet={onDatesSet}
          select={onSelect}
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
        />
      </div>
    );
  },
);

export default CalendarSurface;
