/**
 * Courses 頁面 - 課程列表
 * @module pages/Courses
 * @description 展示所有已發布的課程，支援購買與評論
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { courseService } from "@/services";
import { PillButton, Loading, PageHeader } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { useScrollReveal, getStaggerClass } from "@/hooks/useScrollReveal";
import type { Course } from "@/types";

/**
 * Courses - 課程列表頁面
 *
 * @returns {JSX.Element} 課程頁面
 */
const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const coursesRef = useScrollReveal();

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
      setError("載入課程失敗");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 格式化價格（僅在 show_price 為 true 時顯示）
   */
  const formatPrice = (course: Course): string => {
    if (!course.show_price) return "洽詢價格";
    if (!course.price || course.price === 0) return "免費";
    return `NT$ ${course.price.toLocaleString()}`;
  };

  /**
   * 課程難度標籤
   */
  const levelLabels: Record<string, string> = {
    beginner: "初學者",
    intermediate: "進階",
    advanced: "專家",
  };

  // 從課程資料提取所有分類
  const categories = [...new Set(courses.map((c) => c.course_category).filter((c): c is string => !!c))];

  // 套用篩選
  const filteredCourses = courses.filter((c) => {
    if (selectedLevel && c.course_level !== selectedLevel) return false;
    if (selectedCategory && c.course_category !== selectedCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loading theme="studio" text="載入中..." />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="課程中心"
        description="探索專業健身課程，從初學者到進階訓練，找到適合你的課程"
        keywords={["健身課程", "訓練課程", "教練課程", "線上學習"]}
        url="/courses"
      />
      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="studio-container">
        <PageHeader
          label="Courses"
          title="課程中心"
          subtitle="探索專業健身課程，開啟你的訓練旅程"
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
                    className={`level-filter-pill shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-200 ${selectedLevel === lv ? "active" : ""}`}
                    style={selectedLevel !== lv ? {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.55)",
                    } : {
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.50)",
                      color: "#fff",
                    }}
                  >
                    {lv === "" ? "全部等級" : levelLabels[lv]}
                  </button>
                ))}
              </div>

              {/* Category filter — only if categories exist */}
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`page-filter-pill shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-200 ${selectedCategory === "" ? "active" : ""}`}
                    style={selectedCategory !== "" ? {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.55)",
                    } : undefined}
                  >
                    全部分類
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`page-filter-pill shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-200 ${selectedCategory === cat ? "active" : ""}`}
                      style={selectedCategory !== cat ? {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "rgba(255,255,255,0.55)",
                      } : undefined}
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

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <div
              ref={coursesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
            >
              {filteredCourses.map((course, index) => (
                <Link
                  key={course.course_id}
                  to={`/courses/${course.course_id}`}
                  className={`group scroll-reveal ${getStaggerClass(index)}`}
                >
                  <article className="course-card-item backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
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
                            {course.course_category}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm sm:text-base font-medium text-white/90 mb-1.5 sm:mb-2 group-hover:text-[#d4d4d4] transition-colors line-clamp-2">
                        {course.course_title}
                      </h2>

                      {/* Description */}
                      {course.course_description && (
                        <p className="text-white/50 text-xs sm:text-sm mb-2 sm:mb-3 flex-1 line-clamp-1 sm:line-clamp-2">
                          {course.course_description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs sm:text-sm text-white/40 mt-auto gap-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                          {course.lessons_count && (
                            <span className="whitespace-nowrap">
                              📖 {course.lessons_count} 堂課
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
                          查看詳情
                        </PillButton>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📚</span>
              <p className="text-white/50 mb-4">
                {courses.length > 0 ? "沒有符合條件的課程" : "目前沒有可用的課程"}
              </p>
              {courses.length > 0 && (
                <button
                  onClick={() => { setSelectedLevel(""); setSelectedCategory(""); }}
                  className="text-white/40 hover:text-white/70 text-sm underline underline-offset-2 transition-colors"
                >
                  清除篩選
                </button>
              )}
            </div>
          )}

          {/* Contact CTA */}
          <section className="mt-16 sm:mt-20 text-center scroll-reveal">
            <div className="page-cta-box bg-transparent/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-4">
                需要客製化訓練計畫？
              </h2>
              <p className="text-white/60 mb-8">
                我們提供一對一諮詢服務，根據你的目標制定專屬訓練方案
              </p>
              <PillButton
                theme="studio"
                variant="primary"
                size="lg"
                onClick={() => navigate("/contact")}
              >
                預約諮詢
              </PillButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Courses;
