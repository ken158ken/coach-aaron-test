/**
 * lpTheme — Landing Page 雙主題（銀刃風）調色引擎
 *
 * 為什麼存在：
 *  LP 模板原本直接吃 DB 的 `lp_templates.color_vars`，而那份資料是「只有深色」
 *  的一組值（bg #0a0a0a、muted #888888），加上元件內大量寫死的 `text-white/40`，
 *  導致實機畫面近黑底＋深灰字、對比嚴重不足，且完全沒有淺色主題。
 *
 * 作法：
 *  1. DB 只採用 `primary`（品牌/變體強調色），其餘 token 一律由本檔依主題推導，
 *     確保任何模板、任何變體都能達到可讀對比（朝 WCAG AA）。
 *  2. 深色＝黑階提亮（不用死黑）、灰字提亮；淺色＝銀白清新高對比。
 *  3. 對既有模板寫死的 Tailwind 顏色（text-white/xx、bg-studio-bg…）以
 *     `.lp-root` 範圍內的覆蓋樣式導正，不必逐檔改動上百處字面值。
 *     深色遮罩上的文字以 `.lp-media` 標記豁免（維持白字）。
 *
 * @module components/landing-templates/lpTheme
 */

import React, { useCallback, useContext, useMemo, useState, useEffect } from "react";
import ThemeContext from "../../context/ThemeContext";
import type { LpPublicProject } from "../../services/site/landing.service";
import LogoMark from "../brand/LogoMark";

export type LpMode = "light" | "dark";

// ─────────────────────────────────────────────────────────
// 色彩工具：hex ↔ HSL，用於由品牌色推導各主題的可讀色階
// ─────────────────────────────────────────────────────────

interface Hsl { h: number; s: number; l: number }

