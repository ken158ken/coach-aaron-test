/**
 * 狀態標籤元件
 * @module components/ui/feedback/StatusBadge
 */

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export type StatusType =
  | "draft"
  | "published"
  | "archived"
  | "active"
  | "inactive"
  | "pending";

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  active: "bg-[rgba(197,160,89,0.2)] text-[#c5a059] border-[#c5a059]/30",
  inactive: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};



/**
 * StatusBadge - 狀態標籤元件
 *
 * @param {StatusType} status - 狀態類型
 * @param {string} text - 自定義文字
 * @param {string} className - 額外樣式
 * @returns {JSX.Element} 狀態標籤
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  className = "",
}) => {
  const { t } = useLanguage();
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 text-xs font-medium
        rounded-full border
        ${statusStyles[status] || statusStyles.draft}
        ${className}
      `}
    >
      {text || t.statusBadge[status] || status}
    </span>
  );
};

export default StatusBadge;
