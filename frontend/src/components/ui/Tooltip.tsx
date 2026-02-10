/**
 * 全域即時 Tooltip 元件
 * @module components/ui/Tooltip
 * @description 滑鼠 hover 立即顯示的小型提示，取代原生 title 屬性
 * 使用 CSS-only 方案，零延遲顯示，12px 字體
 */

import React from "react";

interface TooltipProps {
  /** 提示文字 */
  label: string;
  /** 包裹的子元件 */
  children: React.ReactNode;
  /** 顯示位置 */
  position?: "top" | "bottom" | "left" | "right";
  /** 額外的 className */
  className?: string;
}

/**
 * Tooltip 元件 - 即時 hover 提示
 *
 * @param {TooltipProps} props - 元件屬性
 * @returns {JSX.Element} Tooltip 包裹元件
 *
 * @example
 * ```tsx
 * <Tooltip label="粗體 (Ctrl+B) - 讓文字變粗">
 *   <button>B</button>
 * </Tooltip>
 * ```
 */
const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  position = "top",
  className = "",
}) => {
  if (!label) {
    return <>{children}</>;
  }

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  const arrowClasses: Record<string, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent",
  };

  return (
    <span className={`tooltip-wrapper ${className}`}>
      {children}
      <span
        className={`tooltip-content ${positionClasses[position]}`}
        role="tooltip"
      >
        {label}
        <span className={`tooltip-arrow ${arrowClasses[position]}`} />
      </span>
    </span>
  );
};

export default Tooltip;
