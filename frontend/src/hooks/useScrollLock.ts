/**
 * useScrollLock — 統一的捲動鎖定 hook
 *
 * 當 locked=true 時：
 *   1. document.body.style.overflow = "hidden"（阻止原生 scroll）
 *   2. 補上 padding-right = 捲軸寬度（避免鎖定瞬間版面左右跳動）
 *   3. stopLenis()（暫停 Lenis smooth scroll RAF）
 * 當 locked=false / 元件卸載時：
 *   1. 還原「鎖定前」的 inline style（不是硬塞 ""，避免蓋掉別人設的值）
 *   2. startLenis()（恢復 Lenis）
 *
 * 透過計數器支援多個 modal 疊層：只有最後一個 modal 關閉時才真正解鎖，
 * 關掉其中一層不會把還開著的那層一起解鎖。
 *
 * ⚠️ 所有 overlay/modal 一律走這支 hook。
 *    不要自己寫 `document.body.style.overflow = "hidden"` —— 那會繞過計數器，
 *    在疊層情境下把別人的鎖清掉，之後計數器再也回不到 0，
 *    整個 session 的捲動鎖就永久失效了。
 */

import { useEffect } from "react";
import { stopLenis, startLenis } from "@/lib/lenisInstance";

/** 全域開啟中的 overlay 數量計數器 */
let lockCount = 0;
/** 第一次上鎖前的 inline style，解鎖時原樣還原 */
let prevOverflow = "";
let prevPaddingRight = "";
let prevPosition = "";
let prevTop = "";
let prevWidth = "";
/** 上鎖當下的捲動位置，解鎖時捲回去 */
let lockedScrollY = 0;

/** 捲軸佔掉的寬度；沒有 overlay scrollbar 的平台（macOS 預設）會是 0 */
function getScrollbarWidth(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function lockScroll() {
  lockCount++;
  if (lockCount !== 1) return;

  const body = document.body;
  prevOverflow = body.style.overflow;
  prevPaddingRight = body.style.paddingRight;
  prevPosition = body.style.position;
  prevTop = body.style.top;
  prevWidth = body.style.width;
  lockedScrollY = window.scrollY || window.pageYOffset || 0;

  const scrollbarWidth = getScrollbarWidth();
  if (scrollbarWidth > 0) {
    // 用 computed padding 當基準，避免覆蓋既有的 padding-right
    const basePadding =
      parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${basePadding + scrollbarWidth}px`;
  }

  /*
   * 只有「頁面本身已經捲下去」時才需要 position: fixed 補償。
   * 光是 overflow:hidden 會讓瀏覽器把捲動位置歸零 —— 使用者會看到背景
   * 在 modal 後面跳回最頂端，關掉之後也回不去原位。
   * 用 top: -Ypx 把畫面釘在原處，解鎖時再 scrollTo 回去。
   * （後台編輯頁的捲動容器是內層 div、body 本身沒捲動，scrollY=0 時這段不會觸發。）
   */
  if (lockedScrollY > 0) {
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.width = "100%";
  }

  body.style.overflow = "hidden";
  stopLenis();
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;

  const body = document.body;
  body.style.overflow = prevOverflow;
  body.style.paddingRight = prevPaddingRight;
  body.style.position = prevPosition;
  body.style.top = prevTop;
  body.style.width = prevWidth;

  if (lockedScrollY > 0) {
    // 先還原 style 再捲回去，避免 smooth scroll 影響定位
    window.scrollTo(0, lockedScrollY);
  }

  prevOverflow = "";
  prevPaddingRight = "";
  prevPosition = "";
  prevTop = "";
  prevWidth = "";
  lockedScrollY = 0;
  startLenis();
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
