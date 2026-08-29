/**
 * Drawer 元件 - 抽屜
 * @module components/ui/overlay/Drawer
 */

import React from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "left" | "right";
  theme?: string;
  className?: string;
}

/**
 * Drawer - 抽屜元件
 *
 * @param {DrawerProps} props - 元件屬性
 * @returns {JSX.Element | null} 抽屜
 */
const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  className = "",
}) => {
  useScrollLock(isOpen);

  const positionStyles = {
    left: {
      container: "left-0 border-r",
      translate: isOpen ? "translate-x-0" : "-translate-x-full",
    },
    right: {
      container: "right-0 border-l",
      translate: isOpen ? "translate-x-0" : "translate-x-full",
    },
  };

  return (
    <>
      {/* Backdrop with enhanced blur */}
      <div
        className={`
          fixed
          inset-0
          z-40
          bg-black/70
          backdrop-blur-md
          transition-opacity
          duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed
          top-0
          bottom-0
          z-50
          w-80
          max-w-full
          transition-transform
          duration-300
          ease-out
          ${positionStyles[position].container}
          ${positionStyles[position].translate}
          bg-[#0f0f0f] border-white/15
          ${className}
        `}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-4 py-4 border-b text-white/90 border-white/10"
          >
            <h2 className="text-lg font-medium">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 transition-colors text-white/40 hover:text-white"
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
        <div className="p-4 h-full overflow-y-auto">{children}</div>
      </div>
    </>
  );
};

export default Drawer;
