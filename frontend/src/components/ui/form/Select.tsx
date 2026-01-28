/**
 * Select 元件 - 下拉選單
 * @module components/ui/form/Select
 */

import React, { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  theme?: "abyss" | "prism" | "luxe";
}

/**
 * Select - 下拉選單元件
 *
 * @param {SelectProps} props - 元件屬性
 * @returns {JSX.Element} 下拉選單
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      theme = "luxe",
      className = "",
      ...props
    },
    ref,
  ) => {
    const themes = {
      abyss: {
        container: "text-abyss-text",
        select:
          "bg-abyss-bg/50 border-abyss-accent/30 hover:border-abyss-accent/60 focus:border-abyss-accent text-abyss-text transition-all duration-300",
        label: "text-abyss-text/70",
        error: "text-red-400",
      },
      prism: {
        container: "text-prism-text",
        select:
          "bg-prism-bg/50 border-prism-accent/30 hover:border-prism-accent/60 focus:border-prism-accent text-prism-text transition-all duration-300",
        label: "text-prism-text/70",
        error: "text-red-400",
      },
      luxe: {
        container: "text-luxe-text",
        select:
          "bg-luxe-surface border-luxe-muted/30 hover:border-luxe-gold/50 focus:border-luxe-gold text-luxe-text transition-all duration-300",
        label: "text-luxe-muted",
        error: "text-red-400",
      },
    };

    const styles = themes[theme];

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label className={`block text-sm mb-2 ${styles.label}`}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full
            px-4
            py-3
            border
            rounded-lg
            outline-none
            transition-colors
            duration-200
            appearance-none
            cursor-pointer
            ${styles.select}
            ${error ? "border-red-400" : ""}
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "1.5em 1.5em",
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className={`text-sm mt-1 ${styles.error}`}>{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
