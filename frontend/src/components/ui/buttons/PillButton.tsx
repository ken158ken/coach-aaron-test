/**
 * PillButton - Studio 圓角按鈕
 * @module components/ui/buttons/PillButton
 */

import React from "react";

interface PillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  active?: boolean;
  className?: string;
  theme?: string;
  variant?: "default" | "active" | "primary" | "outline" | "filled" | "secondary";
  size?: "sm" | "md" | "lg" | "xs" | "xl";
}

const PillButton: React.FC<PillButtonProps> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  active = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`filter-pill ${active ? "active" : ""} ${className}`}
      style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
    >
      {children}
    </button>
  );
};

export default PillButton;
