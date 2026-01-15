/**
 * useVideos Hook - 管理影片資料
 * @module hooks/useVideos
 */

import { useState, useEffect } from "react";
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
 */
export const useVideos = (): UseVideosReturn => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
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
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
};
