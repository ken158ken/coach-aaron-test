/**
 * 影片服務
 * @module services/video.service
 */

import { get, post, put, del } from "./api";
import type { Video, AdminVideo } from "@/types";

/**
 * 正規化影片資料 (資料庫欄位 -> 前端欄位)
 * @param data 原始影片資料
 * @returns 正規化後的影片資料
 */
const normalizeVideo = (data: Partial<Video>): Video => {
  return {
    ...data,
    // 保留原始欄位，同時添加前端別名
    id: data.video_id,
    isVisible: data.is_visible,
    sortOrder: data.sort_order,
    category: data.type as Video["category"], // 臨時映射
    views: 0, // 預設值
  } as Video;
};

/**
 * 影片服務物件
 */
export const videoService = {
  /**
   * 取得所有影片
   */
  getAll: async (): Promise<Video[]> => {
    const data = await get<Video[]>("/api/videos");
    return Array.isArray(data) ? data.map(normalizeVideo) : [];
  },

  /**
   * 取得所有影片 (alias)
   */
  getVideos: async (): Promise<Video[]> => {
    const data = await get<Video[]>("/api/videos");
    return Array.isArray(data) ? data.map(normalizeVideo) : [];
  },

  /**
   * 取得單一影片
   */
  getById: async (id: number): Promise<Video> => {
    const data = await get<Video>(`/api/videos/${id}`);
    return normalizeVideo(data);
  },

  /**
   * 建立影片（管理員）
   */
  create: async (data: Partial<AdminVideo>): Promise<AdminVideo> => {
    return post<AdminVideo>("/api/admin/videos", data);
  },

  /**
   * 更新影片（管理員）
   */
  update: async (
    id: number,
    data: Partial<AdminVideo>,
  ): Promise<AdminVideo> => {
    return put<AdminVideo>(`/api/admin/videos/${id}`, data);
  },

  /**
   * 刪除影片（管理員）
   */
  delete: async (id: number): Promise<void> => {
    return del(`/api/admin/videos/${id}`);
  },

  /**
   * 批量更新排序（管理員）
   * @param orders 排序陣列 [{ id, sortOrder }]
   */
  reorder: async (
    orders: { id: number; sortOrder: number }[],
  ): Promise<void> => {
    return put("/api/videos/admin/reorder", { orders });
  },
};

export default videoService;
