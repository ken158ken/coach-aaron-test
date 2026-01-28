/**
 * 切換開關元件
 * @module components/ui/form/Toggle
 */

import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Toggle - 切換開關元件
 *
 * @param {boolean} checked - 是否選中
 * @param {Function} onChange - 變更回調
 * @param {string} label - 標籤文字
 * @param {boolean} disabled - 是否停用
 * @param {string} className - 額外樣式
 * @returns {JSX.Element} 切換開關
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
      className={`
        inline-flex items-center gap-3 cursor-pointer
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-all duration-300
            ${checked ? "bg-luxe-gold shadow-md shadow-luxe-gold/30" : "bg-luxe-surface border border-luxe-gold/30 hover:border-luxe-gold/60"}
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full
            bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </div>
      {label && <span className="text-sm text-luxe-text">{label}</span>}
    </label>
  );
};

export default Toggle;
