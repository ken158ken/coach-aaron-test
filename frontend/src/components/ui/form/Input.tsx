/**
 * Input 元件 - 輸入框
 * @module components/ui/form/Input
 */

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  theme?: "abyss" | "prism" | "luxe";
  icon?: React.ReactNode;
}

/**
 * Input - 輸入框元件
 *
 * @param {InputProps} props - 元件屬性
 * @returns {JSX.Element} 輸入框
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, theme = "luxe", icon, className = "", ...props }, ref) => {
    const themes = {
      abyss: {
        container: "text-abyss-text",
        input:
          "bg-abyss-black/60 border-abyss-cyan/40 hover:border-abyss-cyan/70 focus:border-abyss-cyan focus:ring-2 focus:ring-abyss-cyan/30 text-abyss-text placeholder:text-abyss-text/50 transition-all duration-300",
        label: "text-abyss-text/70",
        error: "text-red-400",
      },
      prism: {
        container: "text-prism-text",
        input:
          "bg-white/10 border-prism-purple/50 hover:border-prism-purple/80 focus:border-prism-purple focus:ring-2 focus:ring-prism-purple/40 text-prism-text placeholder:text-prism-text/60 backdrop-blur-sm transition-all duration-300",
        label: "text-prism-text/70",
        error: "text-red-400",
      },
      luxe: {
        container: "text-luxe-text",
        input:
          "bg-luxe-black/50 border-luxe-gold/30 hover:border-luxe-gold/60 focus:border-luxe-gold focus:ring-2 focus:ring-luxe-gold/30 text-luxe-text placeholder:text-luxe-text-dim transition-all duration-300",
        label: "text-luxe-text-dim",
        error: "text-red-400",
      },
    };

    const styles = themes[theme];

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 ${styles.label}`}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-current opacity-50">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full
              px-3
              sm:px-4
              py-2.5
              sm:py-3
              text-sm
              sm:text-base
              ${icon ? "pl-9 sm:pl-10" : ""}
              border
              rounded-lg
              outline-none
              transition-all
              duration-200
              ${styles.input}
              ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : ""}
            `}
            {...props}
          />
        </div>
        {error && <p className={`text-xs sm:text-sm mt-1 ${styles.error}`}>{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
