/**
 * 課程管理頁面
 * @description 提供課程的新增、編輯、刪除和狀態管理功能
 * @module pages/admin/AdminCourses
 */

import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import api from "@/lib/api";
import { formatCurrency, STATUS_TEXT } from "@/lib/ui";
import {
  PageHeader,
  LoadingSpinner,
  StatusBadge,
  ConfirmDialog,
} from "@/components/ui";
import type { AdminCourse, CourseFormData } from "@/types";

/**
 * AdminCourses 元件
 *
 * @returns {JSX.Element} 課程管理頁面
 *
 * @example
 * ```tsx
 * <AdminCourses />
 * ```
 */
const AdminCourses = (): JSX.Element => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editCourse, setEditCourse] = useState<AdminCourse | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<AdminCourse | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCourses();
  }, []);

  /**
   * 取得課程列表
   *
   * @returns {Promise<void>}
   */
  const fetchCourses = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<AdminCourse[]>("/api/courses/admin/all");
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError("載入課程失敗");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 儲存課程（新增或更新）
   *
   * @returns {Promise<void>}
   */
  const handleSave = async (): Promise<void> => {
    if (!editCourse) return;

    try {
      setError("");
      const data: CourseFormData = {
        courseTitle: editCourse.course_title,
        courseSlug: editCourse.course_slug,
        courseDescription: editCourse.course_description,
        courseContent: editCourse.course_content,
        courseThumbnailUrl: editCourse.course_thumbnail_url,
        courseVideoUrl: editCourse.course_video_url,
        price: parseFloat(String(editCourse.price)) || 0,
        status: editCourse.status,
      };

      if (isNew) {
        await api.post("/api/courses", data);
      } else {
        await api.put(`/api/courses/${editCourse.course_id}`, data);
      }
      await fetchCourses();
      setEditCourse(null);
      setIsNew(false);
    } catch (err) {
      console.error("Failed to save course:", err);
      setError(isNew ? "新增課程失敗" : "更新課程失敗");
    }
  };

  /**
   * 刪除課程
   *
   * @returns {Promise<void>}
   */
  const handleDelete = async (): Promise<void> => {
    if (!deleteCourse) return;

    try {
      setError("");
      await api.delete(`/api/courses/${deleteCourse.course_id}`);
      await fetchCourses();
      setDeleteCourse(null);
    } catch (err) {
      console.error("Failed to delete course:", err);
      setError("刪除課程失敗");
    }
  };

  /**
   * 開啟新增課程對話框
   */
  const handleNew = (): void => {
    setEditCourse({
      course_id: 0,
      course_title: "",
      course_slug: "",
      course_description: "",
      course_content: "",
      course_thumbnail_url: "",
      course_video_url: "",
      price: 0,
      status: "draft",
      created_at: new Date().toISOString(),
    });
    setIsNew(true);
  };

  if (loading) {
    return <LoadingSpinner text="載入課程中..." />;
  }

  return (
    <div>
      <PageHeader
        title="課程管理"
        subtitle={`共 ${courses.length} 個課程`}
        actions={
          <button className="btn btn-primary btn-sm gap-2" onClick={handleNew}>
            <FaPlus /> 新增課程
          </button>
        }
      />

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div
            key={course.course_id}
            className="card bg-base-100 shadow-md border border-base-300"
          >
            <figure className="h-40 bg-base-200">
              {course.course_thumbnail_url ? (
                <img
                  src={course.course_thumbnail_url}
                  alt={course.course_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-base-content/30">
                  無圖片
                </div>
              )}
            </figure>
            <div className="card-body p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="card-title text-base line-clamp-1">
                  {course.course_title}
                </h3>
                <StatusBadge
                  status={course.status}
                  text={STATUS_TEXT[course.status]}
                />
              </div>
              <p className="text-sm text-base-content/60 line-clamp-2">
                {course.course_description || "無描述"}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary">
                  {formatCurrency(course.price)}
                </span>
                <span className="text-xs text-base-content/50">
                  {course.total_enrolled || 0} 人購買
                </span>
              </div>
              <div className="card-actions justify-end mt-2">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setEditCourse(course);
                    setIsNew(false);
                  }}
                >
                  <FaEdit /> 編輯
                </button>
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setDeleteCourse(course)}
                >
                  <FaTrash /> 刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-base-content/50">
          尚無課程，點擊「新增課程」開始
        </div>
      )}

      {/* 編輯/新增對話框 */}
      {editCourse && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {isNew ? "新增課程" : "編輯課程"}
            </h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">課程名稱 *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editCourse.course_title}
                  onChange={(e) =>
                    setEditCourse({
                      ...editCourse,
                      course_title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">網址代稱 (slug)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="例如: beginner-workout"
                  value={editCourse.course_slug || ""}
                  onChange={(e) =>
                    setEditCourse({
                      ...editCourse,
                      course_slug: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">簡短描述 (SEO用，50字內)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  maxLength={50}
                  value={editCourse.course_description || ""}
                  onChange={(e) =>
                    setEditCourse({
                      ...editCourse,
                      course_description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">詳細內容</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32"
                  value={editCourse.course_content || ""}
                  onChange={(e) =>
                    setEditCourse({
                      ...editCourse,
                      course_content: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">縮圖網址</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={editCourse.course_thumbnail_url || ""}
                    onChange={(e) =>
                      setEditCourse({
                        ...editCourse,
                        course_thumbnail_url: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">影片網址</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={editCourse.course_video_url || ""}
                    onChange={(e) =>
                      setEditCourse({
                        ...editCourse,
                        course_video_url: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">價格 (TWD) *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={editCourse.price}
                    onChange={(e) =>
                      setEditCourse({
                        ...editCourse,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">狀態</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={editCourse.status}
                    onChange={(e) =>
                      setEditCourse({
                        ...editCourse,
                        status: e.target.value as
                          | "draft"
                          | "published"
                          | "archived",
                      })
                    }
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已發布</option>
                    <option value="archived">已封存</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditCourse(null);
                  setIsNew(false);
                }}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {isNew ? "建立" : "儲存"}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setEditCourse(null);
              setIsNew(false);
            }}
          ></div>
        </div>
      )}

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deleteCourse}
        title="確認刪除"
        message={`確定要刪除課程「${deleteCourse?.course_title}」嗎？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteCourse(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminCourses;
