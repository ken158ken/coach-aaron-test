/**
 * PrismCard 元件 - 水晶主題卡片
 * @module components/ui/cards/PrismCard
 */

import React from "react";

interface PrismCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "glass" | "solid";
  hover?: boolean;
}

/**
 * PrismCard - VOID PRISM 主題卡片元件
 *
 * @param {PrismCardProps} props - 元件屬性
 * @returns {JSX.Element} 水晶風格卡片
 */
const PrismCard: React.FC<PrismCardProps> = ({
  children,
  className = "",
  variant = "glass",
  hover = true,
}) => {
  const variantStyles = {
    glass:
      "prism-card bg-prism-bg/40 backdrop-blur-md border border-prism-accent/30",
    solid: "bg-prism-bg/80 border border-prism-muted/20",
  };

  return (
    <div
      className={`
        ${variantStyles[variant]}
        rounded-xl
        p-6
        transition-all
        duration-300
        ${hover ? "hover:border-prism-accent/60 hover:-translate-y-1" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default PrismCard;
