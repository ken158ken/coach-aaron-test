/**
 * 載入中元件
 * @module components/ui/LoadingSpinner
 */

import React from "react";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      <span
        className={`loading loading-spinner loading-${size} text-primary`}
      ></span>
      {text && <p className="mt-2 text-base-content/60">{text}</p>}
    </div>
  );
};
