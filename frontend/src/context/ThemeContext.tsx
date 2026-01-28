/**
 * 主題上下文 - 管理視覺主題切換
 * @module context/ThemeContext
 */

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";

/** 主題類型 */
export type ThemeType = "abyss" | "prism" | "luxe";

interface ThemeContextType {
  /** 當前主題 */
  theme: ThemeType;
  /** 設置主題 */
  setTheme: (theme: ThemeType) => void;
  /** 切換到深海主題 */
  setAbyss: () => void;
  /** 切換到水晶主題 */
  setPrism: () => void;
  /** 切換到高端主題 */
  setLuxe: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

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
  const [theme, setThemeState] = useState<ThemeType>(defaultTheme);

  /**
   * 設置主題並更新 HTML 屬性
   */
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }, []);

  /**
   * 快捷方法
   */
  const setAbyss = useCallback(() => setTheme("abyss"), [setTheme]);
  const setPrism = useCallback(() => setTheme("prism"), [setTheme]);
  const setLuxe = useCallback(() => setTheme("luxe"), [setTheme]);

  /**
   * 初始化主題
   */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
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
