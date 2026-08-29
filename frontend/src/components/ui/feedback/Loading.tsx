/**
 * Loading 元件
 * @module components/ui/feedback/Loading
 */
import React from "react";
import { LogoMark } from "@/components/brand";

interface LoadingProps {
  text?: string;
  theme?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "w-6 h-6 border-2", md: "w-10 h-10 border-2", lg: "w-14 h-14 border-3" };

/** 圓環中央的 mark 尺寸，約為圓環直徑的一半 */
const markSizeMap = { sm: "w-3 h-3", md: "w-5 h-5", lg: "w-7 h-7" };

const Loading: React.FC<LoadingProps> = ({ text, size = "md", className = "" }) => (
  <div className={`flex flex-col items-center gap-3 ${className}`}>
    <div className="relative inline-flex items-center justify-center">
      <div
        className={`rounded-full border-white/20 border-t-white animate-spin ${sizeMap[size]}`}
        role="status"
        aria-label="loading"
      />
      {/* mark 置中且不跟著轉。這個 spinner 是白環設計（深色情境專用），
          所以 mark 也沿用 currentColor + 白色，維持同一套對比；
          若用酒紅原色在深底上幾乎看不見。 */}
      <LogoMark
        color="currentColor"
        className={`absolute text-white/85 pointer-events-none ${markSizeMap[size]}`}
      />
    </div>
    {text && <p className="text-sm text-muted tracking-widest uppercase">{text}</p>}
  </div>
);

export default Loading;
