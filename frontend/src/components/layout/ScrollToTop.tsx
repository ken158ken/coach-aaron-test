/**
 * ScrollToTop - 路由切換時自動回到頁面頂部
 * @module components/layout/ScrollToTop
 * 放在 <Routes> 同層，監聽 pathname 變化即觸發。
 */

import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // 新頁面的 data-aos 元素需要重新觀察
    setTimeout(() => AOS.refresh(), 100);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
