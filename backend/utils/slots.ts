/**
 * 可預約時段計算
 *
 * 輸入：教練 profile + 週期規則 + time_off + 現有 bookings + google busy
 * 輸出：每一天的可用時段陣列
 *
 * 流程：
 *   1. 對每一天，依 weekday 找出適用的 availability_rules
 *   2. 把 rule 的時間切成 slot_minutes 大小的小塊
 *   3. 扣除：
 *      - 過去時間（+ booking_notice_hours 緩衝）
 *      - 已在 bookings 表的 pending/confirmed
 *      - time_off 區間
 *      - Google busy 區間
 *      - 與相鄰預約的 buffer 時間衝突
 *
 * 時區：全站鎖 Asia/Taipei；存 DB 用 UTC，對外顯示時前端自行轉。
 *
 * @module utils/slots
 */

import {
  addDays,
  addMinutes,
  differenceInMinutes,
  isBefore,
  startOfDay,
} from "date-fns";
import { fromZonedTime, toZonedTime, format as formatTz } from "date-fns-tz";

/** 教練設定（只取算 slot 需要的欄位） */
export interface CoachSettings {
  timezone: string;                // 'Asia/Taipei'
  defaultSlotMinutes: number;
  bufferMinutes: number;
  bookingNoticeHours: number;
  bookingWindowDays: number;
}

/** 週期規則 */
export interface AvailabilityRule {
  weekday: number;       // 0-6 (0=日)
  startTime: string;     // 'HH:mm'
  endTime: string;       // 'HH:mm'
}

/** 區間（UTC Date） */
export interface Interval {
  start: Date;
  end: Date;
}

/** 回傳給前端的 slot */
export interface AvailableSlot {
  startIso: string;    // UTC ISO
  endIso: string;
  localDate: string;   // 'YYYY-MM-DD'（教練時區）
  localTime: string;   // 'HH:mm'（教練時區）
}

/**
 * 計算可用 slot 清單
 *
 * @param settings     教練設定
 * @param rules        週期可用規則
 * @param busy         所有要扣除的忙碌區間（bookings + time_off + google busy）
 * @param rangeFrom    起始日（用戶指定，通常是今天）
 * @param rangeToExcl  結束日（不含，通常是 rangeFrom + bookingWindowDays）
 * @param now          當下時間（可注入以便測試）
 */
export function computeAvailableSlots(
  settings: CoachSettings,
  rules: AvailabilityRule[],
  busy: Interval[],
  rangeFrom: Date,
  rangeToExcl: Date,
  now: Date = new Date(),
): AvailableSlot[] {
  if (rules.length === 0) return [];

  const tz = settings.timezone;
  const slotMs = settings.defaultSlotMinutes * 60_000;
  const bufferMs = settings.bufferMinutes * 60_000;
  const noticeCutoff = addMinutes(now, settings.bookingNoticeHours * 60);
  const windowMax = addDays(startOfDay(now), settings.bookingWindowDays);
  const effectiveTo = isBefore(rangeToExcl, windowMax) ? rangeToExcl : windowMax;

  const slots: AvailableSlot[] = [];

  // 逐日迭代
  for (
    let dayCursor = startOfDay(rangeFrom);
    isBefore(dayCursor, effectiveTo);
    dayCursor = addDays(dayCursor, 1)
  ) {
    // 把這天（以教練時區）的 weekday 取出
    const dayInTz = toZonedTime(dayCursor, tz);
    const weekday = dayInTz.getDay(); // 0-6
    const dateStr = formatTz(dayInTz, "yyyy-MM-dd", { timeZone: tz });

    const todaysRules = rules.filter((r) => r.weekday === weekday);
    if (todaysRules.length === 0) continue;

    for (const rule of todaysRules) {
      // 把 rule 的本地時間組合成 UTC Date
      const ruleStartZoned = `${dateStr}T${rule.startTime}:00`;
      const ruleEndZoned = `${dateStr}T${rule.endTime}:00`;
      const ruleStart = fromZonedTime(ruleStartZoned, tz);
      const ruleEnd = fromZonedTime(ruleEndZoned, tz);

      // 用 slot_minutes 切
      for (
        let slotStart = ruleStart;
        slotStart.getTime() + slotMs <= ruleEnd.getTime();
        slotStart = new Date(slotStart.getTime() + slotMs)
      ) {
        const slotEnd = new Date(slotStart.getTime() + slotMs);

        // 太近（< notice）過濾
        if (isBefore(slotStart, noticeCutoff)) continue;

        // 與 busy 區間衝突（含 buffer）則過濾
        const slotStartWithBuffer = slotStart.getTime() - bufferMs;
        const slotEndWithBuffer = slotEnd.getTime() + bufferMs;
        const conflict = busy.some((b) => {
          return (
            slotStartWithBuffer < b.end.getTime() &&
            slotEndWithBuffer > b.start.getTime()
          );
        });
        if (conflict) continue;

        const slotZoned = toZonedTime(slotStart, tz);
        slots.push({
          startIso: slotStart.toISOString(),
          endIso: slotEnd.toISOString(),
          localDate: formatTz(slotZoned, "yyyy-MM-dd", { timeZone: tz }),
          localTime: formatTz(slotZoned, "HH:mm", { timeZone: tz }),
        });
      }
    }
  }

  // 依時間排序
  slots.sort((a, b) => a.startIso.localeCompare(b.startIso));
  return slots;
}

/** 把 DB 回傳的字串區間轉成 Date 物件 */
export function toIntervals(
  raw: Array<{ start: string | Date; end: string | Date }>,
): Interval[] {
  return raw.map((r) => ({
    start: r.start instanceof Date ? r.start : new Date(r.start),
    end: r.end instanceof Date ? r.end : new Date(r.end),
  }));
}

/** 驗證使用者送來的 start/end 是否真的落在某個可用 slot */
export function isSlotAvailable(
  settings: CoachSettings,
  rules: AvailabilityRule[],
  busy: Interval[],
  start: Date,
  end: Date,
): boolean {
  // 時長必須等於 default
  if (differenceInMinutes(end, start) !== settings.defaultSlotMinutes) {
    return false;
  }
  // 生成那天的所有 slot，看是否包含此 slot（startIso 相同）
  const from = startOfDay(start);
  const to = addDays(from, 1);
  const slots = computeAvailableSlots(settings, rules, busy, from, to);
  return slots.some((s) => s.startIso === start.toISOString());
}
