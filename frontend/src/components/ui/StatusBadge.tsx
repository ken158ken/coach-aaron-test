/**
 * 狀態標籤元件
 * @module components/ui/StatusBadge
 */

import React from "react";
import { UI } from "@/lib/ui";

export type StatusType =
  | "draft"
  | "published"
  | "archived"
  | "active"
  | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  className = "",
}) => {
  const statusClass = UI.status[status] || "badge badge-ghost";

  return (
    <span className={`${statusClass} ${className}`}>{text || status}</span>
  );
};
