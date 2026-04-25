/**
 * UnreadBadge — 未讀數紅圈
 * @module components/chat/UnreadBadge
 */

import React from "react";

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, className = "" }) => {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none ${className}`}
    >
      {display}
    </span>
  );
};

export default UnreadBadge;
