/**
 * AdminCourses 頁面 - 課程管理
 * @module pages/admin/AdminCourses
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  Pagination,
  PillButton,
  Input,
  Modal,
  Textarea,
  TagInput,
  useDialog,
  ImageUploadTargetProvider,
} from "@/components/ui";
// 直接具名 import：避免 tiptap 經由 ui barrel 汙染前台主 chunk
import { RichTextEditor } from "@/components/ui/editor";
import { get, post, put, del } from "@/services/api";
import type { Course } from "@/types";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminCourses] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminCourses] ${msg}`, err || ""),
};

/** 後端課程資料結構 */
interface AdminCourse {
  course_id: number;
  course_title: string;
  course_slug: string;
  course_description: string;
  course_content?: string;
  price: number;
  status: "draft" | "published" | "archived";
  course_level?: string;
  lessons_count?: number;
  category?: string;
  keywords?: string;
  created_at: string;
  updated_at?: string;
}

/** 課程表單資料 */
interface CourseFormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  price: string;
  level: string;
  category: string[];
  keywords: string[];
  status: "draft" | "published" | "archived";
}

type ViewMode = "list" | "card-sm" | "card-md" | "card-lg";

const viewOptions: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: "list", icon: "☰", label: "清單" },
  { mode: "card-sm", icon: "▪▪▪", label: "小圖" },
  { mode: "card-md", icon: "◻◻", label: "中圖" },
  { mode: "card-lg", icon: "⬜", label: "大圖" },
];

/**
 * AdminCourses - 課程管理頁面
 *
 * @returns {JSX.Element} 課程管理頁面
 */
