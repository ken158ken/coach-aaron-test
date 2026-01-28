/**
 * Courses 頁面 - 課程列表
 * @module pages/Courses
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/context";
import { PrismScene } from "@/components/three";
import {
  CourseCard,
  FilterPill,
  Loading,
  Input,
  Pagination,
} from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { courseService } from "@/services";
import type { Course } from "@/types";

/** 每頁顯示數量 */
const ITEMS_PER_PAGE = 6;

/**
 * Courses - 課程列表頁面
 *
 * @returns {JSX.Element} 課程頁面
 */
const Courses: React.FC = () => {
  const { setTheme } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filterOptions = [
    { value: "all", label: "全部" },
    { value: "beginner", label: "初學者" },
    { value: "intermediate", label: "進階" },
    { value: "advanced", label: "專家" },
  ];

  useEffect(() => {
    setTheme("prism");
  }, [setTheme]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        // Demo data (正規化後的格式)
        setCourses([
          {
            course_id: 1,
            id: 1,
            course_title: "初學者健身入門",
            title: "初學者健身入門",
            course_slug: "beginner-fitness",
            course_description:
              "從零開始的健身之路，建立正確訓練觀念與基礎動作。",
            description: "從零開始的健身之路，建立正確訓練觀念與基礎動作。",
            course_level: "beginner",
            level: "beginner",
            lessons_count: 12,
            lessonsCount: 12,
            duration_minutes: 360,
            duration: "6 週",
            price: 2999,
            status: "published",
            course_thumbnail_url: "/images/course-1.jpg",
            thumbnail: "/images/course-1.jpg",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            course_id: 2,
            id: 2,
            course_title: "增肌實戰計畫",
            title: "增肌實戰計畫",
            course_slug: "muscle-building",
            course_description: "科學化肌肥大訓練，配合營養規劃達成增肌目標。",
            description: "科學化肌肥大訓練，配合營養規劃達成增肌目標。",
            course_level: "intermediate",
            level: "intermediate",
            lessons_count: 16,
            lessonsCount: 16,
            duration_minutes: 480,
            duration: "8 週",
            price: 4999,
            status: "published",
            course_thumbnail_url: "/images/course-2.jpg",
            thumbnail: "/images/course-2.jpg",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            course_id: 3,
            id: 3,
            course_title: "進階體態雕塑",
            title: "進階體態雕塑",
            course_slug: "advanced-sculpting",
            course_description: "針對有經驗者的細節雕塑課程，打造完美線條。",
            description: "針對有經驗者的細節雕塑課程，打造完美線條。",
            course_level: "advanced",
            level: "advanced",
            lessons_count: 20,
            lessonsCount: 20,
            duration_minutes: 720,
            duration: "12 週",
            price: 6999,
            status: "published",
            course_thumbnail_url: "/images/course-3.jpg",
            thumbnail: "/images/course-3.jpg",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ] as Course[]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 篩選與搜尋邏輯
  const filteredCourses = useMemo(() => {
    let result = courses;

    // 依等級篩選
    if (filter !== "all") {
      result = result.filter((c) => c.level === filter);
    }

    // 依關鍵字搜尋
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [courses, filter, searchTerm]);

  // 分頁邏輯
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  // 當篩選或搜尋變更時，重置頁碼
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  return (
    <div className="relative min-h-screen bg-prism-bg">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="專業課程"
        description="系統化的健身訓練課程，從基礎到進階，帶你達成健身目標。提供初學者入門、增肌實戰、體態雕塑等多元課程。"
        keywords={["健身課程", "線上課程", "健身訓練", "增肌", "減脂"]}
        url="/courses"
      />

      {/* Three.js Background */}
      <PrismScene />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-prism-accent text-sm uppercase tracking-widest mb-4">
              Courses
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-prism-text mb-4">
              專業課程
            </h1>
            <p className="text-prism-text/60 max-w-xl mx-auto">
              系統化的訓練課程，從基礎到進階，帶你達成健身目標
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {/* 搜尋框 */}
            <div className="w-full sm:w-auto">
              <Input
                placeholder="搜尋課程..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                theme="prism"
                className="w-full sm:w-64"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
            {/* 篩選膠囊 - 手機上可滾動 */}
            <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <FilterPill
                options={filterOptions}
                value={filter}
                onChange={setFilter}
                theme="prism"
                className="whitespace-nowrap"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loading theme="prism" text="載入課程中..." />
            </div>
          ) : paginatedCourses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-prism-text/60">
                {searchTerm
                  ? `找不到符合「${searchTerm}」的課程`
                  : "目前沒有符合條件的課程"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-prism-accent hover:underline"
                >
                  清除搜尋
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 結果統計 */}
              <p className="text-prism-text/50 text-sm text-center mb-6">
                共 {filteredCourses.length} 個課程
                {totalPages > 1 && ` · 第 ${currentPage} / ${totalPages} 頁`}
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} theme="prism" />
                ))}
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    theme="prism"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;
