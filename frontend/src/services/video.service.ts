/**
 * 影片服務 - 處理影片相關的 API 請求
 * @module services/video
 */

import { get } from "./api";
import type { Video } from "@/types";

/**
 * 影片列表回應
 */
interface VideosResponse {
  videos: Video[];
}

/**
 * Video Service
 */
export const videoService = {
  /**
   * 獲取所有可見影片
   */
  async getVideos(): Promise<Video[]> {
    const response = await get<VideosResponse>("/api/videos");
    return response.videos;
  },

  /**
   * 獲取影片詳情
   */
  async getVideoById(videoId: number): Promise<Video> {
    const response = await get<{ video: Video }>(`/api/videos/${videoId}`);
    return response.video;
  },
};
