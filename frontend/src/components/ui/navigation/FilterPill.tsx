/**
 * FilterPill 元件 - 篩選膠囊
 * @module components/ui/navigation/FilterPill
 */

import React from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  theme?: "abyss" | "prism" | "luxe";
  className?: string;
}

/**
 * FilterPill - 篩選選項膠囊元件
 *
 * @param {FilterPillProps} props - 元件屬性
 * @returns {JSX.Element} 篩選膠囊
 */
const FilterPill: React.FC<FilterPillProps> = ({
  options,
  value,
  onChange,
  theme = "prism",
  className = "",
}) => {
  const themes = {
    abyss: {
      container: "bg-abyss-bg/50 border-abyss-accent/30",
      active:
        "bg-abyss-accent text-black font-semibold shadow-lg shadow-abyss-accent/30",
      inactive:
        "text-abyss-text/70 hover:text-abyss-accent border border-transparent",
    },
    prism: {
      container: "bg-prism-bg/50 border-prism-accent/30",
      active:
        "bg-prism-accent text-black font-semibold shadow-lg shadow-prism-accent/30",
      inactive:
        "text-prism-text/70 hover:text-prism-accent border border-transparent",
    },
    luxe: {
      container: "bg-luxe-surface border-luxe-gold/30",
      active:
        "bg-luxe-gold text-black font-semibold shadow-lg shadow-luxe-gold/30",
      inactive:
        "text-luxe-muted hover:text-luxe-gold border border-transparent hover:border-luxe-gold/50",
    },
  };

  const styles = themes[theme];

  return (
    <div
      className={`
        filter-pill
        inline-flex
        p-1
        rounded-full
        border
        ${styles.container}
        ${className}
      `}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4
            py-2
            text-sm
            rounded-full
            transition-all
            duration-300
            ${value === option.value ? styles.active : styles.inactive}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default FilterPill;
