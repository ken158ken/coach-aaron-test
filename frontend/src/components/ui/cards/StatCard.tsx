/**
 * StatCard 元件 - 統計數據卡片（Aceternity Number Ticker 風格）
 * @module components/ui/cards/StatCard
 */

import React, { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  theme?: string;
  className?: string;
}

/**
 * NumberTicker - 數字滾動計數動畫
 * 當 value 為數字時啟動，從 0 計數至目標值
 */
const NumberTicker: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "" }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1], // expo out — fast then slow
      onUpdate(latest) {
        node.textContent =
          Math.round(latest).toLocaleString() + suffix;
      },
    });

    return () => controls.stop();
  }, [value, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
};

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  trend,
  className = "",
}) => {
  // 解析數字和後綴（如 "1,234 人" 或 42 或 "98%"）
  const isNumeric = typeof value === "number" || /^[\d,]+/.test(String(value));
  const numericVal = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  const suffix = typeof value === "string" ? String(value).replace(/^[\d,.]+/, "") : "";

  return (
    <div
      className={`
        border
        rounded-lg
        p-3
        sm:p-5
        studio-card
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        {icon && <span className="text-lg sm:text-2xl text-[#c5a059]">{icon}</span>}
        {trend && (
          <span className="text-[10px] sm:text-sm text-[#c5a059]">
            {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-xl sm:text-3xl font-bold text-[#c5a059] mb-0.5 sm:mb-1">
        {isNumeric && !isNaN(numericVal) ? (
          <NumberTicker value={numericVal} suffix={suffix} />
        ) : (
          value
        )}
      </p>
      <p className="text-xs sm:text-sm text-[#888]">{label}</p>
    </div>
  );
};

export default StatCard;
