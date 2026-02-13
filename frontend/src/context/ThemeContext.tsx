/**
 * 主題上下文 - 管理視覺主題與日夜模式
 * @module context/ThemeContext
 */

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";

/** 視覺主題類型 */
export type ThemeType = "abyss" | "prism" | "luxe";

/** 色彩模式 */
export type ColorMode = "light" | "dark";

interface ThemeContextType {
  /** 當前視覺主題 */
  theme: ThemeType;
  /** 當前色彩模式 */
  colorMode: ColorMode;
  /** 是否為深色模式 */
  isDark: boolean;
  /** 設置視覺主題 */
  setTheme: (theme: ThemeType) => void;
  /** 設置色彩模式 */
  setColorMode: (mode: ColorMode) => void;
  /** 切換日夜模式 */
  toggleColorMode: () => void;
  /** 切換到深海主題 */
  setAbyss: () => void;
  /** 切換到水晶主題 */
  setPrism: () => void;
  /** 切換到高端主題 */
  setLuxe: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = "app_theme";
const COLOR_MODE_KEY = "app_color_mode";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

/**
 * Theme Provider 元件
 *
 * @param {ThemeProviderProps} props - 元件屬性
 * @returns {JSX.Element} Provider 元件
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "luxe",
}) => {
  // ✅ SSR-safe：初始值使用固定預設，避免 server/client 不一致
  const [theme, setThemeState] = useState<ThemeType>(defaultTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");

  // ✅ 在 hydration 完成後才從 localStorage 讀取使用者偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (
      savedTheme === "abyss" ||
      savedTheme === "prism" ||
      savedTheme === "luxe"
    ) {
      setThemeState(savedTheme);
    }

    const savedMode = localStorage.getItem(COLOR_MODE_KEY);
    if (savedMode === "light" || savedMode === "dark") {
      setColorModeState(savedMode);
    } else if (
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setColorModeState("light");
    }
  }, []);

  /**
   * 設置視覺主題
   */
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, newTheme);
    }
  }, []);

  /**
   * 設置色彩模式
   */
  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(COLOR_MODE_KEY, mode);
    }
  }, []);

  /**
   * 切換日夜模式
   */
  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === "dark" ? "light" : "dark");
  }, [colorMode, setColorMode]);

  /**
   * 快捷方法
   */
  const setAbyss = useCallback(() => setTheme("abyss"), [setTheme]);
  const setPrism = useCallback(() => setTheme("prism"), [setTheme]);
  const setLuxe = useCallback(() => setTheme("luxe"), [setTheme]);

  /**
   * 更新 HTML 屬性
   */
  useEffect(() => {
    // DaisyUI 使用 data-theme 來切換主題
    const daisyTheme = colorMode === "light" ? `${theme}-light` : theme;
    document.documentElement.setAttribute("data-theme", daisyTheme);
    document.documentElement.setAttribute("data-color-mode", colorMode);

    // 設置 class 用於 Tailwind dark mode
    if (colorMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, colorMode]);

  const value: ThemeContextType = {
    theme,
    colorMode,
    isDark: colorMode === "dark",
    setTheme,
    setColorMode,
    toggleColorMode,
    setAbyss,
    setPrism,
    setLuxe,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * 使用主題上下文的 Hook
 *
 * @returns {ThemeContextType} 主題上下文
 * @throws {Error} 當在 ThemeProvider 外使用時
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
