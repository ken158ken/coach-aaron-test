/**
 * Pagination 元件 - 分頁
 * @module components/ui/data/Pagination
 */

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme?: string;
  className?: string;
}

const styles = {
  active: "bg-white/10 text-white border border-white/40 shadow-sm",
  inactive:
    "text-white/50 hover:text-white hover:bg-white/5 hover:scale-105 transition-all duration-200",
  disabled: "text-white/20 cursor-not-allowed",
};

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
  className = "",
}) => {

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
    <nav
      className={`flex items-center justify-center gap-0.5 sm:gap-1 ${className}`}
    >
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
          <span
            key={index}
            className="px-1 sm:px-2 text-xs sm:text-sm text-gray-500"
          >
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
