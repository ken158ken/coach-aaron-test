/**
 * 主題上下文 - Studio 設計系統
 * @module context/ThemeContext
 */

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { safeLocal } from "@/utils/safeStorage";

/** 色彩模式 */
export type ColorMode = "light" | "dark";

/** 向後相容（固定為 studio） */
export type ThemeType = "studio";

interface ThemeContextType {
  colorMode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  /** 向後相容：固定回傳 "studio" */
  theme: ThemeType;
  /** 向後相容：no-op */
  setTheme: (t: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const COLOR_MODE_KEY = "app_color_mode";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");

  useEffect(() => {
    // index.html 的同步啟動腳本已在首次繪製前依同一套規則（localStorage →
    // prefers-color-scheme）把 data-color-mode 設在 <html> 上，這裡優先沿用，
    // 確保 React 狀態與首屏實際顏色一致、不再二次翻轉。
    // 初始 useState 仍固定 "dark" 是為了與 SSR 輸出一致（hydration 不可 mismatch）。
    const bootstrapped = document.documentElement.getAttribute("data-color-mode");
    if (bootstrapped === "light" || bootstrapped === "dark") {
      setColorModeState(bootstrapped);
      return;
    }
    const saved = safeLocal.getItem(COLOR_MODE_KEY);
    if (saved === "light" || saved === "dark") {
      setColorModeState(saved);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setColorModeState("light");
    }
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (typeof window !== "undefined") {
      safeLocal.setItem(COLOR_MODE_KEY, mode);
    }
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === "dark" ? "light" : "dark");
  }, [colorMode, setColorMode]);

  useEffect(() => {
    const daisyTheme = colorMode === "light" ? "studio-light" : "studio";
    document.documentElement.setAttribute("data-theme", daisyTheme);
    document.documentElement.setAttribute("data-color-mode", colorMode);
    if (colorMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [colorMode]);

  const value: ThemeContextType = {
    colorMode,
    isDark: colorMode === "dark",
    setColorMode,
    toggleColorMode,
    theme: "studio",
    setTheme: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
