/**
 * 統計卡片元件
 * @module components/ui/StatCard
 */

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: number;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className = "",
}) => {
  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-base-content/60">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-sm text-base-content/50 mt-1">{description}</p>
            )}
          </div>
          {icon && <div className="text-4xl text-primary/30">{icon}</div>}
        </div>
        {trend !== undefined && (
          <div
            className={`mt-2 text-sm ${
              trend > 0 ? "text-success" : "text-error"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};
