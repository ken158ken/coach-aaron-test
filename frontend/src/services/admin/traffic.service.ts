/**
 * 後台流量來源統計服務
 * @module services/admin/traffic.service
 *
 * 對應後端 `GET /api/admin/traffic/summary?days=30`（requireAdmin）。
 *
 * `traffic_events` 表還沒建立時後端回「空殼」（total 0、各陣列空），
 * 不是 500 —— 所以頁面只要處理「空資料」一種狀態，不必特別接錯誤碼。
 * 寫法照既有 admin service（services/site/leads.service.ts）：
 * 薄薄一層 `get()`，型別在這裡宣告，頁面不自己拼 URL。
 */

import { get } from "../api";

/** 來源分類（由後端依 referrer 歸好的五類） */
export type TrafficSourceClass =
  | "ai"
  | "search"
  | "social"
  | "direct"
  | "other";

/** 五類來源的固定顯示順序（頁面的 stat 卡依此排列，與資料回傳順序無關） */
export const TRAFFIC_SOURCE_CLASSES: TrafficSourceClass[] = [
  "ai",
  "search",
  "social",
  "direct",
  "other",
];

/** 來源分類計數 */
export interface TrafficSourceBucket {
  source_class: TrafficSourceClass;
  count: number;
}

/** 來源網域計數（直接進入時 referrer_host 為 null） */
export interface TrafficReferrerBucket {
  referrer_host: string | null;
  count: number;
}

/** 頁面路徑計數 */
export interface TrafficPathBucket {
  path: string;
  count: number;
}

/** 每日計數（`day` 為 `YYYY-MM-DD`） */
export interface TrafficDailyBucket {
  day: string;
  count: number;
}

/** 流量總覽回應 */
export interface TrafficSummary {
  /** 統計區間天數（後端回拋，確認它採用了我們送的值） */
  days: number;
  /** 區間內總瀏覽數 */
  total: number;
  bySource: TrafficSourceBucket[];
  byReferrer: TrafficReferrerBucket[];
  byPath: TrafficPathBucket[];
  daily: TrafficDailyBucket[];
}

/** 頁面提供的天數切換選項 */
export const TRAFFIC_RANGES = [7, 30, 90] as const;

/** 天數切換選項的型別 */
export type TrafficRange = (typeof TRAFFIC_RANGES)[number];

export const trafficService = {
  /**
   * 取得流量總覽。
   *
   * @param days - 統計區間天數（7 / 30 / 90）
   */
  summary: (days: TrafficRange | number = 30): Promise<TrafficSummary> =>
    get<TrafficSummary>("/api/admin/traffic/summary", { params: { days } }),
};

export default trafficService;
