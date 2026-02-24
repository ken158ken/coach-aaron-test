/**
 * 主題常數
 * @module constants/theme
 */

export type ThemeName = "abyss" | "prism" | "luxe";

export interface ThemeColors {
  bg: string;
  surface?: string;
  text: string;
  muted?: string;
  accent: string;
  secondary?: string;
  glow?: string;
  gold?: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  abyss: {
    bg: "#000205",
    text: "#e0f7fa",
    muted: "#80deea",
    accent: "#00ffff",
    glow: "#7b00ff",
  },
  prism: {
    bg: "#0b001a",
    text: "#e0e0ff",
    muted: "#b0b0ff",
    accent: "#b388ff",
    secondary: "#82b1ff",
  },
  luxe: {
    bg: "#0a0a0a",
    surface: "#141414",
    text: "#e0e0e0",
    muted: "#888888",
    accent: "#d4af37",
    gold: "#d4af37",
  },
} as const;

// Page to Theme mapping
export const PAGE_THEMES: Record<string, ThemeName> = {
  "/": "abyss",
  "/courses": "prism",
  "/videos": "prism",
  "/contact": "luxe",
  "/login": "luxe",
  "/register": "luxe",
  "/member": "luxe",
  "/dashboard": "luxe",
  "/admin": "luxe",
} as const;
