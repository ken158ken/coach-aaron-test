/**
 * GlowButton 元件 - 發光按鈕
 * @module components/ui/buttons/GlowButton
 */

import React from "react";
import { Link } from "react-router-dom";

interface GlowButtonProps {
  children: React.ReactNode;
  href?: string;
  to?: string;
  onClick?: () => void;
  variant?: "cyan" | "purple";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * GlowButton - 霓虹發光按鈕 (Abyss 主題)
 *
 * @param {GlowButtonProps} props - 元件屬性
 * @returns {JSX.Element} 發光按鈕
 */
const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  href,
  to,
  onClick,
  variant = "cyan",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
}) => {
  const variants = {
    cyan: `
      bg-transparent
      border-abyss-accent
      text-abyss-accent
      hover:bg-abyss-accent/20
      hover:shadow-[0_0_25px_rgba(0,255,255,0.7)]
      hover:scale-105
      active:scale-95
    `,
    purple: `
      bg-transparent
      border-abyss-glow
      text-abyss-glow
      hover:bg-abyss-glow/20
      hover:shadow-[0_0_25px_rgba(123,0,255,0.7)]
      hover:scale-105
      active:scale-95
    `,
  };

  const sizes = {
    sm: "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm",
    md: "px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base",
    lg: "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg",
  };

  const baseStyles = `
    inline-flex
    items-center
    justify-center
    gap-2
    border-2
    rounded-full
    font-medium
    uppercase
    tracking-wider
    transition-all
    duration-300
    ${variants[variant]}
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

export default GlowButton;
