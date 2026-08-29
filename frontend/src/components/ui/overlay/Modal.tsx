/**
 * Modal 元件 - 彈窗
 * @module components/ui/overlay/Modal
 */

import React, { useEffect } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  theme?: string;
  className?: string;
  /**
   * 新手導覽用的彈窗識別碼。給了之後彈窗面板會帶 `data-tour-modal="<id>"`、
   * 關閉鈕會帶 `data-tour-modal-close`，導覽引擎就能「開啟 → 導覽 → 自動關閉」。
   * 沒給也不影響：引擎找不到關閉鈕時會改送 Escape（本元件本來就吃 Escape）。
   */
  tourId?: string;
}

/**
 * Modal - 彈窗元件
 *
 * @param {ModalProps} props - 元件屬性
 * @returns {JSX.Element | null} 彈窗
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  tourId,
}) => {
  useScrollLock(isOpen);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-[900px]",
    full: "max-w-[1440px]",
  };



  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6 px-3 sm:p-4">
      {/* Backdrop with enhanced blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        data-tour-modal={tourId}
        className={`
          relative
          w-full
          my-auto
          ${sizes[size]}
          border
          rounded-xl
          overflow-hidden
          animate-fade-in
          bg-surface border-gold/20 text-inherit
          ${className}
        `}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gold/15"
          >
            <h2 className="text-base sm:text-lg font-medium">{title}</h2>
            <button
              onClick={onClose}
              data-tour-modal-close=""
              aria-label="關閉"
              className="p-1 transition-colors text-muted hover:text-inherit"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
