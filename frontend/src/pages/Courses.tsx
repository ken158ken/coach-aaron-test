/**
 * Courses 頁面 - 課程列表
 * @module pages/Courses
 * @description 展示所有已發布的課程，支援購買與評論
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { courseService } from "@/services";
import { PillButton, Loading, PageHeader } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { useScrollReveal, getStaggerClass } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks";
import { getInitialData } from "@/ssr/initialData";
import { dataKeys } from "@/ssr/routeData";
import type { Course } from "@/types";

/**
 * Courses - 課程列表頁面
 *
 * @returns {JSX.Element} 課程頁面
 */
const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { loc } = useLocalize();
  // ── SSR 預抓資料 ──
  const ssrCourses = getInitialData<Course[]>(dataKeys.coursesList());
  const initialCourses = Array.isArray(ssrCourses) ? ssrCourses : [];

  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [loading, setLoading] = useState(initialCourses.length === 0);
  const [error, setError] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const coursesRef = useScrollReveal();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  /**
   * 取得所有課程
   */
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courseService.getAll();
      setCourses(data || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 格式化價格（僅在 show_price 為 true 時顯示）
   */
  const formatPrice = (course: Course): string => {
    if (!course.show_price) return t.course.inquirePrice;
    if (!course.price || course.price === 0) return t.course.free;
    return `NT$ ${course.price.toLocaleString()}`;
  };

  /**
   * 課程難度標籤
   */
  const levelLabels: Record<string, string> = {
    beginner: t.course.beginner,
    intermediate: t.course.intermediate,
    advanced: t.course.advanced,
  };

  // 從課程資料提取所有分類
  const categories = [...new Set(courses.map((c) => c.course_category).filter((c): c is string => !!c))];

  // 套用篩選
  const filteredCourses = courses.filter((c) => {
    if (selectedLevel && c.course_level !== selectedLevel) return false;
    if (selectedCategory && c.course_category !== selectedCategory) return false;
    return true;
  });

  // SEO Meta 標籤 — 必須在 early return 之前建立，
  // 否則 loading 狀態下伺服器端輸出的 title 會是空的
  const seoHead = (
    <SEOHead
      title={t.course.pageLabel}
      description={language === "en" ? "Explore professional fitness courses, from beginner to advanced training" : "探索專業健身課程，從初學者到進階訓練，找到適合你的課程"}
      keywords={language === "en" ? ["fitness courses", "training courses", "coaching", "online learning"] : ["健身課程", "訓練課程", "教練課程", "線上學習"]}
      url="/courses"
      breadcrumbs={[{ name: t.course.pageLabel, url: "/courses" }]}
    />
  );

  // 已有 SSR 資料時不再顯示骨架（避免水合後閃一下）
  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        {seoHead}
        <Loading theme="studio" text={t.common.loading} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      {seoHead}
      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="studio-container">
        <PageHeader
          label="Courses"
          title={t.course.pageLabel}
          subtitle={language === "en" ? "Explore professional fitness courses and start your training journey" : "探索專業健身課程，開啟你的訓練旅程"}
        />
          {/* ── Filter Bar ── */}
          {(courses.length > 0) && (
            <div className="mb-6 sm:mb-8 space-y-3">
              {/* Level filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {(["", "beginner", "intermediate", "advanced"] as const).map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setSelectedLevel(lv)}
                    className={`level-filter-pill shrink-0 ${selectedLevel === lv ? "active" : ""}`}
                  >
                    {lv === "" ? t.course.allLevels : levelLabels[lv]}
                  </button>
                ))}
              </div>

              {/* Category filter — only if categories exist */}
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`page-filter-pill shrink-0 ${selectedCategory === "" ? "active" : ""}`}
                  >
                    {t.course.allCategories}
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
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm sm:text-base text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Courses Grid — Focus Cards */}
          {filteredCourses.length > 0 ? (
            <div
              ref={coursesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.course_id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  initial={{
                    opacity: 1,
                    filter: "blur(0px) brightness(1)",
                    scale: 1,
                  }}
                  animate={{
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.45,
                    filter: hoveredIndex === null || hoveredIndex === index ? "blur(0px) brightness(1)" : "blur(1.5px) brightness(0.55)",
                    scale: hoveredIndex === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`scroll-reveal ${getStaggerClass(index)}`}
                >
                <Link
                  to={`/courses/${course.course_id}`}
                  className="group block h-full"
                >
                  <article className="course-card-item backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:shadow-xl hover:shadow-white/5 transition-all duration-300 h-full flex flex-col">
                    {/* Thumbnail */}
                    {course.course_thumbnail_url ? (
                      <div className="aspect-16/10 overflow-hidden">
                        <img
                          src={course.course_thumbnail_url}
                          alt={course.course_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="no-thumb aspect-16/10 bg-white/5 flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl text-[#d4d4d4]/30">
                          📚
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      {/* Level & Category */}
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        {course.course_level && (
                          <span className="level-tag px-2 py-1 bg-white/5 text-[#d4d4d4] text-xs rounded-full">
                            {levelLabels[course.course_level] || course.course_level}
                          </span>
                        )}
                        {course.course_category && (
                          <span className="text-xs text-white/40">
                            {loc(course as unknown as Record<string, unknown>, "course_category")}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm sm:text-base font-medium text-white/90 mb-1.5 sm:mb-2 group-hover:text-[#d4d4d4] transition-colors line-clamp-2">
                        {loc(course as unknown as Record<string, unknown>, "course_title")}
                      </h2>

                      {/* Description */}
                      {course.course_description && (
                        <p className="text-white/50 text-xs sm:text-sm mb-2 sm:mb-3 flex-1 line-clamp-1 sm:line-clamp-2">
                          {loc(course as unknown as Record<string, unknown>, "course_description")}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs sm:text-sm text-white/40 mt-auto gap-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                          {course.lessons_count && (
                            <span className="whitespace-nowrap">
                              📖 {course.lessons_count} {t.course.lessons}
                            </span>
                          )}
                          {course.rating_count !== undefined && course.rating_count > 0 && (
                            <span className="whitespace-nowrap">
                              ⭐ {(course.rating_average ?? 0).toFixed(1)} ({course.rating_count})
                            </span>
                          )}
                        </div>
                        {course.total_enrolled !== undefined && (
                          <span className="whitespace-nowrap">
                            👥 {course.total_enrolled}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="card-divider mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                        <span className="price-label text-base sm:text-lg font-semibold text-[#d4d4d4]">
                          {formatPrice(course)}
                        </span>
                        <PillButton
                          theme="studio"
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`/courses/${course.course_id}`)}
                        >
                          {t.course.viewDetail}
                        </PillButton>
                      </div>
                    </div>
                  </article>
                </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📚</span>
              <p className="text-white/50 mb-4">
                {courses.length > 0 ? t.course.noFilterMatch : t.course.noCourses}
              </p>
              {courses.length > 0 && (
                <button
                  onClick={() => { setSelectedLevel(""); setSelectedCategory(""); }}
                  className="text-white/40 hover:text-white/70 text-sm underline underline-offset-2 transition-colors"
                >
                  {t.course.clearFilters}
                </button>
              )}
            </div>
          )}

          {/* Contact CTA */}
          <section className="mt-16 sm:mt-20 text-center scroll-reveal">
            <div className="page-cta-box bg-transparent/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-4">
                {t.course.ctaTitle}
              </h2>
              <p className="text-white/60 mb-8">
                {t.course.ctaSubtitle}
              </p>
              <PillButton
                theme="studio"
                variant="primary"
                size="lg"
                onClick={() => navigate("/contact")}
              >
                {t.course.ctaBook}
              </PillButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Courses;
