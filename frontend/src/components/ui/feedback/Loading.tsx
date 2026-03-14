/**
 * Loading 元件
 * @module components/ui/feedback/Loading
 */
import React from "react";

interface LoadingProps {
  text?: string;
  theme?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "w-6 h-6 border-2", md: "w-10 h-10 border-2", lg: "w-14 h-14 border-3" };

const Loading: React.FC<LoadingProps> = ({ text, size = "md", className = "" }) => (
  <div className={`flex flex-col items-center gap-3 ${className}`}>
    <div
      className={`rounded-full border-white/20 border-t-white animate-spin ${sizeMap[size]}`}
      role="status"
      aria-label="loading"
    />
    {text && <p className="text-sm text-[#888] tracking-widest uppercase">{text}</p>}
  </div>
);

export default Loading;
