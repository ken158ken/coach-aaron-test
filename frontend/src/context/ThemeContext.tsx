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
    const saved = localStorage.getItem(COLOR_MODE_KEY);
    if (saved === "light" || saved === "dark") {
      setColorModeState(saved);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setColorModeState("light");
    }
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(COLOR_MODE_KEY, mode);
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
