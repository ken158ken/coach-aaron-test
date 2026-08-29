/**
 * LuxeProjectCard 元件 - 高端專案卡片
 * @module components/ui/cards/LuxeProjectCard
 */

import React from "react";

interface LuxeProjectCardProps {
  image: string;
  title: string;
  category: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * LuxeProjectCard - LUXE 主題專案卡片元件
 *
 * @param {LuxeProjectCardProps} props - 元件屬性
 * @returns {JSX.Element} 高端風格專案卡片
 */
const LuxeProjectCard: React.FC<LuxeProjectCardProps> = ({
  image,
  title,
  category,
  description,
  onClick,
  className = "",
}) => {
  return (
    <div
      className={`
        group
        cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-sm mb-4">
        <img
          src={image}
          alt={title}
          className="
            w-full
            aspect-[4/3]
            object-cover
            transition-transform
            duration-700
            group-hover:scale-110
          "
        />
        {/* Overlay */}
        <div
          className="
            absolute
            inset-0
            bg-[#0a0a0a]/60
            opacity-0
            group-hover:opacity-100
            transition-opacity
            duration-300
            flex
            items-center
            justify-center
          "
        >
          <span className="text-white/90 uppercase tracking-widest text-sm">
            View Project
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">
        {category}
      </p>
      <h3 className="text-white/90 text-lg font-light tracking-wide mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[#888] text-sm font-light">{description}</p>
      )}
    </div>
  );
};

export default LuxeProjectCard;
