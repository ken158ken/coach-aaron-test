/**
 * Input - Studio 輸入框
 * @module components/ui/form/Input
 */

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  theme?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label style={{ fontSize: "0.8rem", color: "#888", letterSpacing: "1px", textTransform: "uppercase" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`studio-input ${className}`}
          {...props}
        />
        {error && (
          <span style={{ fontSize: "0.75rem", color: "oklch(0.65 0.22 20)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
