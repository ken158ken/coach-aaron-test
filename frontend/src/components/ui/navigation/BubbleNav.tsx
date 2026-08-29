/**
 * BubbleNav 元件 - 氣泡導航
 * @module components/ui/navigation/BubbleNav
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BubbleNavProps {
  items: NavItem[];
  className?: string;
}

/**
 * BubbleNav - 深海氣泡導航元件
 *
 * @param {BubbleNavProps} props - 元件屬性
 * @returns {JSX.Element} 氣泡導航
 */
const BubbleNav: React.FC<BubbleNavProps> = ({ items, className = "" }) => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className={`bubble-nav ${className}`}>
      <ul className="flex gap-1">
        {items.map((item, index) => {
          const isActive = location.pathname === item.href;
          const isHovered = hoveredIndex === index;

          return (
            <li key={item.href}>
              <Link
                to={item.href}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`
                  bubble-nav-item
                  relative
                  flex
                  items-center
                  justify-center
                  w-12
                  h-12
                  rounded-full
                  border
                  transition-all
                  duration-300
                  ${
                    isActive
                      ? "bg-abyss-accent/20 border-white/40 text-white"
                      : "border-white/40/50 text-white/90 hover:border-white/40 hover:text-white"
                  }
                  ${isHovered ? "scale-110" : ""}
                `}
              >
                {item.icon || (
                  <span className="text-xs uppercase">
                    {item.label.charAt(0)}
                  </span>
                )}

                {/* Tooltip */}
                <span
                  className={`
                    absolute
                    bottom-full
                    left-1/2
                    -translate-x-1/2
                    mb-2
                    px-3
                    py-1
                    text-xs
                    bg-[#050505]
                    border
                    border-white/40/50
                    rounded
                    whitespace-nowrap
                    transition-opacity
                    duration-200
                    ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}
                  `}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BubbleNav;
