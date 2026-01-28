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
  theme?: "abyss" | "prism" | "luxe";
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
  theme = "luxe",
  className = "",
}) => {
  const themeStyles = {
    abyss: {
      card: "bg-abyss-bg/50 border-abyss-accent/30 hover:border-abyss-accent/60 hover:shadow-lg hover:shadow-abyss-accent/10 transition-all duration-300",
      value: "text-abyss-accent",
      label: "text-abyss-text/70",
      trend: trend?.direction === "up" ? "text-abyss-accent" : "text-red-400",
    },
    prism: {
      card: "bg-prism-bg/50 border-prism-accent/30 hover:border-prism-accent/60 hover:shadow-lg hover:shadow-prism-accent/10 transition-all duration-300",
      value: "text-prism-accent",
      label: "text-prism-text/70",
      trend: trend?.direction === "up" ? "text-prism-accent" : "text-red-400",
    },
    luxe: {
      card: "bg-luxe-surface border-luxe-gold/30 hover:border-luxe-gold/60 hover:shadow-lg hover:shadow-luxe-gold/10 transition-all duration-300",
      value: "text-luxe-gold",
      label: "text-luxe-muted",
      trend: trend?.direction === "up" ? "text-green-400" : "text-red-400",
    },
  };

  const styles = themeStyles[theme];

  return (
    <div
      className={`
        border
        rounded-lg
        p-3
        sm:p-5
        ${styles.card}
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        {icon && <span className={`text-lg sm:text-2xl ${styles.value}`}>{icon}</span>}
        {trend && (
          <span className={`text-[10px] sm:text-sm ${styles.trend}`}>
            {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className={`text-xl sm:text-3xl font-bold ${styles.value} mb-0.5 sm:mb-1`}>{value}</p>
      <p className={`text-xs sm:text-sm ${styles.label}`}>{label}</p>
    </div>
  );
};

export default StatCard;
