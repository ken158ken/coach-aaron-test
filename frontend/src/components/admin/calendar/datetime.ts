/**
 * 後台日曆的時間轉換工具
 * @module components/admin/calendar/datetime
 *
 * 這一層只做一件事：在三種時間表示之間翻譯，且**全部走本地時區**。
 *
 *   1. API（`AdminCalendarEvent`）
 *        一般事件 → RFC3339；全天事件 → `YYYY-MM-DD`，且 `end` 為**排他**日期
 *   2. 表單（`<input type="datetime-local">` / `<input type="date">`）
 *        `YYYY-MM-DDTHH:mm` / `YYYY-MM-DD`，永遠是使用者本地時間
 *   3. FullCalendar 的 `Date` 物件（本地時區）
 *
 * ⚠️ 排他日期是最容易寫錯的一段：Google 與 FullCalendar 都用「end = 隔天」
 * 表示單日全天事件，但**使用者看到的表單要是包含當天的結束日**（9/1 的單日
 * 活動，表單顯示 9/1 而不是 9/2）。因此表單 ↔ API 之間一律 ±1 天，
 * 只在這個檔案裡處理，其他地方不要再自己加減。
 */

const MS_PER_DAY = 86_400_000;

/** 兩位數補零 */
const pad = (n: number): string => String(n).padStart(2, "0");

/** Date → `YYYY-MM-DD`（本地時區，不用 toISOString 以免被 UTC 位移偏掉一天） */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date → `YYYY-MM-DDTHH:mm`（`<input type="datetime-local">` 的值） */
export function toDateTimeInput(d: Date): string {
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm` → Date；解析不出來回 null */
export function fromInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** `YYYY-MM-DD` 加減天數，回傳同格式字串（純字串運算，不受時區影響） */
export function shiftDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  // 用 UTC 建構避免夏令時間讓 +1 天變成 +0 或 +2 天
  const t = Date.UTC(y, m - 1, d) + days * MS_PER_DAY;
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${pad(nd.getUTCMonth() + 1)}-${pad(nd.getUTCDate())}`;
}

/** Date 加天數（回新的 Date） */
export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/**
 * 把事件時間整理成「送給 API 的 start/end」。
 *
 * @param start - 起始時刻（FullCalendar 給的本地 Date）
 * @param end - 結束時刻；全天事件請給**排他**的隔日 Date（FullCalendar 原生行為）
 * @param allDay - 是否全天
 */
export function toApiTimes(
  start: Date,
  end: Date,
  allDay: boolean,
): { start: string; end: string } {
  if (allDay) {
    return { start: toDateInput(start), end: toDateInput(end) };
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * 顯示用的時間區間文字。
 *
 * 全天事件會把排他的 end 轉回「使用者看得懂的最後一天」；跨月／跨年才補上
 * 完整日期，同一天則只顯示一次日期 + 時段。
 *
 * @param startRaw - 事件的 start（API 原始字串）
 * @param endRaw - 事件的 end（API 原始字串）
 * @param allDay - 是否全天
 * @param locale - `zh-TW` 或 `en-US`
 */
export function formatEventRange(
  startRaw: string,
  endRaw: string,
  allDay: boolean,
  locale: string,
): string {
  if (allDay) {
    // end 是排他日期 → 減一天才是使用者認知的結束日
    const lastDay = shiftDateString(endRaw, -1);
    const fmt = (s: string): string =>
      new Date(`${s}T00:00:00`).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
    return lastDay <= startRaw ? fmt(startRaw) : `${fmt(startRaw)} – ${fmt(lastDay)}`;
  }

  const s = new Date(startRaw);
  const e = new Date(endRaw);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startRaw} – ${endRaw}`;

  const dateFmt: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

  const sameDay = toDateInput(s) === toDateInput(e);
  if (sameDay) {
    return `${s.toLocaleDateString(locale, dateFmt)} ${s.toLocaleTimeString(
      locale,
      timeFmt,
    )} – ${e.toLocaleTimeString(locale, timeFmt)}`;
  }
  return `${s.toLocaleString(locale, { ...dateFmt, ...timeFmt })} – ${e.toLocaleString(
    locale,
    { ...dateFmt, ...timeFmt },
  )}`;
}
