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
        pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 text-center
        ${className}
      `}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-luxe-text mb-2 sm:mb-3">{title}</h1>
      {subtitle && <p className="text-sm sm:text-base text-luxe-muted max-w-xl mx-auto">{subtitle}</p>}
      {actions && <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">{actions}</div>}
    </div>
  );
};

export default PageHeader;
