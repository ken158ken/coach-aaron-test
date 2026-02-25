/**
 * PageTransition 元件 - 頁面切換淡入動畫
 * @module components/layout/PageTransition
 * @description 包裹頁面內容，在路由切換時自動執行淡入動畫。
 *              使用純 CSS animation，無需額外套件（如 framer-motion）。
 */

import React from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * 頁面過渡動畫容器
 *
 * @description 使用 key={pathname} 強制在路由切換時重新掛載 wrapper div，
 *              確保 CSS animation 每次都從頭觸發（opacity 0 → 1）。
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition-enter">
      {children}
    </div>
  );
};

export default PageTransition;
