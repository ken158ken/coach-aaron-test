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
