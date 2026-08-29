/**
 * useOverlayEscape — 疊層 Escape 的統一處理
 *
 * 問題：每個 modal 各自 `window.addEventListener("keydown")` 監聽 Escape，
 * 疊兩層時按一次 Escape 會「兩層一起關掉」——使用者只想關掉最上面那層。
 *
 * 作法：所有 overlay 註冊到同一個堆疊，Escape 只交給堆疊最頂端那個處理。
 * 註冊順序 = 開啟順序，所以最後開的就是最上層。
 *
 * ⚠️ 新的 modal / overlay 請一律用這支（或用包好的 useModalBehavior），
 *    不要再自己掛 window keydown。
 */

import { useEffect, useRef } from "react";

/** 目前開啟中的 overlay 關閉函式，最後一個 = 最上層 */
const stack: Array<{ close: () => void }> = [];
let listening = false;

function handleKeyDown(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  const top = stack[stack.length - 1];
  if (top) top.close();
}

function ensureListener() {
  if (listening || typeof window === "undefined") return;
  window.addEventListener("keydown", handleKeyDown);
  listening = true;
}

/**
 * 把 overlay 註冊到 Escape 堆疊。
 *
 * @param isOpen  是否開啟中
 * @param onClose 關閉回呼；沒給就不註冊（例如不允許 Escape 關閉的彈窗）
 */
export function useOverlayEscape(isOpen: boolean, onClose?: () => void): void {
  /*
   * onClose 存在 ref 裡，effect 只依賴 isOpen。
   *
   * ⚠️ 這一點很關鍵：呼叫端幾乎都是寫成 inline 箭頭函式
   *    （例：useModalBehavior(open, () => setOpen(false))），
   *    每次 render 都是新的函式。如果 effect 依賴 onClose，
   *    父層一 re-render 就會「取消註冊再重新註冊」，把自己推回堆疊頂端 ——
   *    結果疊第二層時按 Escape 關掉的會是「下面那層」而不是最上層。
   */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const enabled = isOpen && !!onClose;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    ensureListener();
    // 用物件包起來，卸載時才能精準移除自己這一筆
    const entry = { close: () => onCloseRef.current?.() };
    stack.push(entry);

    return () => {
      const i = stack.lastIndexOf(entry);
      if (i !== -1) stack.splice(i, 1);
    };
  }, [enabled]);
}

export default useOverlayEscape;
