/**
 * useTour — 頁面導覽的共用 hook
 * @module tours/useTour
 *
 * @description
 * 負責四件事：
 *  1. 依目前路由查 `registry` 有沒有導覽（純資料查表，SSR 也算得出來，
 *     所以「?」鈕在 server render 與 hydration 後結果一致，不會閃爍）。
 *  2. **只在 client 端**動態 import 引擎（driver.js + CSS 都在那個 async chunk 裡），
 *     SSR 完全碰不到 `window`。
 *  3. RWD：用 matchMedia 判斷桌機／手機，交給引擎挑對應的步驟與選擇器。
 *  4. 換頁或元件卸載時強制收掉還開著的導覽，避免遮罩留在畫面上。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { findTour } from "./registry";
import type { TourHandle } from "./engine/tourEngine";

/** 與 AdminLayout 的 MOBILE_BREAKPOINT 對齊，兩邊對「手機版」的認知才一致 */
export const TOUR_MOBILE_QUERY = "(max-width: 1023px)";

export interface UseTourResult {
  /** 這個路由有沒有對應的導覽（決定「?」鈕要不要出現） */
  available: boolean;
  /** 導覽是否進行中（含載入 chunk 的期間） */
  running: boolean;
  /** 啟動導覽；已在進行中則忽略 */
  start: () => void;
  /** 手動結束導覽 */
  stop: () => void;
}

/**
 * @param pathname - 目前的路由路徑（由 useLocation 提供）
 * @returns 導覽狀態與控制函式
 */
export function useTour(pathname: string): UseTourResult {
  const entry = findTour(pathname);
  const [running, setRunning] = useState(false);
  const handleRef = useRef<TourHandle | null>(null);
  /** 避免 async 載入完成後元件已卸載還去 setState */
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    handleRef.current?.destroy();
    handleRef.current = null;
    setRunning(false);
  }, []);

  // 換頁時把導覽收掉：步驟綁的是上一頁的元素，留著只會highlight到空氣
  useEffect(() => {
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [pathname]);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    if (handleRef.current?.isActive()) return;

    setRunning(true);

    void (async () => {
      try {
        // 兩個動態 import 併發：引擎（含 driver.js chunk）與這一頁的步驟定義
        const [{ runTour }, mod] = await Promise.all([
          import("./engine/tourEngine"),
          entry!.load(),
        ]);

        if (!aliveRef.current) return;

        const isMobile = window.matchMedia(TOUR_MOBILE_QUERY).matches;
        const handle = runTour(mod.default, {
          isMobile,
          onFinish: () => {
            handleRef.current = null;
            if (aliveRef.current) setRunning(false);
          },
        });

        handleRef.current = handle;
        // 一步都湊不齊（整頁還沒載完）→ 直接復原按鈕狀態
        if (!handle && aliveRef.current) setRunning(false);
      } catch (err) {
        // 導覽是輔助功能，壞掉也不能影響頁面本身
        if (import.meta.env.DEV) console.warn("[tour] 啟動失敗", err);
        if (aliveRef.current) setRunning(false);
      }
    })();
  }, [entry]);

  return {
    available: Boolean(entry),
    running,
    start: entry ? start : () => {},
    stop,
  };
}
