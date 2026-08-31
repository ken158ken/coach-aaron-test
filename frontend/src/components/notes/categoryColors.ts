/**
 * 看板分類的色票與著色工具
 * @module components/notes/categoryColors
 *
 * 分類的 `color` 是使用者資料（後端只驗長度 ≤ 30，不驗格式），所以渲染前
 * 一律過 `safeCategoryColor()`：**只放行 hex**，其餘一概退回金色。
 * 這不是為了防 XSS（React 的 style prop 走 CSSOM，值不會變成選擇器或宣告），
 * 而是避免舊資料/手改 DB 塞進 `inherit`、空字串之類的值時整欄變透明。
 *
 * 著色一律用 `color-mix()`（index.css 已大量使用，瀏覽器支援一致），
 * 這樣同一個 hex 在深色與淺色主題下都能自動融進底色，不必準備兩套色票。
 */

/**
 * 預設色票（10 色）。
 *
 * 挑選標準：在 `#141414`（深色 surface）與 `#f5f3ef`（淺色 surface）上
 * 都還看得出彼此差異，且不與「未分類」那欄的灰階撞色。
 * 第一個是站內金色，讓沒特別選色的分類看起來就像站內原生元件。
 */
export const CATEGORY_COLORS = [
  "#c5a059", // gold（站內主色）
  "#d97757", // terracotta
  "#c2596b", // rose
  "#a56fb5", // violet
  "#5b8dd9", // blue
  "#3fa6a1", // teal
  "#5faa5f", // green
  "#c9a227", // amber
  "#b06b3f", // brown
  "#8a8f98", // slate
] as const;

/** 沒指定顏色時用的預設值（＝站內金色） */
export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** 只放行 hex 色碼，其餘退回預設金色 */
export function safeCategoryColor(color: string | null | undefined): string {
  return color && HEX_RE.test(color) ? color : DEFAULT_CATEGORY_COLOR;
}

/**
 * 把分類色混進透明底，得到淡淡的欄底／徽章底色。
 * @param color 分類色（會先過 `safeCategoryColor`）
 * @param percent 分類色佔比（0–100）
 */
export function tintCategoryColor(
  color: string | null | undefined,
  percent: number,
): string {
  return `color-mix(in srgb, ${safeCategoryColor(color)} ${percent}%, transparent)`;
}

/**
 * 產生新的分類 id。
 *
 * 後端限制 64 字元且同一頁內不可重複；用時間戳 + 亂數即可，
 * 不需要 uuid 套件（多一個相依只為了這裡不划算）。
 */
export function newCategoryId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
