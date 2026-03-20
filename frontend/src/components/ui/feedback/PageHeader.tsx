/**
 * 頁面標題元件
 * @module components/ui/feedback/PageHeader
 */

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader - 頁面標題元件（統一樣式：英文小標 → h1 → 副標題）
 * 掛載時自動播放 GSAP 入場動畫，子元素依序滑入。
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  label,
  actions,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.children,
        { y: 28, opacity: 0, skewX: -3 },
        { y: 0, opacity: 1, skewX: 0, duration: 0.9, ease: "expo.out", stagger: 0.12 },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={`text-center mb-8 sm:mb-12 ${className}`}>
      {label && (
        <span className="inline-block text-[#d4d4d4] text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
          {label}
        </span>
      )}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white/90 mb-3 sm:mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
          {subtitle}
        </p>
      )}
      {actions && (
        <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
