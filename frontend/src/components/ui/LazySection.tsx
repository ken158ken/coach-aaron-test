/**
 * LazySection - 延遲渲染的 section wrapper
 * @module components/ui/LazySection
 * @description 使用 IntersectionObserver，當元素接近視窗時才實際渲染子元素的 DOM。
 *              適用於頁面下方不需要立即呈現的長 section（Podcast、Review 等），
 *              減少初始渲染的 DOM 節點數量。
 *
 *              rootMargin 預設 "400px" = 距離視窗還有 400px 時就開始渲染，
 *              確保使用者捲動到時不會看到空白閃爍。
 */

import React, { useRef, useState, useEffect } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  /** 預留高度，避免 layout shift（設定約等於實際高度） */
  minHeight?: string;
  /** 提前渲染的距離，預設 "400px" */
  rootMargin?: string;
  className?: string;
}

const LazySection: React.FC<LazySectionProps> = ({
  children,
  minHeight = "400px",
  rootMargin = "600px", // 原 400px → 600px：在使用者接近前 600px 就先渲染，避免捲到時才冒出
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: visible ? undefined : minHeight }}
    >
      {visible && children}
    </div>
  );
};

export default LazySection;
