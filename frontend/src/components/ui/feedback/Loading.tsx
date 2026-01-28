/**
 * Loading 元件 - 載入狀態
 * @module components/ui/feedback/Loading
 */

import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  theme?: "abyss" | "prism" | "luxe";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Loading - 載入狀態元件
 *
 * @param {LoadingProps} props - 元件屬性
 * @returns {JSX.Element} 載入元件
 */
const Loading: React.FC<LoadingProps> = ({
  size = "md",
  theme = "luxe",
  text,
  fullScreen = false,
  className = "",
}) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const themes = {
    abyss: "border-abyss-accent",
    prism: "border-prism-accent",
    luxe: "border-luxe-gold",
  };

  const spinner = (
    <div
      className={`
        ${sizes[size]}
        border-2
        border-t-transparent
        ${themes[theme]}
        rounded-full
        animate-spin
      `}
    />
  );

  const content = (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {spinner}
      {text && (
        <p
          className={`text-sm ${
            theme === "abyss"
              ? "text-abyss-text/70"
              : theme === "prism"
                ? "text-prism-text/70"
                : "text-luxe-muted"
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
