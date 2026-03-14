/**
 * 空狀態元件
 * @module components/ui/feedback/EmptyState
 */

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState - 空狀態顯示元件
 *
 * @param {React.ReactNode} icon - 圖示
 * @param {string} title - 標題
 * @param {string} description - 說明文字
 * @param {React.ReactNode} action - 操作按鈕
 * @param {string} className - 額外樣式
 * @returns {JSX.Element} 空狀態元件
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center py-16 text-center
        ${className}
      `}
    >
      {icon && <div className="text-6xl text-[#888]/30 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-white/60 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#888] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
