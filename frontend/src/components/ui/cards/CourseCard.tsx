/**
 * CourseCard 元件 - 課程卡片
 * @module components/ui/cards/CourseCard
 */

import React from "react";
import { Link } from "react-router-dom";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  theme?: "abyss" | "prism" | "luxe";
  className?: string;
}

/**
 * CourseCard - 課程展示卡片
 *
 * @param {CourseCardProps} props - 元件屬性
 * @returns {JSX.Element} 課程卡片
 */
const CourseCard: React.FC<CourseCardProps> = ({
  course,
  theme = "abyss",
  className = "",
}) => {
  const themeStyles = {
    abyss: {
      card: "abyss-card bg-abyss-bg/50 border-abyss-accent/30 hover:border-abyss-accent",
      title: "text-abyss-text",
      accent: "text-abyss-accent",
      muted: "text-abyss-text/60",
      button: "bg-abyss-accent text-abyss-bg hover:bg-abyss-accent/80",
    },
    prism: {
      card: "prism-card bg-prism-bg/50 border-prism-accent/30 hover:border-prism-accent",
      title: "text-prism-text",
      accent: "text-prism-accent",
      muted: "text-prism-text/60",
      button: "bg-prism-accent text-prism-bg hover:bg-prism-accent/80",
    },
    luxe: {
      card: "bg-luxe-surface border-luxe-gold/20 hover:border-luxe-gold/60",
      title: "text-luxe-text",
      accent: "text-luxe-gold",
      muted: "text-luxe-muted",
      button:
        "border border-luxe-gold text-luxe-gold hover:bg-luxe-gold hover:text-luxe-bg",
    },
  };

  const styles = themeStyles[theme];

  return (
    <div
      className={`
        group
        border
        rounded-xl
        overflow-hidden
        transition-all
        duration-300
        hover:-translate-y-1
        ${styles.card}
        ${className}
      `}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={course.thumbnail || "/images/course-default.jpg"}
          alt={course.title}
          className="
            w-full
            aspect-video
            object-cover
            transition-transform
            duration-500
            group-hover:scale-105
          "
        />
        {/* Level Badge */}
        {course.level && (
          <span
            className={`
              absolute
              top-2
              sm:top-3
              right-2
              sm:right-3
              px-2
              sm:px-3
              py-0.5
              sm:py-1
              text-[10px]
              sm:text-xs
              rounded-full
              ${styles.accent}
              bg-black/50
              backdrop-blur-sm
            `}
          >
            {course.level}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className={`text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 line-clamp-2 ${styles.title}`}>
          {course.title}
        </h3>
        <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 ${styles.muted}`}>
          {course.description}
        </p>

        {/* Meta */}
        <div className={`flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm ${styles.muted}`}>
          <span>📚 {course.lessonsCount || 0} 堂課</span>
          <span className="hidden xs:inline">⏱ {course.duration || "未知"}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-base sm:text-xl font-bold ${styles.accent}`}>
            NT$ {course.price?.toLocaleString() || "免費"}
          </span>
          <Link
            to={`/courses/${course.course_id || course.id}`}
            className={`
              px-3
              sm:px-4
              py-1.5
              sm:py-2
              text-xs
              sm:text-sm
              rounded-lg
              transition-colors
              whitespace-nowrap
              ${styles.button}
            `}
          >
            查看詳情
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
