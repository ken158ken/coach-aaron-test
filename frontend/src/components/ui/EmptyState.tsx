/**
 * 空狀態元件
 * @module components/ui/EmptyState
 */

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      {icon && <div className="text-6xl text-base-content/20 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-base-content/70">{title}</h3>
      {description && (
        <p className="text-sm text-base-content/50 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
