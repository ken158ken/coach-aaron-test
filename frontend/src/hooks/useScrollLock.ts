/**
 * useScrollLock — 統一的捲動鎖定 hook
 *
 * 當 locked=true 時：
 *   1. document.body.style.overflow = "hidden"（阻止原生 scroll）
 *   2. stopLenis()（暫停 Lenis smooth scroll RAF）
 * 當 locked=false / 元件卸載時：
 *   1. document.body.style.overflow = ""（恢復原生 scroll）
 *   2. startLenis()（恢復 Lenis）
 *
 * 透過計數器支援多個 modal 同時開啟的情境：
 * 只有在最後一個 modal 關閉時才真正解鎖。
 */

import { useEffect } from "react";
import { stopLenis, startLenis } from "@/lib/lenisInstance";

/** 全域開啟中的 overlay 數量計數器 */
let lockCount = 0;

function lockScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = "hidden";
    stopLenis();
  }
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
    startLenis();
  }
}

export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!locked) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [locked]);
}
