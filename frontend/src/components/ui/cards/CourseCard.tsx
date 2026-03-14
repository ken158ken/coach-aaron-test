/**
 * CourseCard - Studio 課程卡片
 * @module components/ui/cards/CourseCard
 */

import React from "react";
import { Link } from "react-router-dom";
import type { Course } from "@/types";
import { formatCurrency } from "@/lib/ui";

interface CourseCardProps {
  course: Course;
  /** 向後相容，已無作用 */
  theme?: string;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "" }) => {
  const imageUrl = course.course_thumbnail_url || course.course_thumbnail_url || "";

  return (
    <Link
      to={`/courses/${course.id}`}
      className={`studio-card flex flex-col ${className}`}
      style={{ textDecoration: "none" }}
    >
      {/* 圖片區 */}
      <div className="studio-card-img" style={{ height: "200px", background: "#111" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "3rem" }}>📚</span>
          </div>
        )}
      </div>

      {/* 內容 */}
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        {course.category && (
          <span className="card-tag">{course.category}</span>
        )}
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "12px", lineHeight: 1.4 }}>
          {course.title}
        </h3>
        {course.description && (
          <p style={{ color: "#888", fontSize: "0.9rem", flexGrow: 1, marginBottom: "20px", lineHeight: 1.6 }}>
            {course.description.length > 80 ? course.description.slice(0, 80) + "..." : course.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
            {course.price != null ? formatCurrency(course.price) : "免費"}
          </span>
          {course.lessons_count != null && (
            <span style={{ color: "#888", fontSize: "0.8rem" }}>{course.lessons_count} 堂課</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
