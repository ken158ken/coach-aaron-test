/**
 * 使用者服務 - 處理使用者資料相關 API
 * @module services/user.service
 */

import { post, del } from "../api";

/** 頭像上傳回應 */
interface AvatarUploadResponse {
  success: boolean;
  avatarUrl: string;
}

/** 頭像來源類型 */
type AvatarType = "upload" | "generated";

/**
 * 使用者服務物件
 */
export const userService = {
  /**
   * 上傳頭像（base64）
   *
   * @param {string} imageBase64 - base64 編碼的圖片
   * @param {AvatarType} type - "upload"（原始上傳）或 "generated"（已裁切/生成）
   * @returns {Promise<AvatarUploadResponse>} 上傳回應
   */
  uploadAvatar: async (
    imageBase64: string,
    type: AvatarType = "upload",
  ): Promise<AvatarUploadResponse> => {
    return post<AvatarUploadResponse>("/api/user/avatar", {
      image: imageBase64,
      type,
    });
  },

  /**
   * 刪除頭像
   *
   * @returns {Promise<{ success: boolean }>} 刪除回應
   */
  deleteAvatar: async (): Promise<{ success: boolean }> => {
    return del<{ success: boolean }>("/api/user/avatar");
  },
};

export default userService;
