/**
 * PresenceDot — 在線狀態圓點
 * @module components/chat/PresenceDot
 */

import React from "react";
import type { PresenceStatus } from "@/services/presence.service";

interface PresenceDotProps {
  status: PresenceStatus;
  size?: "sm" | "md";
  withRing?: boolean;
}

const COLORS: Record<PresenceStatus, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-zinc-500",
};

const PresenceDot: React.FC<PresenceDotProps> = ({
  status,
  size = "sm",
  withRing = true,
}) => {
  const sizeCls = size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";
  return (
    <span
      className={`inline-block rounded-full ${COLORS[status]} ${sizeCls} ${
        withRing ? "ring-2 ring-surface" : ""
      }`}
      aria-label={status}
    />
  );
};

export default PresenceDot;
