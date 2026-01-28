/**
 * 頁面標題元件
 * @module components/ui/feedback/PageHeader
 */

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader - 頁面標題元件
 *
 * @param {string} title - 標題
 * @param {string} subtitle - 副標題
 * @param {React.ReactNode} actions - 操作區塊
 * @param {string} className - 額外樣式
 * @returns {JSX.Element} 頁面標題
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8
        ${className}
      `}
    >
      <div>
        <h1 className="text-2xl font-light text-luxe-text">{title}</h1>
        {subtitle && <p className="text-luxe-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
};

export default PageHeader;
