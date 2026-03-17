/**
 * GlowButton (Metal 風格) - Studio 主要按鈕
 * @module components/ui/buttons/GlowButton
 */
import React from "react";
import { Link } from "react-router-dom";
import { useMagnetic } from "@/hooks/useMagnetic";

export interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  theme?: string;
  variant?: string;
}

const GlowButton: React.FC<GlowButtonProps> = ({
  children, onClick, to, type = "button", disabled = false, className = "",
}) => {
  const magneticRef = useMagnetic(0.35); // 磁吸強度
  const cls = `btn-metal active:scale-95 transition-transform will-change-transform ${className}`;
  const style = disabled ? { opacity: 0.5, cursor: "not-allowed" as const } : {};
  
  if (to) {
    return (
      <Link 
        ref={magneticRef as any}
        to={to} 
        className={cls} 
        style={style}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <button 
      ref={magneticRef as any}
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      className={cls} 
      style={style}
    >
      {children}
    </button>
  );
};

export default GlowButton;
