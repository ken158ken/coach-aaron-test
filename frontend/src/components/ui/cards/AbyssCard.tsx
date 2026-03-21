/**
 * AbyssCard 元件 - 深海主題卡片
 * @module components/ui/cards/AbyssCard
 */

import React from "react";
import { motion } from "framer-motion";

interface AbyssCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "none";
  hover?: boolean;
}

/**
 * AbyssCard - THE ABYSS 主題卡片元件
 *
 * @param {AbyssCardProps} props - 元件屬性
 * @returns {JSX.Element} 深海風格卡片
 */
const AbyssCard: React.FC<AbyssCardProps> = ({
  children,
  className = "",
  glow = "cyan",
  hover = true,
}) => {
  const hoverGlow = {
    cyan: "0 8px 40px rgba(0,255,255,0.35)",
    purple: "0 8px 40px rgba(123,0,255,0.35)",
    none: "none",
  };

  const glowBorderColor = {
    cyan: "rgba(255,255,255,0.28)",
    purple: "rgba(180,120,255,0.35)",
    none: "transparent",
  };

  return (
    <motion.div
      className={`studio-card bg-[#050505]/50 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6 ${className}`}
      whileHover={hover ? {
        y: -8,
        boxShadow: hoverGlow[glow],
        borderColor: glowBorderColor[glow],
      } : undefined}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
};

export default AbyssCard;
