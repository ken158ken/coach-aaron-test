/**
 * 搜尋輸入框元件
 * @module components/ui/form/SearchInput
 */

import React from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchInput - 搜尋輸入框元件
 *
 * @param {string} value - 搜尋值
 * @param {Function} onChange - 變更回調
 * @param {string} placeholder - 佔位文字
 * @param {string} className - 額外樣式
 * @returns {JSX.Element} 搜尋輸入框
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "搜尋...",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-10 pr-4 py-2.5
          bg-luxe-surface border border-luxe-gold/20 rounded-lg
          text-luxe-text placeholder:text-luxe-muted/50
          focus:outline-none focus:border-luxe-gold/40
          transition-colors
        "
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-muted"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
};

export default SearchInput;