const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // 初始表單狀態
  const initialFormData: CourseFormData = {
    title: "",
    slug: "",
    description: "",
    content: "",
    price: "",
    level: "beginner",
    category: [],
    keywords: [],
    status: "draft",
  };

  const [formData, setFormData] = useState<CourseFormData>(initialFormData);

  /** 更新內容回調 */
  const handleContentChange = useCallback((html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
  }, []);

  /** 更新分類標籤回調 */
  const handleCategoryChange = useCallback((tags: string[]) => {
    setFormData((prev) => ({ ...prev, category: tags }));
  }, []);

  /** 更新關鍵字標籤回調 */
  const handleKeywordsChange = useCallback((tags: string[]) => {
    setFormData((prev) => ({ ...prev, keywords: tags }));
  }, []);

  /** 取得課程列表 */
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await get<AdminCourse[]>("/api/courses/admin/all");

      if (res && Array.isArray(res)) {
        setCourses(
          res.map(
            (c) =>
              ({
                course_id: c.course_id,
                course_title: c.course_title,
                course_slug: c.course_slug,
                course_description: c.course_description,
                course_content: c.course_content,
                price: c.price,
                status: c.status,
                created_at: c.created_at || new Date().toISOString(),
                updated_at: c.updated_at || new Date().toISOString(),
                id: c.course_id,
                title: c.course_title,
                slug: c.course_slug,
                description: c.course_description,
                lessonsCount: c.lessons_count || 0,
                level: c.course_level,
                category: c.category,
                keywords: c.keywords,
              }) as Course,
          ),
        );
        setTotalPages(Math.ceil(res.length / 10) || 1);
      } else {
        logger.error("Failed to fetch courses", res);
        setCourses([]);
        setError("載入課程失敗：數據格式錯誤");
      }
    } catch (err) {
      logger.error("Failed to fetch courses", err);
      setCourses([]);
      setError("載入課程失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  /** 從課程中提取所有唯一分類 */
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach((c) => {
      const cat = c.category || c.course_category;
      if (cat) {
        cat.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) cats.add(trimmed);
        });
      }
    });
    return Array.from(cats).sort();
  }, [courses]);

  /** 依據搜尋 + 狀態 + 分類篩選器過濾課程（client-side） */
  const filteredCourses = useMemo(() => {
    let result = courses;
    if (searchTerm) {
      result = result.filter((course) =>
        (course.title || course.course_title || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((course) => course.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((course) =>
        (course.category || course.course_category || "")
          .toLowerCase()
          .includes(categoryFilter.toLowerCase()),
      );
    }
    return result;
  }, [courses, searchTerm, statusFilter, categoryFilter]);

  /** 重置表單 */
  const resetForm = () => {
    setFormData(initialFormData);
  };

  /** 打開編輯 Modal */
  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    // category 是 string，需要 split
    const categoryArray = course.course_category
      ? course.course_category
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    // keywords 已經是 array（由 service 轉換）
    const keywordsArray = course.keywords || [];

    setFormData({
      title: course.course_title || course.title || "",
      slug: course.course_slug || course.slug || "",
      description: course.course_description || course.description || "",
      content: course.course_content || "",
      price: String(course.price || 0),
      level: course.level || "beginner",
      category: categoryArray,
      keywords: keywordsArray,
      status: course.status || "draft",
    });
  };

  /** 新增課程 */
  const handleCreate = async () => {
    try {
      setError("");
      if (!formData.title.trim()) {
        setError("課程名稱為必填");
        return;
      }
      if (!formData.price || isNaN(Number(formData.price))) {
        setError("請輸入有效價格");
        return;
      }

      logger.info("Creating course", { title: formData.title });
      await post("/api/courses", {
        course_title: formData.title,
        course_slug: formData.slug || undefined,
        course_description: formData.description || undefined,
        course_content: formData.content || undefined,
        course_level: formData.level,
        category: formData.category.join(",") || undefined,
        keywords: formData.keywords.join(",") || undefined,
        price: Number(formData.price),
        status: formData.status,
      });

      logger.info("Course created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchCourses();
    } catch (err) {
      logger.error("Failed to create course", err);
      setError("建立課程失敗");
    }
  };

  /** 更新課程 */
  const handleUpdate = async () => {
    if (!editingCourse) return;

    try {
      setError("");
      logger.info("Updating course", { id: editingCourse.course_id });
      await put(`/api/courses/${editingCourse.course_id}`, {
        course_title: formData.title,
        course_slug: formData.slug || undefined,
        course_description: formData.description || undefined,
        course_content: formData.content || undefined,
        course_level: formData.level,
        category: formData.category.join(",") || undefined,
        keywords: formData.keywords.join(",") || undefined,
        price: Number(formData.price),
        status: formData.status,
      });

      logger.info("Course updated successfully");
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (err) {
      logger.error("Failed to update course", err);
      setError("更新課程失敗");
    }
  };

  /** 刪除課程 */
  const handleDelete = async (course: Course) => {
    const confirmed = await dialog.confirm({
      title: "刪除課程",
      message: `確定要刪除「${course.course_title || course.title}」嗎？此操作無法復原。`,
      variant: "danger",
      confirmText: "刪除",
    });
    if (!confirmed) return;

    try {
      logger.info("Deleting course", { id: course.course_id });
      await del(`/api/courses/${course.course_id}`);
      logger.info("Course deleted successfully");
      fetchCourses();
    } catch (err) {
      logger.error("Failed to delete course", err);
      setError("刪除課程失敗");
    }
  };

  const levelLabels: Record<string, string> = {
    beginner: "初學者",
    intermediate: "進階",
    advanced: "專家",
  };

  const statusLabels: Record<string, string> = {
    draft: "草稿",
    published: "已發布",
    archived: "已封存",
  };

  const columns = [
    {
      key: "title" as const,
      header: "課程名稱",
      isPrimary: true,
      sortValue: (course: Course) =>
        (course.course_title || course.title || "").toLowerCase(),
      render: (course: Course) => (
        <span className="text-luxe-text">
          {course.course_title || course.title}
        </span>
      ),
    },
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
      sortValue: (course: Course) => course.price || 0,
      render: (course: Course) => (
        <span className="text-luxe-gold">
          NT$ {course.price?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: "status" as const,
      header: "狀態",
      render: (course: Course) => {
        const config: Record<
          string,
          { dot: string; text: string; bg: string }
        > = {
          draft: {
            dot: "bg-gray-400",
            text: "text-gray-400",
            bg: "bg-gray-500/10",
          },
          published: {
            dot: "bg-emerald-400",
            text: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          archived: {
            dot: "bg-amber-400",
            text: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        };
        const s = config[course.status] || config.draft;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full ${s.bg} ${s.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {statusLabels[course.status] || course.status}
          </span>
        );
      },
    },
    {
      key: "lessonsCount" as const,
      header: "課堂數",
      hideOnMobile: true,
      sortValue: (course: Course) => course.lessonsCount || 0,
      render: (course: Course) => `${course.lessonsCount || 0} 堂`,
    },
    {
      key: "actions" as const,
      header: "操作",
      sortable: false,
      render: (course: Course) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/courses/${course.course_id}/edit`)}
            className="text-luxe-gold hover:underline text-sm"
          >
            編輯
          </button>
          <button
            onClick={() => openEditModal(course)}
            className="text-blue-400 hover:underline text-sm"
          >
            快速編輯
          </button>
          <button
            onClick={() => handleDelete(course)}
            className="text-red-400 hover:underline text-sm"
          >
            刪除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            課程管理
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            管理所有單堂課程
          </p>
        </div>
        <div className="flex gap-3">
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            快速新增
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            onClick={() => navigate("/admin/courses/new")}
          >
            新增課程 →
          </PillButton>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <Input
          placeholder="搜尋課程..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="flex-1 sm:max-w-sm"
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
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">全部狀態</option>
          <option value="draft">草稿</option>
          <option value="published">已發布</option>
          <option value="archived">已封存</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">全部分類</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* 檢視模式切換 */}
        <div className="flex gap-1 bg-luxe-surface rounded-lg p-1 border border-luxe-gold/10 ml-auto">
          {viewOptions.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setViewMode(opt.mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === opt.mode
                  ? "bg-luxe-gold/20 text-luxe-gold"
                  : "text-luxe-muted hover:text-luxe-text"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {viewMode === "list" ? (
        <>
          <DataTable
            columns={columns}
            data={filteredCourses}
            keyExtractor={(course) => course.course_id}
            loading={loading}
            theme="luxe"
            emptyMessage="沒有找到課程"
            sortable
          />
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="luxe"
            />
          </div>
        </>
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12 text-luxe-muted">載入中...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              沒有找到課程
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                viewMode === "card-sm"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  : viewMode === "card-md"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredCourses.map((course) => {
                const statusConfig: Record<
                  string,
                  { dot: string; text: string; bg: string }
                > = {
                  draft: {
                    dot: "bg-gray-400",
                    text: "text-gray-300",
                    bg: "bg-black/60 backdrop-blur-sm",
                  },
                  published: {
                    dot: "bg-emerald-400",
                    text: "text-emerald-300",
                    bg: "bg-black/60 backdrop-blur-sm",
                  },
                  archived: {
                    dot: "bg-amber-400",
                    text: "text-amber-300",
                    bg: "bg-black/60 backdrop-blur-sm",
                  },
                };
                const sc = statusConfig[course.status] || statusConfig.draft;
                return (
                  <div
                    key={course.course_id}
                    className="group bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 overflow-hidden transition-all"
                  >
                    {/* 縮圖 */}
                    <div className="aspect-[16/9] bg-luxe-bg flex items-center justify-center relative">
                      {course.course_thumbnail_url ? (
                        <img
                          src={course.course_thumbnail_url}
                          alt={course.course_title || course.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl text-luxe-muted/30">🎓</span>
                      )}
                      {/* 狀態浮標 */}
                      <span
                        className={`absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-full ${sc.bg} ${sc.text} font-medium`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`}
                        />
                        {statusLabels[course.status] || course.status}
                      </span>
                      {/* 價格浮標 */}
                      <span className="absolute bottom-1.5 right-1.5 bg-luxe-gold/90 text-black text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                        NT$ {course.price?.toLocaleString() || 0}
                      </span>
                    </div>

                    {/* 資訊 */}
                    <div className="p-3">
                      <h3
                        className={`font-medium text-luxe-text truncate mb-1 ${
                          viewMode === "card-sm" ? "text-xs" : "text-sm"
                        }`}
                      >
                        {course.course_title || course.title}
                      </h3>
                      {viewMode !== "card-sm" && (
                        <p className="text-xs text-luxe-muted line-clamp-2 mb-2">
                          {course.course_description ||
                            course.description ||
                            "無描述"}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-luxe-muted">
                        <span>
                          {course.level
                            ? levelLabels[course.level] || course.level
                            : "-"}
                        </span>
                        <span>{course.lessonsCount || 0} 堂</span>
                      </div>

                      {/* 操作按鈕（觸控裝置始終顯示，桌面 hover 顯示） */}
                      <div className="flex gap-2 mt-2 pt-2 border-t border-luxe-gold/5">
                        <button
                          onClick={() =>
                            navigate(`/admin/courses/${course.course_id}/edit`)
                          }
                          className="text-luxe-gold hover:underline text-xs flex-1"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => openEditModal(course)}
                          className="text-blue-400 hover:underline text-xs"
                        >
                          快速編輯
                        </button>
                        <button
                          onClick={() => handleDelete(course)}
                          className="text-red-400 hover:underline text-xs"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="luxe"
            />
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!editingCourse}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCourse(null);
          resetForm();
        }}
        title={editingCourse ? "編輯課程" : "新增單堂課程"}
        size="xl"
        theme="luxe"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="課程名稱 *"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              theme="luxe"
            />
            <Input
              label="Slug (網址識別碼)"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              theme="luxe"
              placeholder="自動生成如留空"
            />
          </div>

          {/* 價格與難度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="價格 (NT$) *"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              theme="luxe"
              placeholder="0"
            />
            <div>
              <label className="block text-luxe-muted text-sm mb-2">難度</label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-2 text-luxe-text [&>option]:bg-luxe-bg [&>option]:text-luxe-text"
              >
                <option value="beginner">初學者</option>
                <option value="intermediate">進階</option>
                <option value="advanced">專家</option>
              </select>
            </div>
          </div>

          {/* 分類與關鍵字 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput
              label="分類"
              tags={formData.category}
              onChange={handleCategoryChange}
              theme="luxe"
              placeholder="輸入後按 Enter 新增"
              hint="可新增多個分類"
              maxTags={5}
            />
            <TagInput
              label="關鍵字 (SEO)"
              tags={formData.keywords}
              onChange={handleKeywordsChange}
              theme="luxe"
              placeholder="輸入後按 Enter 新增"
              hint="用於搜尋引擎優化"
              maxTags={10}
            />
          </div>

          {/* 簡介 */}
          <Textarea
            label="課程簡介"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            theme="luxe"
            rows={2}
          />

          {/* 詳細內容編輯器 */}
          <div>
            <label className="block text-luxe-muted text-sm mb-2">
              課程詳細內容
            </label>
            <ImageUploadTargetProvider
              value={{ entity: "course", entityKey: editingCourse?.course_id ?? null }}
            >
              <RichTextEditor
                content={formData.content}
                onChange={handleContentChange}
                theme="luxe"
                placeholder="輸入課程詳細內容..."
                minHeight="300px"
              />
            </ImageUploadTargetProvider>
          </div>

          {/* 狀態 */}
          <div>
            <label className="block text-luxe-muted text-sm mb-2">狀態</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "draft" | "published" | "archived",
                })
              }
              className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-2 text-luxe-text [&>option]:bg-luxe-bg [&>option]:text-luxe-text"
            >
              <option value="draft">草稿</option>
              <option value="published">發布</option>
              <option value="archived">封存</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-luxe-gold/20">
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setEditingCourse(null);
              resetForm();
            }}
          >
            取消
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            onClick={editingCourse ? handleUpdate : handleCreate}
          >
            {editingCourse ? "更新" : "建立"}
          </PillButton>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCourses;
