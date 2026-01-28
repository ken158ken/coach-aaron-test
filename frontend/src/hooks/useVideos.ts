/**
 * useVideos Hook - 管理影片資料
 * @module hooks/useVideos
 */

import { useState, useEffect, useCallback } from "react";
import { videoService } from "@/services";
import type { Video } from "@/types";

interface UseVideosReturn {
  videos: Video[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 獲取影片列表
 *
 * @returns {UseVideosReturn} 影片資料及狀態
 */
export const useVideos = (): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await videoService.getVideos();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "獲取影片失敗");
      console.error("獲取影片失敗:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
};

export default useVideos;
