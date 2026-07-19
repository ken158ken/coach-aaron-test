/**
 * Landing Page 模板共用工具函式
 * 所有 LP 元件共用，避免重複程式碼
 */

import type { LpPublicProject, LpResolvedField } from "../../services/site/landing.service";

export type { LpPublicProject, LpResolvedField };

export interface LPProps {
  project: LpPublicProject;
  fields: LpResolvedField[];
}

// ── 欄位值取得 ──────────────────────────────────────────────

/** 取欄位顯示值（圖片優先 cloudinary_url，文字用 resolved_text） */
export function fv(f: LpResolvedField): string {
  return f.cloudinary_url || f.resolved_text || "";
}

/** 依 field_key 精確取得單一欄位值 */
export function pick(fields: LpResolvedField[], key: string): string {
  return fv(fields.find((f) => f.field_key === key) ?? ({} as LpResolvedField));
}

/** 依 content_group 取得欄位陣列，依 sort_order 排序 */
export function byGroup(fields: LpResolvedField[], group: string): LpResolvedField[] {
  return fields
    .filter((f) => f.content_group === group)
    .sort((a, b) => a.field_sort_order - b.field_sort_order);
}

// ── 欄位類型判斷 ────────────────────────────────────────────

export const isImage = (f: LpResolvedField) =>
  f.field_kind === "image" || f.data_type === "image" || !!f.cloudinary_url;

export const isUrl = (f: LpResolvedField) =>
  f.field_kind === "url" || f.data_type === "url";

// ── 圖片佔位（admin 尚未上傳時顯示，自帶 SVG，不依賴外部服務）──

/** 內建灰底圖示佔位圖（data-URI SVG），任何主題下都顯示為「待上傳圖片」 */
export const PLACEHOLDER_IMG: string = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>" +
    "<rect width='800' height='600' fill='#e5e7eb'/>" +
    "<g fill='none' stroke='#9ca3af' stroke-width='12' stroke-linecap='round' stroke-linejoin='round'>" +
    "<rect x='250' y='190' width='300' height='220' rx='16'/>" +
    "<circle cx='332' cy='262' r='26'/>" +
    "<path d='M268 400 L362 312 L418 372 L498 300 L532 400 Z'/>" +
    "</g></svg>",
)}`;

/** 圖片來源：有值用原圖，否則回佔位圖。讓未上傳的圖片仍維持版面完整 */
export function imgSrc(url: string | null | undefined): string {
  return url && url.trim() ? url : PLACEHOLDER_IMG;
}

/** 是否為「尚未上傳、目前顯示佔位圖」 */
export function isPlaceholder(url: string | null | undefined): boolean {
  return !(url && url.trim());
}

// ── 區塊顯示/隱藏（admin 在 settings_json.hidden_sections 控制）──

/** 取得被 admin 隱藏的 content_group 清單 */
export function getHiddenSections(project: LpPublicProject): string[] {
  const raw = (project.settings_json as Record<string, unknown> | undefined)
    ?.hidden_sections;
  return Array.isArray(raw) ? raw.map(String) : [];
}

/** 此 content_group 是否應渲染（未被 admin 隱藏） */
export function sectionVisible(project: LpPublicProject, group: string): boolean {
  return !getHiddenSections(project).includes(group);
}

// ── 索引型重複項目收集（block_1_*, card_2_*, gallery_3_* …）──

/**
 * 把 `${prefix}_${i}_${suffix}` 形式的欄位收集成物件陣列。
 * 例：collectIndexed(fields, "block", 8, ["image","title","desc"])
 *   → [{ image, title, desc }, ...]（自動跳過全空的項目）
 *
 * keys 的值優先取 cloudinary_url（圖片），否則 resolved_text。
 */
export function collectIndexed<K extends string>(
  fields: LpResolvedField[],
  prefix: string,
  count: number,
  keys: readonly K[],
): Record<K, string>[] {
  const out: Record<K, string>[] = [];
  for (let i = 1; i <= count; i++) {
    const item = {} as Record<K, string>;
    let hasAny = false;
    for (const k of keys) {
      const val = pick(fields, `${prefix}_${i}_${k}`);
      item[k] = val;
      if (val) hasAny = true;
    }
    if (hasAny) out.push(item);
  }
  return out;
}

// ── CSS vars 注入 ───────────────────────────────────────────

/**
 * 從 project 的 lp_templates.color_vars 產生 CSS custom property style 物件
 * 若 project 有 variant_color_vars，以它覆蓋（後端合併後才用到）
 */
export function buildCssVars(project: LpPublicProject): React.CSSProperties {
  const vars = project.lp_templates?.color_vars ?? {};
  return Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [`--lp-${k}`, v]),
  ) as React.CSSProperties;
}

// ── 預設 CSS var fallback 值 ────────────────────────────────

export const LP_PRIMARY  = "var(--lp-primary,  #c5a059)";
export const LP_BG       = "var(--lp-bg,       #0a0a0a)";
export const LP_SURFACE  = "var(--lp-surface,  #141414)";
export const LP_TEXT     = "var(--lp-text,     #ffffff)";
export const LP_MUTED    = "var(--lp-muted,    #888888)";
export const LP_BORDER   = "var(--lp-border,   rgba(255,255,255,0.1))";
