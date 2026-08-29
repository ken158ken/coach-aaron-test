/**
 * Textarea 元件 - 多行輸入框
 * @module components/ui/form/Textarea
 */

import React, { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  theme?: string;
}

/**
 * Textarea - 多行輸入框元件
 *
 * @param {TextareaProps} props - 元件屬性
 * @returns {JSX.Element} 多行輸入框
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-xs sm:text-sm mb-1.5 sm:mb-2 text-white/60">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`studio-input resize-none min-h-25 sm:min-h-30 ${error ? "border-red-400" : ""}`}
          {...props}
        />
        {error && (
          <p className="text-xs sm:text-sm mt-1 text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
