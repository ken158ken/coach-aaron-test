/**
 * Toast 元件 - 提示訊息
 * @module components/ui/feedback/Toast
 */

import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
  className?: string;
}

/**
 * Toast - 提示訊息元件
 *
 * @param {ToastProps} props - 元件屬性
 * @returns {JSX.Element} Toast 元件
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: {
      bg: "bg-green-500/20 border-green-500",
      icon: "✓",
      text: "text-green-400",
    },
    error: {
      bg: "bg-red-500/20 border-red-500",
      icon: "✕",
      text: "text-red-400",
    },
    warning: {
      bg: "bg-yellow-500/20 border-yellow-500",
      icon: "⚠",
      text: "text-yellow-400",
    },
    info: {
      bg: "bg-blue-500/20 border-blue-500",
      icon: "ℹ",
      text: "text-blue-400",
    },
  };

  const styles = types[type];

  return (
    <div
      className={`
        fixed
        top-4
        right-4
        z-50
        flex
        items-center
        gap-3
        px-4
        py-3
        rounded-lg
        border
        backdrop-blur-sm
        transition-all
        duration-300
        ${styles.bg}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
        ${className}
      `}
    >
      <span className={`text-lg ${styles.text}`}>{styles.icon}</span>
      <span className="text-white text-sm">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="ml-2 text-white/50 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
