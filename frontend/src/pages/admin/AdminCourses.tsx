/**
 * AdminCourses 頁面 - 課程管理
 * @module pages/admin/AdminCourses
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import {
  DataTable,
  Pagination,
  PillButton,
  Input,
  Modal,
} from "@/components/ui";
import { get } from "@/services/api";
import type { Course } from "@/types";

/** 後端課程資料結構 */
interface AdminCourse {
  course_id: number;
  course_title: string;
  course_slug: string;
  course_description: string;
  price: number;
  status: "draft" | "published" | "archived";
  created_at: string;
}

/**
 * AdminCourses - 課程管理頁面
 *
 * @returns {JSX.Element} 課程管理頁面
 */
const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await get<AdminCourse[]>("/api/courses/admin/all");
        // ✅ 防禦性編程：API 攔截器返回 response.data，所以 res 本身就是數據
        if (res && Array.isArray(res)) {
          setCourses(
            res.map(
              (c) =>
                ({
                  // 資料庫欄位
                  course_id: c.course_id,
                  course_title: c.course_title,
                  course_slug: c.course_slug,
                  course_description: c.course_description,
                  price: c.price,
                  status: c.status,
                  created_at: c.created_at || new Date().toISOString(),
                  updated_at: c.updated_at || new Date().toISOString(),
                  // 前端別名
                  id: c.course_id,
                  title: c.course_title,
                  slug: c.course_slug,
                  description: c.course_description,
                  lessonsCount: c.lessons_count || 0,
                  level: c.course_level,
                }) as Course,
            ),
          );
        } else {
          console.error("Failed to fetch courses:", res);
          setCourses([]);
          setError("載入課程失敗：數據格式錯誤");
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setCourses([]);
        setError("載入課程失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    (course.title || course.course_title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const levelLabels: Record<string, string> = {
    beginner: "初學者",
    intermediate: "進階",
    advanced: "專家",
  };

  const columns = [
    { key: "title" as const, header: "課程名稱", isPrimary: true },
    {
      key: "level" as const,
      header: "難度",
      render: (course: Course) => (
        <span className="text-luxe-muted">
          {course.level ? levelLabels[course.level] || course.level : "-"}
        </span>
      ),
    },
    {
      key: "price" as const,
      header: "價格",
      render: (course: Course) => (
        <span className="text-luxe-gold">
          NT$ {course.price?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: "lessonsCount" as const,
      header: "課堂數",
      hideOnMobile: true,
      render: (course: Course) => `${course.lessonsCount || 0} 堂`,
    },
    {
      key: "actions" as const,
      header: "操作",
      render: (course: Course) => (
        <button
          onClick={() => setSelectedCourse(course)}
          className="text-luxe-gold hover:underline text-sm"
        >
          編輯
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-luxe-text">課程管理</h1>
          <p className="text-luxe-muted">管理所有課程</p>
        </div>
        <PillButton theme="luxe" variant="outline" className="w-full sm:w-auto">
          新增課程
        </PillButton>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="搜尋課程..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="w-full sm:max-w-sm"
          icon={
            <svg
              className="w-4 h-4 text-luxe-muted"
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCourses}
        keyExtractor={(course) => course.course_id}
        loading={loading}
        theme="luxe"
        emptyMessage="沒有找到課程"
      />

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={3}
          onPageChange={setCurrentPage}
          theme="luxe"
        />
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        title="編輯課程"
        size="lg"
        theme="luxe"
      >
        {selectedCourse && (
          <form className="space-y-4">
            <Input
              label="課程名稱"
              defaultValue={selectedCourse.title}
              theme="luxe"
            />
            <Input
              label="價格"
              type="number"
              defaultValue={String(selectedCourse.price || 0)}
              theme="luxe"
            />
            <div className="flex justify-end gap-3 pt-4">
              <PillButton
                theme="luxe"
                variant="outline"
                onClick={() => setSelectedCourse(null)}
              >
                取消
              </PillButton>
              <PillButton theme="luxe" variant="filled">
                儲存
              </PillButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminCourses;
