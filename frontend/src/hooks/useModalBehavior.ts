/**
 * useModalBehavior — 手寫 overlay 的共用行為
 *
 * 專案裡除了 `components/ui/Dialog.tsx` 與 `components/ui/overlay/Modal.tsx`
 * 兩套 modal 元件之外，還有不少頁面直接寫 `fixed inset-0` 的手寫彈窗
 * （分類管理、使用說明、白名單、RichTextEditor 的插圖/影片/連結…）。
 * 那些手寫彈窗常常漏掉兩件事：
 *   1. 沒有鎖 body 捲動 → 滑鼠滾輪落在彈窗上時背景還在滾
 *   2. 沒有吃 Escape → 只能用 ✕ 關
 *
 * 這支 hook 把兩件事包成一行，讓手寫彈窗跟共用元件行為一致，
 * 而且 Escape 走共用堆疊：疊兩層時只關最上面那層。
 *
 * @example
 * useModalBehavior(showCategoryModal, () => setShowCategoryModal(false));
 */

import { useScrollLock } from "./useScrollLock";
import { useOverlayEscape } from "./useOverlayEscape";

export function useModalBehavior(isOpen: boolean, onClose?: () => void): void {
  useScrollLock(isOpen);
  useOverlayEscape(isOpen, onClose);
}

export default useModalBehavior;
