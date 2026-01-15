/**
 * 影片列表頁面元件
 *
 * 顯示所有影片內容,從 API 動態載入影片資料並以卡片形式展示。
 * 支援載入狀態和錯誤處理。
 *
 * @module pages/Videos
 */

import React, { useEffect, useState } from "react";
import { FaInstagram } from "react-icons/fa";

import api from "@/lib/api";
import VideoCard from "@/components/VideoCard";
import type { Video } from "@/types";

/**
 * 影片列表頁面元件
 *
 * 從後端 API 獲取影片資料並展示,提供 Instagram 連結供用戶追蹤更多內容。
 *
 * @returns {JSX.Element} 影片列表頁面元件
 */
const Videos: React.FC = (): JSX.Element => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * 從 API 獲取影片資料
   */
  useEffect(() => {
    const fetchVideos = async (): Promise<void> => {
      try {
        const res = await api.get<Video[]>("/api/videos");
        setVideos(res.data);
      } catch (err) {
        console.error("Failed to fetch videos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            教練 <span className="text-primary">短影音</span>
          </h1>
          <p className="text-base-content/70 mb-6 max-w-2xl mx-auto">
            跟著阿倫教官一起學習健身知識、訓練技巧,以及心理學在健身中的應用!
          </p>
          <a
            href="https://www.instagram.com/coach.luen/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline gap-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:border-pink-500 hover:text-white"
          >
            <FaInstagram className="text-xl" />
            追蹤 @coach.luen
          </a>
        </div>

        {/* Video Wall */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {videos.map((video) => (
                <VideoCard key={video.video_id} video={video} />
              ))}
            </div>

            {/* Footer CTA */}
            <div className="mt-12 text-center">
              <div className="divider"></div>
              <p className="text-base-content/60 mb-4">想看更多精彩內容?</p>
              <a
                href="https://www.instagram.com/coach.luen/reels/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary gap-2"
              >
                <FaInstagram className="text-xl" />
                查看所有 Reels
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Videos;
