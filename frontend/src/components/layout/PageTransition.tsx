/**
 * PageTransition 元件 - 頁面切換淡入動畫
 * @module components/layout/PageTransition
 * @description 包裹頁面內容，在路由切換時自動執行淡入動畫。
 *              使用純 CSS animation，無需額外套件（如 framer-motion）。
 */

import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[PageTransition] ${msg}`),
};

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * 頁面過渡動畫容器
 *
 * @description 監聽路由 pathname 變化，切換時先播放 exit 動畫，
 *              再播放 enter 動畫。動畫定義在 index.css 的
 *              `.page-transition-enter` / `.page-transition-exit`。
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<
    "enter" | "exit" | "idle"
  >("enter");
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // 首次渲染：直接 enter
    if (prevPathRef.current === location.pathname) return;

    // 路由變化：先 exit → 再更新 children → 再 enter
    setTransitionStage("exit");

    const exitTimer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage("enter");
      prevPathRef.current = location.pathname;
      logger.info(`頁面過渡: ${location.pathname}`);
    }, 200); // exit 動畫 200ms

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children]);

  // 尊重使用者動畫偏好
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  const animationClass =
    transitionStage === "enter"
      ? "page-transition-enter"
      : transitionStage === "exit"
        ? "page-transition-exit"
        : "";

  return <div className={animationClass}>{displayChildren}</div>;
};

export default PageTransition;
