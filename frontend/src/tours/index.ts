/**
 * 新手教學引導系統 — 對外入口
 * @module tours
 *
 * @description
 * 使用方式只有一種：在版面元件裡掛一顆 `<HelpTourButton />`，
 * 其餘（這頁有沒有導覽、要不要載 driver.js、桌機還是手機）全由內部處理。
 *
 * ```tsx
 * import { HelpTourButton } from "@/tours";
 * // …版面最外層
 * <HelpTourButton />
 * ```
 */

export { default as HelpTourButton } from "./HelpTourButton";
export { useTour, TOUR_MOBILE_QUERY } from "./useTour";
export type { UseTourResult } from "./useTour";
export { findTour, hasTour } from "./registry";
export type { TourEntry } from "./registry";
export type {
  TourDefinition,
  TourStep,
  TourModalGroup,
  TourSide,
  TourAlign,
  TourUiText,
} from "./types";
