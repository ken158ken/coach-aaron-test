/**
 * LazySection - 延遲「繪製」的 section wrapper
 * @module components/ui/LazySection
 * @description 用 CSS `content-visibility: auto` 讓瀏覽器在元素離視窗還遠時
 *              跳過 layout / paint，效能收益等同原本的 IntersectionObserver 版，
 *              但 children 一律進入 DOM——因此 SSR HTML 會完整輸出內容，
 *              不會出現「hydration 前往下捲看到空白」的問題（SEO 也吃得到內文）。
 *
 *              舊版以 `useState(false)` + IntersectionObserver 控制 `{visible && children}`，
 *              SSR 時 visible 恆為 false → 首頁下方三個 section 在 SSR HTML 中是空 div，
 *              JS 載完前使用者看到的就是真空。勿改回該模式。
 *
 *              `containIntrinsicSize` 以 minHeight 當佔位高度估值，避免捲動條跳動；
 *              不支援 content-visibility 的舊瀏覽器會直接完整渲染（行為正確、只是少了優化）。
 */

import React from "react";

interface LazySectionProps {
  children: React.ReactNode;
  /** 預留高度估值，供 contain-intrinsic-size 使用（設定約等於實際高度） */
  minHeight?: string;
  className?: string;
}

const LazySection: React.FC<LazySectionProps> = ({
  children,
  minHeight = "400px",
  className = "",
}) => (
  <div
    className={className}
    style={
      {
        contentVisibility: "auto",
        // 不用「auto <length>」寫法：auto 關鍵字要 Chrome 111 / FF 107 /
        // Safari 17 才支援，在 Chrome 85–110 整條宣告會失效 → 被跳過的
        // 子樹高度變 0，捲軸劇烈跳動。純長度值在所有支援
        // content-visibility 的瀏覽器都有效。
        containIntrinsicSize: minHeight,
      } as React.CSSProperties
    }
  >
    {children}
  </div>
);

export default LazySection;
