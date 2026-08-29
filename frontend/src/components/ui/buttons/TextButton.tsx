/**
 * TextButton - Studio 文字按鈕
 * @module components/ui/buttons/TextButton
 */
import React from "react";
import { Link } from "react-router-dom";

export interface TextButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  theme?: string;
}

const TextButton: React.FC<TextButtonProps> = ({
  children, onClick, to, type = "button", disabled = false, className = "",
}) => {
  const cls = `nav-link inline-block ${className}`;
  const style = disabled ? { opacity: 0.5, cursor: "not-allowed" as const } : {};
  if (to) {
    return <Link to={to} className={cls} style={style}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
};

export default TextButton;
