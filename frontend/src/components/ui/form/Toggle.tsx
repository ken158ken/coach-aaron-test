/**
 * 切換開關元件 — 雙標籤式，左右同時顯示「關/開」清楚分辨狀態
 * @module components/ui/form/Toggle
 */

import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  /** 主題樣式 (abyss | prism | luxe) */
  theme?: string;
}

/**
 * Toggle - 雙標籤切換開關
 * 左側「關」右側「開」同時顯示，當前狀態高亮，一目了然
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  return (
    <label
      className={`inline-flex items-center gap-3 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`flex rounded-full overflow-hidden border transition-all duration-200 ${
          checked ? "border-luxe-gold/40" : "border-white/15"
        }`}
      >
        {/* 關 side */}
        <span
          className={`px-3 py-1 text-xs font-medium transition-all duration-200 select-none ${
            !checked
              ? "bg-white/15 text-white/90"
              : "bg-transparent text-white/25"
          }`}
        >
          關
        </span>
        {/* 開 side */}
        <span
          className={`px-3 py-1 text-xs font-medium transition-all duration-200 select-none ${
            checked
              ? "bg-luxe-gold text-black font-semibold"
              : "bg-transparent text-white/25"
          }`}
        >
          開
        </span>
      </button>
      {label && <span className="text-sm text-luxe-text">{label}</span>}
    </label>
  );
};

export default Toggle;