function hexToHsl(hex: string): Hsl | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let raw = m[1];
  if (raw.length === 3) raw = raw.split("").map((c) => c + c).join("");
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: Hsl): string {
  const sN = Math.min(100, Math.max(0, s)) / 100;
  const lN = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = lN - c / 2;
  const to = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`;
}

/** 把品牌色調整到指定明度（並可微調彩度），用於在不同底色上取得足夠對比 */
function shift(hex: string, targetL: number, satMul = 1): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex({ h: hsl.h, s: Math.min(100, hsl.s * satMul), l: targetL });
}

/** 相對亮度（WCAG） */
function luminance(hex: string): number {
  const hsl = hexToHsl(hex);
  if (!hsl) return 0.5;
  const m = /^#?([0-9a-f]{6})$/i.exec(
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex,
  );
  if (!m) return hsl.l / 100;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 在給定填色上該用深字還是白字 */
function inkOn(fill: string): string {
  return luminance(fill) > 0.42 ? "#14181F" : "#FFFFFF";
}

// ─────────────────────────────────────────────────────────
// 調色盤
// ─────────────────────────────────────────────────────────

const DEFAULT_BRAND = "#C9A96E";

/**
 * 由品牌色 + 主題推導完整 token。
 * 深色：黑階提亮到 #12151A（非死黑），灰字提亮到 AA 以上。
 * 淺色：銀白 #F7F8FA / 純白卡片，深墨字。
 */
export function lpPalette(brandInput: string | undefined, mode: LpMode): Record<string, string> {
  const brand = hexToHsl(brandInput ?? "") ? (brandInput as string) : DEFAULT_BRAND;

  if (mode === "light") {
    const primary = shift(brand, 48);          // 填色（按鈕，壓深一點讓白字/CTA 更跳）
    const accent = shift(brand, 27, 1.1);       // 文字用強調色（白底上可讀，加深加彩度）
    return {
      bg: "#F5F6F8",
      "bg-alt": "#FFFFFF",
      surface: "#FFFFFF",
      "surface-2": "#E9ECF1",
      text: "#0C0F13",                          // 近黑主文，最高對比
      muted: "#39424E",                         // 副標 ≈ 9:1（AA/AAA）
      faint: "#4C5663",                         // 說明小字 ≈ 7:1（AA）
      border: "rgba(12,15,19,0.14)",
      "border-strong": "rgba(12,15,19,0.26)",
      primary,
      accent,
      "primary-soft": `${shift(brand, 48)}1F`,
      "on-primary": inkOn(primary),
      "brandbar-bg": "rgba(255,255,255,0.82)",
      scrim: "rgba(8,10,14,0.55)",
      shadow: "0 10px 30px -12px rgba(17,20,24,0.22)",
      ring: `${shift(brand, 52)}59`,
    };
  }

  const primary = shift(brand, 66);            // 深色底上的填色（提亮，CTA 更跳）
  const accent = shift(brand, 78, 1);           // 深色底上的文字強調色（更亮更飽和）
  return {
    bg: "#12151A",
    "bg-alt": "#171B22",
    surface: "#1C2027",
    "surface-2": "#262C36",
    text: "#FFFFFF",
    muted: "#D2D8E1",                            // 副標提亮 ≈ 12:1
    faint: "#AEB7C4",                            // 說明小字提亮 ≈ 8:1（AA）
    border: "rgba(255,255,255,0.18)",
    "border-strong": "rgba(255,255,255,0.32)",
    primary,
    accent,
    "primary-soft": `${shift(brand, 66)}24`,
    "on-primary": inkOn(primary),
    "brandbar-bg": "rgba(16,19,24,0.72)",
    scrim: "rgba(6,8,12,0.62)",
    shadow: "0 14px 40px -16px rgba(0,0,0,0.75)",
    ring: `${shift(brand, 64)}66`,
  };
}

// ─────────────────────────────────────────────────────────
// 範圍化覆蓋樣式
// ─────────────────────────────────────────────────────────

/**
 * 只在 `.lp-root` 內生效。把既有模板寫死的白階顏色導到主題 token，
 * 讓 8 支既有 LP 元件不必逐行改寫就同時支援日/夜與高對比。
 * `.lp-media`（深色遮罩上的內容）維持白字。
 */
const LP_SCOPED_CSS = `
.lp-root{background:var(--lp-bg);color:var(--lp-text);}
.lp-root .bg-studio-bg{background:var(--lp-bg)!important;}
.lp-root .text-white{color:var(--lp-text)!important;}
.lp-root .text-white\\/90,
.lp-root .text-white\\/80,
.lp-root .text-white\\/70{color:var(--lp-muted)!important;}
.lp-root .text-white\\/60,
.lp-root .text-white\\/50,
.lp-root .text-white\\/40,
.lp-root .text-white\\/30,
.lp-root .text-white\\/20{color:var(--lp-faint)!important;}
.lp-root .border-white\\/5,
.lp-root .border-white\\/10,
.lp-root .border-white\\/20{border-color:var(--lp-border)!important;}
.lp-root .bg-white\\/5,
.lp-root .bg-white\\/10{background-color:var(--lp-surface-2)!important;}
.lp-root .bg-black\\/50,
.lp-root .bg-black\\/55,
.lp-root .bg-black\\/60,
.lp-root .bg-black\\/70{background-color:var(--lp-scrim)!important;}

/* 深色遮罩／滿版圖上的文字維持白色（特異度高於上方規則） */
.lp-root .lp-media .text-white{color:#fff!important;}
.lp-root .lp-media .text-white\\/90,
.lp-root .lp-media .text-white\\/80,
.lp-root .lp-media .text-white\\/70{color:rgba(255,255,255,.88)!important;}
.lp-root .lp-media .text-white\\/60,
.lp-root .lp-media .text-white\\/50,
.lp-root .lp-media .text-white\\/40{color:rgba(255,255,255,.74)!important;}

.lp-root ::selection{background:var(--lp-primary);color:var(--lp-on-primary);}
.lp-root{scroll-behavior:smooth;}
@media (prefers-reduced-motion: reduce){
  .lp-root{scroll-behavior:auto;}
  .lp-root *{animation-duration:.001ms!important;transition-duration:.001ms!important;}
}
`;

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

const LP_MODE_KEY = "lp_color_mode";

/**
 * LP 專用主題 hook。
 * 預設跟隨站上 ThemeContext（若在 Provider 內），使用者在 LP 上切換時
 * 同步更新站上主題並記錄於 localStorage；不在 Provider 內則退回本地狀態。
 */
export function useLpTheme(): { mode: LpMode; setMode: (m: LpMode) => void; toggle: () => void } {
  const ctx = useContext(ThemeContext);
  const [local, setLocal] = useState<LpMode>("dark");

  useEffect(() => {
    if (ctx) return; // 有 Provider 時以 Provider 為準
    try {
      const saved = localStorage.getItem(LP_MODE_KEY);
      if (saved === "light" || saved === "dark") setLocal(saved);
    } catch {
      /* localStorage 不可用（隱私模式）時維持預設 */
    }
  }, [ctx]);

  const mode: LpMode = ctx ? ctx.colorMode : local;

  const setMode = useCallback(
    (m: LpMode) => {
      if (ctx) {
        ctx.setColorMode(m);
        return;
      }
      setLocal(m);
      try {
        localStorage.setItem(LP_MODE_KEY, m);
      } catch {
        /* 忽略寫入失敗 */
      }
    },
    [ctx],
  );

  const toggle = useCallback(() => setMode(mode === "dark" ? "light" : "dark"), [mode, setMode]);

  return { mode, setMode, toggle };
}

/**
 * LP 外殼：回傳要掛在根元素的 CSS vars、目前主題與切換函式。
 * 取代舊的 `buildCssVars(project)`。
 */
export function useLpShell(project: LpPublicProject): {
  cssVars: React.CSSProperties;
  mode: LpMode;
  toggle: () => void;
} {
  const { mode, toggle } = useLpTheme();
  const brand = project.lp_templates?.color_vars?.primary;

  const cssVars = useMemo(() => {
    const tokens = lpPalette(brand, mode);
    return Object.fromEntries(
      Object.entries(tokens).map(([k, v]) => [`--lp-${k}`, v]),
    ) as React.CSSProperties;
  }, [brand, mode]);

  return { cssVars, mode, toggle };
}

// ─────────────────────────────────────────────────────────
// UI：範圍樣式 + 懸浮日夜切換鈕
// ─────────────────────────────────────────────────────────

/**
 * 深色遮罩／滿版圖區塊的 class 組合器。
 * 只有「真的有背景圖（上面壓深色遮罩）」時才標記 `lp-media` 維持白字；
 * 沒有圖時該區塊改用主題底色，文字就跟著日/夜主題走。
 */
export function mediaCls(hasMedia: boolean, base: string): string {
  return hasMedia ? `lp-media ${base}` : base;
}

/** 注入範圍化覆蓋樣式（每個 LP 根元素渲染一次即可，重複無害） */
export const LpScopedStyles: React.FC = () => (
  <style dangerouslySetInnerHTML={{ __html: LP_SCOPED_CSS }} />
);

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
  </svg>
);

/**
 * 懸浮日／夜切換鈕。
 * LP 是獨立頁（沒有 Navbar），所以每個版面自帶這顆低調的切換鈕。
 */
export const LpThemeToggle: React.FC<{
  mode: LpMode;
  onToggle: () => void;
  /** 手機底部有懸浮 CTA 時往上讓位 */
  raised?: boolean;
}> = ({ mode, onToggle, raised = false }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={mode === "dark" ? "切換為淺色主題" : "切換為深色主題"}
    title={mode === "dark" ? "淺色主題" : "深色主題"}
    className={`fixed right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full
      backdrop-blur-md transition-all hover:scale-105 active:scale-95
      ${raised ? "bottom-24 sm:bottom-5" : "bottom-5"}`}
    style={{
      background: "var(--lp-surface)",
      color: "var(--lp-accent)",
      border: "1px solid var(--lp-border-strong)",
      boxShadow: "var(--lp-shadow)",
    }}
  >
    {mode === "dark" ? <SunIcon /> : <MoonIcon />}
  </button>
);

/**
 * 極簡品牌標頭（每個 LP 頂部一條輕量品牌列）。
 *
 * 為什麼存在：LP 是獨立頁，沒有站台 Navbar，訪客不易一眼看出「這是誰的頁」。
 * 這條低調的品牌列：左側 LogoMark ＋「阿倫教官 / Coach Aaron」字樣，
 * 右側整合日／夜切換鈕。sticky 佔位不覆蓋內容、半透明毛玻璃、深淺主題皆可讀、RWD。
 */
export const LpBrandBar: React.FC<{
  mode: LpMode;
  onToggle: () => void;
  /** 品牌主字（預設「阿倫教官」） */
  name?: string;
  /** 品牌副字（預設「Coach Aaron」） */
  tagline?: string;
}> = ({ mode, onToggle, name = "阿倫教官", tagline = "Coach Aaron" }) => (
  <div
    className="lp-brandbar sticky top-0 z-40 w-full backdrop-blur-md"
    style={{
      background: "var(--lp-brandbar-bg)",
      borderBottom: "1px solid var(--lp-border)",
    }}
  >
    <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
      {/* 左：Logo + 品牌名 */}
      <div className="flex items-center gap-2.5 min-w-0">
        <LogoMark size={30} title={`${name} ${tagline}`} className="shrink-0" />
        <span className="flex flex-col justify-center leading-none min-w-0">
          <span
            className="truncate text-[15px] font-bold tracking-tight sm:text-base"
            style={{ color: "var(--lp-text)" }}
          >
            {name}
          </span>
          <span
            className="truncate text-[10px] font-medium uppercase tracking-[0.18em] sm:text-[11px]"
            style={{ color: "var(--lp-faint)" }}
          >
            {tagline}
          </span>
        </span>
      </div>

      {/* 右：日／夜切換（整合，不再另用懸浮鈕） */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={mode === "dark" ? "切換為淺色主題" : "切換為深色主題"}
        title={mode === "dark" ? "淺色主題" : "深色主題"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
        style={{
          background: "var(--lp-surface)",
          color: "var(--lp-accent)",
          border: "1px solid var(--lp-border-strong)",
        }}
      >
        {mode === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  </div>
);

/**
 * 樣式 + 品牌標頭（含整合的日／夜切換鈕）的組合，一行掛進任一 LP 版面。
 * 取代舊的「懸浮切換鈕」——切換鈕已整合進品牌列。
 */
export const LpChrome: React.FC<{
  mode: LpMode;
  onToggle: () => void;
  /** 保留參數以相容舊呼叫端；品牌列改為 sticky 佔位，不再需要為底部 CTA 讓位 */
  raised?: boolean;
  name?: string;
  tagline?: string;
}> = ({ mode, onToggle, name, tagline }) => (
  <>
    <LpScopedStyles />
    <LpBrandBar mode={mode} onToggle={onToggle} name={name} tagline={tagline} />
  </>
);
