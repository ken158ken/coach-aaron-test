/**
 * 後台 Google 日曆的子元件
 * @module components/admin/calendar
 *
 * ⚠️ 這個 barrel 只給 `pages/admin/AdminGoogleCalendar.tsx` 用。
 * `CalendarSurface` 會把 FullCalendar（約 300 KB）拉進來，
 * 不要從 `@/components/admin` 之類的共用 barrel re-export 出去，
 * 否則它會被打進別的 chunk 送給用不到的頁面。
 */

export { default as CalendarSurface } from "./CalendarSurface";
export type { CalendarSurfaceProps } from "./CalendarSurface";

export { default as EventFormModal } from "./EventFormModal";
export type { EventFormModalProps, EventFormValues } from "./EventFormModal";

export { default as EventDetailModal } from "./EventDetailModal";
export type { EventDetailModalProps } from "./EventDetailModal";

export * from "./datetime";
