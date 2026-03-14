/**
 * StatCard 元件 - 統計數據卡片
 * @module components/ui/cards/StatCard
 */

import React from "react";

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
 * StatCard - 通用統計數據卡片
 *
 * @param {StatCardProps} props - 元件屬性
 * @returns {JSX.Element} 統計卡片
 */
const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  trend,
  className = "",
}) => {

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
        {icon && <span className={`text-lg sm:text-2xl text-[#c5a059]`}>{icon}</span>}
        {trend && (
          <span className={`text-[10px] sm:text-sm text-[#c5a059]`}>
            {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className={`text-xl sm:text-3xl font-bold text-[#c5a059] mb-0.5 sm:mb-1`}>{value}</p>
      <p className={`text-xs sm:text-sm text-[#888]`}>{label}</p>
    </div>
  );
};

export default StatCard;
