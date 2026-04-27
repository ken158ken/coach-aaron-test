/**
 * Lessons 頁面 - 教學影片列表（Loom）
 * @module pages/Lessons
 *
 * 跟舊的 /videos（Reels 牆）分開：這頁是較長的教學影片，含逐字稿。
 * 單張卡都比較寬，配合直接從 Loom thumbnail 抓的 16:9 截圖。
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { lessonService } from "@/services/lesson.service";
import { PageHeader, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { useScrollReveal, getStaggerClass } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import type { LessonSummary } from "@/types";

const Lessons: React.FC = () => {
  const { t, language } = useLanguage();
  const { loc } = useLocalize();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const lessonsRef = useScrollReveal();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await lessonService.getAll();
        if (!alive) return;
        setLessons(data || []);
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
        if (alive) setError(t.common.error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [t.common.error]);

  // 從 lessons 提取分類
  const categories = [
    ...new Set(lessons.map((l) => l.category).filter((c): c is string => !!c)),
  ];
  const filtered = selectedCategory
    ? lessons.filter((l) => l.category === selectedCategory)
    : lessons;

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loading theme="luxe" text={t.common.loading} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      <SEOHead
        title={language === "en" ? "Lessons" : "教學影片"}
        description={
          language === "en"
            ? "In-depth coaching lessons with full transcripts"
            : "完整的教練教學影片，含逐字稿，深入學習各種主題"
        }
        url="/lessons"
      />
      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="luxe-container max-w-7xl mx-auto">
          <PageHeader
            label="Lessons"
            title={language === "en" ? "Lessons" : "教學影片"}
            subtitle={
              language === "en"
                ? "In-depth coaching lessons with full transcripts"
                : "深入解析訓練、營養與心理學，每集都附完整逐字稿"
            }
          />

          {/* Category 篩選 */}
          {categories.length > 0 && (
            <div className="mb-6 sm:mb-10 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setSelectedCategory("")}
                className={`page-filter-pill shrink-0 ${selectedCategory === "" ? "active" : ""}`}
              >
                {t.common.all}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`page-filter-pill shrink-0 ${selectedCategory === cat ? "active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm sm:text-base text-red-400 text-center">
              {error}
            </div>
          )}

          {/* 卡片網格 — 寬幅排版（兩欄為主，桌面）*/}
          {filtered.length > 0 ? (
            <div
              ref={lessonsRef}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {filtered.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  initial={{
                    opacity: 1,
                    filter: "blur(0px) brightness(1)",
                    scale: 1,
                  }}
                  animate={{
                    opacity:
                      hoveredIndex === null || hoveredIndex === index
                        ? 1
                        : 0.45,
                    filter:
                      hoveredIndex === null || hoveredIndex === index
                        ? "blur(0px) brightness(1)"
                        : "blur(1.5px) brightness(0.55)",
                    scale: hoveredIndex === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`scroll-reveal ${getStaggerClass(index)}`}
                >
                  <LessonCard lesson={lesson} loc={loc} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-5xl mb-4 block">🎬</span>
              <p className="text-white/50">
                {language === "en"
                  ? "No lessons available yet"
                  : "目前還沒有教學影片"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface LessonCardProps {
  lesson: LessonSummary;
  loc: ReturnType<typeof useLocalize>["loc"];
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, loc }) => {
  // Loom 自動 thumbnail：https://cdn.loom.com/sessions/thumbnails/{id}-with-play.gif
  const thumbnail =
    lesson.thumbnail_url ||
    `https://cdn.loom.com/sessions/thumbnails/${lesson.loom_id}-with-play.gif`;
  const duration = lesson.duration_seconds
    ? formatDuration(lesson.duration_seconds)
    : null;
  const tags = (lesson.keywords || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Link to={`/lessons/${lesson.id}`} className="group block h-full">
      <article className="lesson-card h-full flex flex-col rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:shadow-xl hover:shadow-white/5 transition-all duration-300 bg-white/[0.02] backdrop-blur-sm">
        {/* Thumbnail：16:9 */}
        <div className="aspect-video relative overflow-hidden bg-white/5">
          <img
            src={thumbnail}
            alt={lesson.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // GIF 失敗就 fallback 靜態 jpg
              const img = e.currentTarget;
              if (!img.src.endsWith(".jpg")) {
                img.src = `https://cdn.loom.com/sessions/thumbnails/${lesson.loom_id}-with-play.jpg`;
              }
            }}
          />
          {/* Play 圖示 overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/55 flex items-center justify-center group-hover:bg-black/70 transition">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="text-white translate-x-[2px]"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {duration && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
              {duration}
            </span>
          )}
          {/* Loom 標識 */}
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/55 text-white/80 text-[10px] tracking-widest uppercase rounded">
            Loom
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          {lesson.category && (
            <p className="text-xs text-gold/80 tracking-widest uppercase mb-2">
              {loc(lesson as unknown as Record<string, unknown>, "category")}
            </p>
          )}
          <h2 className="text-base sm:text-lg font-medium text-white/90 mb-2 group-hover:text-gold transition-colors line-clamp-2">
            {loc(lesson as unknown as Record<string, unknown>, "title")}
          </h2>
          {lesson.description && (
            <p className="text-white/55 text-sm mb-3 line-clamp-2 flex-1">
              {loc(lesson as unknown as Record<string, unknown>, "description")}
            </p>
          )}

          {/* Tags + view */}
          <div className="mt-auto flex items-center justify-between gap-2">
            {tags.length > 0 ? (
              <div className="flex gap-1.5 flex-wrap min-w-0">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-white/5 text-white/55 text-[11px] rounded-full truncate"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <span />
            )}
            <span className="text-xs text-white/40 whitespace-nowrap">
              👁 {lesson.view_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default Lessons;
