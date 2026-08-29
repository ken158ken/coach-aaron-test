/**
 * Lenis 模組單例
 * SmoothScroll.tsx 初始化後呼叫 setLenisInstance 注入實例，
 * 各 modal/overlay 元件透過 stopLenis / startLenis 暫停/恢復捲動，
 * 避免 modal 開啟時頁面在底下繼續滾動。
 */

let _lenis: { stop: () => void; start: () => void } | null = null;

export function setLenisInstance(
  lenis: { stop: () => void; start: () => void } | null,
): void {
  _lenis = lenis;
}

export function stopLenis(): void {
  _lenis?.stop();
}

export function startLenis(): void {
  _lenis?.start();
}
