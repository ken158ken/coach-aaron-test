/**
 * 影片管理頁面
 * @description 提供影片的新增、編輯、刪除、排序和顯示設定功能
 * @module pages/admin/AdminVideos
 */

import { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import api from "@/lib/api";
import {
  PageHeader,
  LoadingSpinner,
  ConfirmDialog,
  Toggle,
} from "@/components/ui";
import type { AdminVideo, VideoFormData } from "@/types";

/**
 * AdminVideos 元件
 *
 * @returns {JSX.Element} 影片管理頁面
 *
 * @example
 * ```tsx
 * <AdminVideos />
 * ```
 */
const AdminVideos = (): JSX.Element => {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editVideo, setEditVideo] = useState<AdminVideo | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<AdminVideo | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchVideos();
  }, []);

  /**
   * 取得影片列表
   *
   * @returns {Promise<void>}
   */
  const fetchVideos = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<AdminVideo[]>("/api/videos/admin/all");
      setVideos(res.data);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      setError("載入影片失敗");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 儲存影片（新增或更新）
   *
   * @returns {Promise<void>}
   */
  const handleSave = async (): Promise<void> => {
    if (!editVideo) return;

    try {
      setError("");
      const data: VideoFormData = {
        title: editVideo.title,
        url: editVideo.url,
        type: editVideo.type,
        sortOrder: editVideo.sort_order,
        isVisible: editVideo.is_visible,
      };

      if (isNew) {
        await api.post("/api/videos", data);
      } else {
        await api.put(`/api/videos/${editVideo.video_id}`, data);
      }
      await fetchVideos();
      setEditVideo(null);
      setIsNew(false);
    } catch (err) {
      console.error("Failed to save video:", err);
      setError(isNew ? "新增影片失敗" : "更新影片失敗");
    }
  };

  /**
   * 刪除影片
   *
   * @returns {Promise<void>}
   */
  const handleDelete = async (): Promise<void> => {
    if (!deleteVideo) return;

    try {
      setError("");
      await api.delete(`/api/videos/${deleteVideo.video_id}`);
      await fetchVideos();
      setDeleteVideo(null);
    } catch (err) {
      console.error("Failed to delete video:", err);
      setError("刪除影片失敗");
    }
  };

  /**
   * 切換影片顯示狀態
   *
   * @param {AdminVideo} video - 影片資料
   * @returns {Promise<void>}
   */
  const handleToggleVisible = async (video: AdminVideo): Promise<void> => {
    try {
      setError("");
      await api.put(`/api/videos/${video.video_id}`, {
        isVisible: !video.is_visible,
      });
      await fetchVideos();
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      setError("切換顯示狀態失敗");
    }
  };

  /**
   * 開啟新增影片對話框
   */
  const handleNew = (): void => {
    setEditVideo({
      video_id: 0,
      title: "",
      url: "",
      type: "instagram",
      sort_order: videos.length,
      is_visible: true,
    });
    setIsNew(true);
  };

  /**
   * 取得影片類型圖示
   *
   * @param {string} type - 影片類型
   * @returns {JSX.Element | null} 圖示元件
   */
  const getTypeIcon = (type: string): JSX.Element | null => {
    switch (type) {
      case "instagram":
        return <FaInstagram className="text-pink-500" />;
      case "youtube":
        return <FaYoutube className="text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner text="載入影片中..." />;
  }

  return (
    <div>
      <PageHeader
        title="影片管理"
        subtitle={`共 ${videos.length} 部影片`}
        actions={
          <button className="btn btn-primary btn-sm gap-2" onClick={handleNew}>
            <FaPlus /> 新增影片
          </button>
        }
      />

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-12">排序</th>
                  <th>標題</th>
                  <th>類型</th>
                  <th>網址</th>
                  <th>顯示</th>
                  <th className="w-24">操作</th>
                </tr>
              </thead>
              <tbody>
                {videos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-base-content/50"
                    >
                      尚無影片
                    </td>
                  </tr>
                ) : (
                  videos.map((video, index) => (
                    <tr key={video.video_id}>
                      <td>
                        <span className="text-base-content/50">
                          {index + 1}
                        </span>
                      </td>
                      <td className="font-medium">{video.title}</td>
                      <td>
                        <span className="flex items-center gap-2">
                          {getTypeIcon(video.type)}
                          {video.type}
                        </span>
                      </td>
                      <td>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary text-sm truncate block max-w-xs"
                        >
                          {video.url}
                        </a>
                      </td>
                      <td>
                        <Toggle
                          checked={video.is_visible}
                          onChange={() => handleToggleVisible(video)}
                        />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setEditVideo(video);
                              setIsNew(false);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => setDeleteVideo(video)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 編輯/新增對話框 */}
      {editVideo && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {isNew ? "新增影片" : "編輯影片"}
            </h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">標題 *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editVideo.title}
                  onChange={(e) =>
                    setEditVideo({ ...editVideo, title: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">影片網址 *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="https://www.instagram.com/reel/..."
                  value={editVideo.url}
                  onChange={(e) =>
                    setEditVideo({ ...editVideo, url: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">類型</span>
                </label>
                <select
                  className="select select-bordered"
                  value={editVideo.type}
                  onChange={(e) =>
                    setEditVideo({
                      ...editVideo,
                      type: e.target.value as
                        | "instagram"
                        | "youtube"
                        | "tiktok",
                    })
                  }
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">排序</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={editVideo.sort_order}
                  onChange={(e) =>
                    setEditVideo({
                      ...editVideo,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <Toggle
                  checked={editVideo.is_visible}
                  onChange={(v) =>
                    setEditVideo({ ...editVideo, is_visible: v })
                  }
                  label="顯示在前台"
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditVideo(null);
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
              setEditVideo(null);
              setIsNew(false);
            }}
          ></div>
        </div>
      )}

      {/* 刪除確認 */}
      <ConfirmDialog
        isOpen={!!deleteVideo}
        title="確認刪除"
        message={`確定要刪除影片「${deleteVideo?.title}」嗎？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVideo(null)}
        confirmText="刪除"
        danger
      />
    </div>
  );
};

export default AdminVideos;
