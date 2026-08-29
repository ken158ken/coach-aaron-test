/**
 * CourseCard - Studio 課程卡片（Aceternity 3D Card Effect 風格）
 * @module components/ui/cards/CourseCard
 */

import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { Course } from "@/types";
import { formatCurrency } from "@/lib/ui";
import { useLanguage } from "@/context/LanguageContext";

interface CourseCardProps {
  course: Course;
  theme?: string;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "" }) => {
  const { t } = useLanguage();
  const imageUrl = course.course_thumbnail_url || "";
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt — 追蹤滑鼠在卡片內的位置
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]: string[]) =>
      `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.12) 0%, transparent 65%)`,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1000px" }}
      className={`select-none ${className}`}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="studio-card flex flex-col h-full"
      >
        {/* 高光層 — 跟隨滑鼠位置 */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{ background: glareBg }}
        />

        <Link
          to={`/courses/${course.id}`}
          className="flex flex-col flex-1"
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
                {course.price != null
                  ? formatCurrency(course.price)
                  : t.course.free}
              </span>
              {course.lessons_count != null && (
                <span style={{ color: "#888", fontSize: "0.8rem" }}>
                  {course.lessons_count} {t.course.lessons}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export default CourseCard;
