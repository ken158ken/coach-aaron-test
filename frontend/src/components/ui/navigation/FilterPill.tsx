/**
 * FilterPill - Studio 篩選膠囊
 * @module components/ui/navigation/FilterPill
 */
import React from "react";

interface FilterOption { value: string; label: string; }

interface FilterPillProps {
  /** Single pill mode */
  label?: string;
  active?: boolean;
  onClick?: () => void;
  /** Multi-pill / select mode */
  options?: FilterOption[];
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
  theme?: string;
}

const FilterPill: React.FC<FilterPillProps> = ({
  label, active = false, onClick,
  options, value, onChange,
  className = "",
}) => {
  // Multi-option mode
  if (options && onChange !== undefined) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`filter-pill ${value === opt.value ? "active" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }
  // Single pill mode
  return (
    <button
      onClick={onClick}
      className={`filter-pill ${active ? "active" : ""} ${className}`}
    >
      {label}
    </button>
  );
};

export default FilterPill;
