/**
 * Pagination 元件 - 分頁
 * @module components/ui/data/Pagination
 */

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme?: "abyss" | "prism" | "luxe";
  className?: string;
}

/**
 * Pagination - 分頁元件
 *
 * @param {PaginationProps} props - 元件屬性
 * @returns {JSX.Element} 分頁元件
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  theme = "luxe",
  className = "",
}) => {
  const themes = {
    abyss: {
      active: "bg-abyss-accent text-abyss-bg shadow-lg shadow-abyss-accent/30",
      inactive:
        "text-abyss-text/70 hover:text-abyss-accent hover:bg-abyss-accent/10 hover:scale-110 transition-all duration-300",
      disabled: "text-abyss-text/30 cursor-not-allowed",
    },
    prism: {
      active: "bg-prism-accent text-prism-bg shadow-lg shadow-prism-accent/30",
      inactive:
        "text-prism-text/70 hover:text-prism-accent hover:bg-prism-accent/10 hover:scale-110 transition-all duration-300",
      disabled: "text-prism-text/30 cursor-not-allowed",
    },
    luxe: {
      active: "bg-luxe-gold text-luxe-bg shadow-lg shadow-luxe-gold/30",
      inactive:
        "text-luxe-muted hover:text-luxe-gold hover:bg-luxe-gold/10 hover:scale-110 transition-all duration-300",
      disabled: "text-luxe-muted/30 cursor-not-allowed",
    },
  };

  const styles = themes[theme];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={`flex items-center justify-center gap-0.5 sm:gap-1 ${className}`}>
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-2
          sm:px-3
          py-1.5
          sm:py-2
          rounded
          text-sm
          sm:text-base
          transition-colors
          ${currentPage === 1 ? styles.disabled : styles.inactive}
        `}
      >
        ←
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) =>
        typeof page === "number" ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`
              w-8
              h-8
              sm:w-10
              sm:h-10
              rounded
              text-sm
              sm:text-base
              transition-colors
              ${currentPage === page ? styles.active : styles.inactive}
            `}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="px-1 sm:px-2 text-xs sm:text-sm text-gray-500">
            {page}
          </span>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-2
          sm:px-3
          py-1.5
          sm:py-2
          rounded
          text-sm
          sm:text-base
          transition-colors
          ${currentPage === totalPages ? styles.disabled : styles.inactive}
        `}
      >
        →
      </button>
    </nav>
  );
};

export default Pagination;
