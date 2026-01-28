/**
 * TextButton 元件 - 文字按鈕
 * @module components/ui/buttons/TextButton
 */

import React from "react";
import { Link } from "react-router-dom";

interface TextButtonProps {
  children: React.ReactNode;
  href?: string;
  to?: string;
  onClick?: () => void;
  theme?: "abyss" | "prism" | "luxe";
  withArrow?: boolean;
  className?: string;
}

/**
 * TextButton - 簡約文字按鈕
 *
 * @param {TextButtonProps} props - 元件屬性
 * @returns {JSX.Element} 文字按鈕
 */
const TextButton: React.FC<TextButtonProps> = ({
  children,
  href,
  to,
  onClick,
  theme = "luxe",
  withArrow = true,
  className = "",
}) => {
  const themes = {
    abyss:
      "text-abyss-accent hover:text-abyss-accent/80 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-abyss-accent after:transition-all after:duration-300 hover:after:w-full",
    prism:
      "text-prism-accent hover:text-prism-accent/80 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-prism-accent after:transition-all after:duration-300 hover:after:w-full",
    luxe: "text-luxe-gold hover:text-luxe-gold/80 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-luxe-gold after:transition-all after:duration-300 hover:after:w-full",
  };

  const baseStyles = `
    inline-flex
    items-center
    gap-2
    font-light
    tracking-wider
    uppercase
    text-sm
    transition-colors
    duration-300
    ${themes[theme]}
    ${className}
  `;

  const arrow = withArrow && (
    <span className="transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={`group ${baseStyles}`}>
        {children}
        {arrow}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={`group ${baseStyles}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        {arrow}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`group ${baseStyles}`}>
      {children}
      {arrow}
    </button>
  );
};

export default TextButton;
