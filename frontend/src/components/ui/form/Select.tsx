/**
 * Select - Studio 下拉選單
 * @module components/ui/form/Select
 */

import React, { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  theme?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label style={{ fontSize: "0.8rem", color: "#888", letterSpacing: "1px", textTransform: "uppercase" }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`studio-input ${className}`}
          style={{ cursor: "pointer" }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: "#141414", color: "#f0f0f0" }}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span style={{ fontSize: "0.75rem", color: "oklch(0.65 0.22 20)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
