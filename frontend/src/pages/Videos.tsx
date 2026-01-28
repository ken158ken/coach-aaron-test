/**
 * Videos 頁面 - 影片列表
 * @module pages/Videos
 * @theme prism (VOID PRISM 水晶主題)
 */

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/context";
import { PrismScene } from "@/components/three";
import {
  VideoCard,
  FilterPill,
  Loading,
  Input,
  Pagination,
} from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { videoService } from "@/services";
import type { Video } from "@/types";

/** 每頁顯示數量 */
const ITEMS_PER_PAGE = 8;

/**
 * Videos - 影片列表頁面
 *
 * @returns {JSX.Element} 影片頁面
 */
const Videos: React.FC = () => {
  const { setTheme } = useTheme();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filterOptions = [
    { value: "all", label: "全部" },
    { value: "training", label: "訓練" },
    { value: "nutrition", label: "營養" },
    { value: "lifestyle", label: "生活" },
  ];

  useEffect(() => {
    setTheme("prism");
  }, [setTheme]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videoService.getVideos();
        setVideos(data);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        // Demo data (正規化後的格式)
        setVideos([
          {
            video_id: 1,
            id: 1,
            title: "胸肌訓練完整教學 | 5個必學動作",
            description: "完整的胸肌訓練指南...",
            category: "training",
            type: "youtube",
            url: "https://youtube.com/watch?v=demo1",
            duration: 930,
            views: 12500,
            thumbnail: "/images/video-1.jpg",
            sort_order: 1,
            is_visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            video_id: 2,
            id: 2,
            title: "增肌期飲食規劃 | 一週菜單示範",
            description: "增肌期的飲食安排...",
            category: "nutrition",
            type: "youtube",
            url: "https://youtube.com/watch?v=demo2",
            duration: 765,
            views: 8900,
            thumbnail: "/images/video-2.jpg",
            sort_order: 2,
            is_visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            video_id: 3,
            id: 3,
            title: "如何維持運動動力 | 心態建設",
            description: "分享保持訓練熱情的方法...",
            category: "motivation",
            type: "youtube",
            url: "https://youtube.com/watch?v=demo3",
            duration: 620,
            views: 6700,
            thumbnail: "/images/video-3.jpg",
            sort_order: 3,
            is_visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            video_id: 4,
            id: 4,
            title: "背肌訓練技巧 | 感受度提升",
            description: "提升背部訓練感受度...",
            category: "training",
            type: "youtube",
            url: "https://youtube.com/watch?v=demo4",
            duration: 1095,
            views: 15200,
            thumbnail: "/images/video-4.jpg",
            sort_order: 4,
            is_visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ] as Video[]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // 篩選與搜尋邏輯
  const filteredVideos = useMemo(() => {
    let result = videos;

    // 依分類篩選
    if (filter !== "all") {
      result = result.filter((v) => v.category === filter);
    }

    // 依關鍵字搜尋
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.title?.toLowerCase().includes(term) ||
          v.description?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [videos, filter, searchTerm]);

  // 分頁邏輯
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVideos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVideos, currentPage]);

  // 當篩選或搜尋變更時，重置頁碼
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  return (
    <div className="relative min-h-screen bg-prism-bg">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="教學影片"
        description="免費的健身知識分享，提供訓練教學、營養指南、生活建議等多元影片內容。"
        keywords={["健身影片", "訓練教學", "營養指南", "健身知識"]}
        url="/videos"
      />

      {/* Three.js Background */}
      <PrismScene />

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block text-prism-accent text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4">
              Videos
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-prism-text mb-3 sm:mb-4">
              教學影片
            </h1>
            <p className="text-sm sm:text-base text-prism-text/60 max-w-xl mx-auto px-2">
              免費的健身知識分享，隨時隨地學習
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            {/* 搜尋框 */}
            <div className="w-full sm:w-auto">
              <Input
                placeholder="搜尋影片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                theme="prism"
                className="w-full sm:w-64"
                icon={
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
            <div className="flex justify-center py-12 sm:py-20">
              <Loading theme="prism" text="載入影片中..." />
            </div>
          ) : paginatedVideos.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <p className="text-sm sm:text-base text-prism-text/60">
                {searchTerm
                  ? `找不到符合「${searchTerm}」的影片`
                  : "目前沒有符合條件的影片"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-3 sm:mt-4 text-sm sm:text-base text-prism-accent hover:underline"
                >
                  清除搜尋
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 結果統計 */}
              <p className="text-prism-text/50 text-xs sm:text-sm text-center mb-4 sm:mb-6">
                共 {filteredVideos.length} 部影片
                {totalPages > 1 && ` · 第 ${currentPage} / ${totalPages} 頁`}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {paginatedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} theme="prism" />
                ))}
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-10">
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

export default Videos;
