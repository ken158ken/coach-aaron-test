/**
 * Textarea 元件 - 多行輸入框
 * @module components/ui/form/Textarea
 */

import React, { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  theme?: "abyss" | "prism" | "luxe";
}

/**
 * Textarea - 多行輸入框元件
 *
 * @param {TextareaProps} props - 元件屬性
 * @returns {JSX.Element} 多行輸入框
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, theme = "luxe", className = "", ...props }, ref) => {
    const themes = {
      abyss: {
        container: "text-abyss-text",
        input:
          "bg-abyss-bg/50 border-abyss-accent/30 hover:border-abyss-accent/60 focus:border-abyss-accent focus:ring-2 focus:ring-abyss-accent/30 text-abyss-text placeholder:text-abyss-text/40 transition-all duration-300",
        label: "text-abyss-text/70",
        error: "text-red-400",
      },
      prism: {
        container: "text-prism-text",
        input:
          "bg-prism-bg/50 border-prism-accent/30 hover:border-prism-accent/60 focus:border-prism-accent focus:ring-2 focus:ring-prism-accent/30 text-prism-text placeholder:text-prism-text/40 transition-all duration-300",
        label: "text-prism-text/70",
        error: "text-red-400",
      },
      luxe: {
        container: "text-luxe-text",
        input:
          "bg-transparent border-luxe-muted/30 hover:border-luxe-gold/50 focus:border-luxe-gold focus:ring-2 focus:ring-luxe-gold/30 text-luxe-text placeholder:text-luxe-muted transition-all duration-300",
        label: "text-luxe-muted",
        error: "text-red-400",
      },
    };

    const styles = themes[theme];

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label
            className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 ${styles.label}`}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full
            px-3
            sm:px-4
            py-2.5
            sm:py-3
            text-sm
            sm:text-base
            border
            rounded-lg
            outline-none
            transition-colors
            duration-200
            resize-none
            min-h-[100px]
            sm:min-h-[120px]
            ${styles.input}
            ${error ? "border-red-400" : ""}
          `}
          {...props}
        />
        {error && (
          <p className={`text-xs sm:text-sm mt-1 ${styles.error}`}>{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
