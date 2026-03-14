/**
 * AbyssCard 元件 - 深海主題卡片
 * @module components/ui/cards/AbyssCard
 */

import React from "react";

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
  const glowColors = {
    cyan: "hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]",
    purple: "hover:shadow-[0_0_30px_rgba(123,0,255,0.4)]",
    none: "",
  };

  const glowBorder = {
    cyan: "border-white/15",
    purple: "border-white/15",
    none: "border-transparent",
  };

  return (
    <div
      className={`
        studio-card
        bg-[#050505]/50
        backdrop-blur-sm
        rounded-xl
        border
        ${glowBorder[glow]}
        p-4
        sm:p-6
        transition-all
        duration-300
        ${hover ? glowColors[glow] : ""}
        ${hover ? "hover:-translate-y-1" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default AbyssCard;
