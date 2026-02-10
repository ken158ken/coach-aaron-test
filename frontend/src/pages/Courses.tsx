/**
 * Courses 頁面 - 課程列表
 * @module pages/Courses
 * @description 展示所有已發布的課程，支援購買與評論
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/context";
import { courseService } from "@/services";
import { PrismScene } from "@/components/three";
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
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const coursesRef = useScrollReveal();

  useEffect(() => {
    setTheme("prism");
    fetchCourses();
  }, [setTheme]);

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
   * 格式化價格
   */
  const formatPrice = (price?: number): string => {
    if (!price || price === 0) return "免費";
    return `NT$ ${price.toLocaleString()}`;
  };

  /**
   * 課程難度標籤
   */
  const levelLabels: Record<string, string> = {
    beginner: "初學者",
    intermediate: "進階",
    advanced: "專家",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg flex items-center justify-center">
        <Loading theme="prism" text="載入中..." />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-prism-bg">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="課程中心"
        description="探索專業健身課程，從初學者到進階訓練，找到適合你的課程"
        keywords={["健身課程", "訓練課程", "教練課程", "線上學習"]}
        url="/courses"
      />

      {/* Three.js Background */}
      <PrismScene />

      <div className="relative z-10">
        <PageHeader
          title="課程中心"
          subtitle="探索專業健身課程，開啟你的訓練旅程"
        />

        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Error Message */}
          {error && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm sm:text-base text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Courses Grid */}
          {courses.length > 0 ? (
            <div
              ref={coursesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {courses.map((course, index) => (
                <Link
                  key={course.course_id}
                  to={`/courses/${course.course_id}`}
                  className={`group scroll-reveal ${getStaggerClass(index)}`}
                >
                  <article className="bg-prism-bg/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-prism-accent/20 hover:border-prism-accent/50 hover:shadow-xl hover:shadow-prism-accent/10 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    {/* Thumbnail */}
                    {course.course_thumbnail_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={course.course_thumbnail_url}
                          alt={course.course_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-prism-accent/10 flex items-center justify-center">
                        <span className="text-4xl sm:text-6xl text-prism-accent/30">
                          📚
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      {/* Level & Category */}
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        {course.course_level && (
                          <span className="px-2 py-1 bg-prism-accent/20 text-prism-accent text-xs rounded-full">
                            {levelLabels[course.course_level] ||
                              course.course_level}
                          </span>
                        )}
                        {course.course_category && (
                          <span className="text-xs text-prism-text/50">
                            {course.course_category}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-lg sm:text-xl font-medium text-prism-text mb-2 sm:mb-3 group-hover:text-prism-accent transition-colors line-clamp-2">
                        {course.course_title}
                      </h2>

                      {/* Description */}
                      {course.course_description && (
                        <p className="text-prism-text/60 text-sm mb-3 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-3">
                          {course.course_description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs sm:text-sm text-prism-text/50 mt-auto gap-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                          {course.lessons_count && (
                            <span className="whitespace-nowrap">
                              📖 {course.lessons_count} 堂課
                            </span>
                          )}
                          {course.rating_count !== undefined &&
                            course.rating_count > 0 && (
                              <span className="whitespace-nowrap">
                                ⭐ {(course.rating_average ?? 0).toFixed(1)} (
                                {course.rating_count})
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
                      <div className="mt-4 pt-4 border-t border-prism-accent/10 flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-semibold text-prism-accent">
                          {formatPrice(course.price)}
                        </span>
                        <PillButton
                          theme="prism"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigate(`/courses/${course.course_id}`);
                          }}
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
              <p className="text-prism-text/60 mb-4">目前沒有可用的課程</p>
              <p className="text-prism-text/40 text-sm">
                課程即將推出，敬請期待！
              </p>
            </div>
          )}

          {/* Contact CTA */}
          <section className="mt-16 sm:mt-20 text-center scroll-reveal">
            <div className="bg-prism-bg/30 backdrop-blur-sm border border-prism-accent/20 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-prism-text mb-4">
                需要客製化訓練計畫？
              </h2>
              <p className="text-prism-text/70 mb-8">
                我們提供一對一諮詢服務，根據你的目標制定專屬訓練方案
              </p>
              <PillButton
                theme="prism"
                variant="filled"
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
