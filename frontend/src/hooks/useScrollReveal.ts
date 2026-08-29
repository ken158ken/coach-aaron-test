/**
 * useScrollReveal Hook - 滾動入場動畫
 * @module hooks/useScrollReveal
 * @description 使用 IntersectionObserver 偵測元素進入視窗，
 *              觸發 CSS class 切換實現低調的淡入動畫。
 *              搭配 index.css 中的 `.scroll-reveal` / `.is-visible` 使用。
 *
 *              使用 callback ref + MutationObserver 確保
 *              動態載入的子元素也能被正確觀察。
 */

import { useEffect, useState, useCallback } from "react";

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[ScrollReveal] ${msg}`),
};

interface UseScrollRevealOptions {
  /** 觸發門檻 (0~1)，預設 0.15 表示元素 15% 可見即觸發 */
  threshold?: number;
  /** 提前觸發的邊距，預設 "0px 0px -40px 0px" */
  rootMargin?: string;
  /** 是否只觸發一次，預設 true */
  once?: boolean;
}

/**
 * 滾動入場動畫 Hook
 *
 * @description 回傳 callback ref，掛在容器上即可自動為
 *              內部所有 `.scroll-reveal` 子元素添加入場動畫。
 *              支援動態載入的內容（如 API 回傳後渲染的卡片）。
 *
 * @example
 * ```tsx
 * const containerRef = useScrollReveal();
 * return (
 *   <div ref={containerRef}>
 *     <div className="scroll-reveal">淡入元素</div>
 *     <div className="scroll-reveal stagger-2">延遲淡入</div>
 *   </div>
 * );
 * ```
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -40px 0px",
    once = true,
  } = options;

  // 使用 state 追蹤容器元素，當容器從 null 變為 DOM 節點時觸發 useEffect
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // callback ref：React 會在元素掛載/卸載時呼叫
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) return;

    // 尊重使用者動畫偏好
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const makeVisible = (el: Element) => el.classList.add("is-visible");

    if (prefersReducedMotion) {
      container.querySelectorAll(".scroll-reveal").forEach(makeVisible);
      // 監聽動態新增的子元素
      const mo = new MutationObserver(() => {
        container
          .querySelectorAll(".scroll-reveal:not(.is-visible)")
          .forEach(makeVisible);
      });
      mo.observe(container, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold, rootMargin },
    );

    // 已追蹤的元素集合，避免重複觀察
    const tracked = new WeakSet<Element>();

    const observeNewElements = () => {
      container.querySelectorAll(".scroll-reveal").forEach((el) => {
        if (!tracked.has(el)) {
          tracked.add(el);
          observer.observe(el);
        }
      });
    };

    // 觀察已存在的元素
    observeNewElements();

    // 監聽 DOM 變化，自動觀察動態新增的 .scroll-reveal 元素
    const mutationObserver = new MutationObserver(() => {
      observeNewElements();
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    logger.info(
      `觀察 ${container.querySelectorAll(".scroll-reveal").length} 個滾動入場元素`,
    );

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [container, threshold, rootMargin, once]);

  return callbackRef;
}

/**
 * 產生 stagger class 的工具函式
 *
 * @param index - 元素索引 (從 0 開始)
 * @returns 對應的 stagger CSS class，例如 "stagger-1"
 */
export function getStaggerClass(index: number): string {
  const clampedIndex = Math.min(index + 1, 9);
  return `stagger-${clampedIndex}`;
}

export default useScrollReveal;
