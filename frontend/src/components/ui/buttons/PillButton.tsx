/**
 * PillButton 元件 - 膠囊按鈕
 * @module components/ui/buttons/PillButton
 */

import React from "react";
import { Link } from "react-router-dom";

interface PillButtonProps {
  children: React.ReactNode;
  href?: string;
  to?: string;
  onClick?: () => void;
  variant?: "filled" | "outline";
  theme?: "abyss" | "prism" | "luxe";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * PillButton - 膠囊形狀按鈕
 *
 * @param {PillButtonProps} props - 元件屬性
 * @returns {JSX.Element} 膠囊按鈕
 */
const PillButton: React.FC<PillButtonProps> = ({
  children,
  href,
  to,
  onClick,
  variant = "outline",
  theme = "luxe",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
}) => {
  const themes = {
    abyss: {
      filled:
        "bg-abyss-accent text-abyss-bg hover:bg-abyss-accent/80 hover:shadow-lg hover:shadow-abyss-accent/30 hover:scale-105 active:scale-95",
      outline:
        "border-abyss-accent text-abyss-accent hover:bg-abyss-accent/10 hover:shadow-md hover:shadow-abyss-accent/20 hover:scale-105 active:scale-95",
    },
    prism: {
      filled:
        "bg-prism-accent text-prism-bg hover:bg-prism-accent/80 hover:shadow-lg hover:shadow-prism-accent/30 hover:scale-105 active:scale-95",
      outline:
        "border-prism-accent text-prism-accent hover:bg-prism-accent/10 hover:shadow-md hover:shadow-prism-accent/20 hover:scale-105 active:scale-95",
    },
    luxe: {
      filled:
        "bg-luxe-gold text-black hover:bg-luxe-gold/80 hover:shadow-lg hover:shadow-luxe-gold/30 hover:scale-105 active:scale-95",
      outline:
        "border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10 hover:shadow-md hover:shadow-luxe-gold/20 hover:scale-105 active:scale-95",
    },
  };

  const sizes = {
    sm: "px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs",
    md: "px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm",
    lg: "px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base",
  };

  const baseStyles = `
    inline-flex
    items-center
    justify-center
    border
    rounded-full
    uppercase
    tracking-widest
    font-light
    transition-all
    duration-300
    ${themes[theme][variant]}
    ${sizes[size]}
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    ${className}
  `;

  if (to) {
    return (
      <Link to={to} className={baseStyles}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={baseStyles}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
    >
      {children}
    </button>
  );
};

export default PillButton;
