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
  /** 新手導覽定位錨點（tours/ 用 `[data-tour="..."]` 找元素） */
  "data-tour"?: string;
}

const PillButton: React.FC<PillButtonProps> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  active = false,
  className = "",
  "data-tour": dataTour,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-tour={dataTour}
      className={`filter-pill ${active ? "active" : ""} ${className}`}
      style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
    >
      {children}
    </button>
  );
};

export default PillButton;
