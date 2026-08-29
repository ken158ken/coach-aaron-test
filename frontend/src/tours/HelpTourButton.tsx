/**
 * HelpTourButton — 浮動「?」新手教學按鈕
 * @module tours/HelpTourButton
 *
 * @description
 * 全站只掛兩顆（AdminLayout 一顆、前台 Layout 一顆），由 `registry` 決定
 * 目前這頁有沒有導覽——沒有就整顆不渲染，所以公開行銷頁看不到它。
 *
 * 互動規格（依業主需求）：
 *  - **按了才觸發**：不自動彈出、不記 localStorage、不在首次進站時提示。
 *  - hover / focus 展開「頁面導覽」提示條，離開就收回。
 *  - 桌機可按 `?`（Shift+/）快速開啟；在輸入框內打字時不攔截。
 *
 * 樣式走站上的 luxe token（金線 + 玻璃感），深淺主題自動切換；
 * 位置固定右下角，並針對底部有輸入列的頁面（聊天）自動上抬避開。
 */

import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "./useTour";

interface HelpTourButtonProps {
  /** 額外 class（例如個別頁面要微調位置） */
  className?: string;
}

/**
 * 底部有固定輸入列的頁面要把按鈕往上抬，否則會壓到送出鈕。
 * 用路徑前綴比對，新增頁面時在這裡補一條即可。
 */
const RAISED_PREFIXES = ["/chat"];

const HelpTourButton: React.FC<HelpTourButtonProps> = ({ className = "" }) => {
  const { pathname } = useLocation();
  const { available, running, start } = useTour(pathname);
  const [hovered, setHovered] = useState(false);

  const raised = RAISED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const handleStart = useCallback(() => {
    setHovered(false);
    start();
  }, [start]);

  // 鍵盤捷徑：? 開啟導覽（打字中不攔截）
  useEffect(() => {
    if (!available) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      handleStart();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [available, handleStart]);

  if (!available) return null;

  return (
    <div
      data-tour-fab=""
      className={`fixed right-4 sm:right-6 z-40 print:hidden ${
        raised ? "bottom-20 sm:bottom-24" : "bottom-4 sm:bottom-6"
      } ${className}`}
    >
      <div
        className="relative flex items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 提示條 —— 從按鈕左側滑出 */}
        <AnimatePresence>
          {hovered && !running && (
            <motion.span
              key="tip"
              initial={{ opacity: 0, x: 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="tour-fab-tip pointer-events-none absolute right-full mr-2.5 whitespace-nowrap
                         rounded-lg border border-luxe-gold/20 bg-luxe-surface-2
                         px-3 py-1.5 text-xs tracking-wide text-luxe-text
                         shadow-lg shadow-black/25"
            >
              頁面導覽
              <span className="ml-2 hidden text-[10px] text-luxe-muted sm:inline">?</span>
            </motion.span>
          )}
        </AnimatePresence>

        {/* 主按鈕 */}
        <motion.button
          type="button"
          onClick={handleStart}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          disabled={running}
          aria-label="開始頁面導覽"
          title="頁面導覽"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.94 }}
          /* `tour-fab` 供 index.css 做淺色主題的對比修正，見該檔的說明 */
          className="tour-fab group relative flex h-11 w-11 items-center justify-center rounded-full
                     border border-luxe-gold/30 bg-luxe-surface-2/90 backdrop-blur-md
                     text-luxe-gold shadow-lg shadow-black/25
                     transition-colors duration-300
                     hover:border-luxe-gold/60 hover:bg-luxe-gold/15
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-luxe-gold/60 focus-visible:ring-offset-2
                     focus-visible:ring-offset-transparent
                     disabled:cursor-wait disabled:opacity-60
                     sm:h-12 sm:w-12"
        >
          {/* 外圈呼吸光暈 —— 只在 hover 時亮起，平時不搶注意力 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full opacity-0
                       shadow-[0_0_0_3px_rgba(197,160,89,0.14)]
                       transition-opacity duration-300 group-hover:opacity-100"
          />

          {running ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-luxe-gold border-t-transparent"
            />
          ) : (
            <span
              aria-hidden="true"
              className="text-lg font-medium leading-none sm:text-xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              ?
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default HelpTourButton;
