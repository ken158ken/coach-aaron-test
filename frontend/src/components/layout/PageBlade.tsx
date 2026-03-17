/**
 * PageBlade - 全頁銀刃閃過特效
 * @description 兩種觸發方式：
 *   1. 路由切換 (useLocation) — 換頁時自動播放
 *   2. 'trigger:pageblade' 自訂事件 — 點擊內容區域時播放
 *   用 key 強制重新掛載讓每次觸發都從頭播動畫。
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const PageBlade: React.FC = () => {
  const location = useLocation();
  const [bladeKey, setBladeKey] = useState(0);
  const prevPath = useRef("");

  const triggerBlade = useCallback(() => {
    setBladeKey((k) => k + 1);
  }, []);

  // 路由切換觸發
  useEffect(() => {
    if (prevPath.current && prevPath.current !== location.pathname) {
      triggerBlade();
    }
    prevPath.current = location.pathname;
  }, [location.pathname, triggerBlade]);

  // 點擊內容區觸發
  useEffect(() => {
    window.addEventListener("trigger:pageblade", triggerBlade as EventListener);
    return () => window.removeEventListener("trigger:pageblade", triggerBlade as EventListener);
  }, [triggerBlade]);

  if (bladeKey === 0) return null;

  return (
    <div key={bladeKey} aria-hidden="true" className="page-blade-container">
      <div className="page-blade-strip" />
    </div>
  );
};

export default PageBlade;
