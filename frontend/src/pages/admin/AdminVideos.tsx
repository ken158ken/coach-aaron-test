/**
 * AdminVideos 頁面 - 影片管理
 * @module pages/admin/AdminVideos
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { DataTable, Pagination, PillButton, Input } from "@/components/ui";
import { get } from "@/services/api";
import type { Video, AdminVideo } from "@/types";

/**
 * AdminVideos - 影片管理頁面
 *
 * @returns {JSX.Element} 影片管理頁面
 */
const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await get<AdminVideo[]>("/api/videos/admin/all");
        // ✅ 防禦性編程：API 攔截器返回 response.data，所以 res 本身就是數據
        if (res && Array.isArray(res)) {
          setVideos(
            res.map(
              (v) =>
                ({
                  // 資料庫欄位
                  video_id: v.video_id,
                  title: v.title,
                  url: v.url,
                  type: v.type,
                  sort_order: v.sort_order,
                  is_visible: v.is_visible,
                  created_at: v.created_at || new Date().toISOString(),
                  updated_at: v.updated_at || new Date().toISOString(),
                  // 前端別名
                  id: v.video_id,
                  category: v.type,
                  isVisible: v.is_visible,
                  sortOrder: v.sort_order,
                  views: 0,
                }) as Video,
            ),
          );
        } else {
          console.error("Failed to fetch videos:", res);
          setVideos([]);
          setError("載入影片失敗：數據格式錯誤");
        }
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setVideos([]);
        setError("載入影片失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "title" as const, header: "影片標題", isPrimary: true },
    { key: "category" as const, header: "分類" },
    { key: "duration" as const, header: "時長", hideOnMobile: true },
    {
      key: "views" as const,
      header: "觀看數",
      hideOnMobile: true,
      render: (video: Video) => `${video.views?.toLocaleString() || 0} 次`,
    },
    {
      key: "actions" as const,
      header: "操作",
      render: () => (
        <button className="text-luxe-gold hover:underline text-sm">編輯</button>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-luxe-text">影片管理</h1>
          <p className="text-luxe-muted">管理所有影片</p>
        </div>
        <PillButton theme="luxe" variant="outline" className="w-full sm:w-auto">
          上傳影片
        </PillButton>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="搜尋影片..."
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

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredVideos}
        keyExtractor={(video) => video.video_id}
        loading={loading}
        theme="luxe"
        emptyMessage="沒有找到影片"
      />

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
          theme="luxe"
        />
      </div>
    </div>
  );
};

export default AdminVideos;
