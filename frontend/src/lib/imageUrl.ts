/**
 * 圖片網址驗證 — 前端唯一實作
 * @module lib/imageUrl
 *
 * @description
 * 全站圖片欄位只接受兩種來源：
 *   1. Cloudinary（不限帳號）— 只驗證與引用，程式無法刪除遠端資產
 *   2. 自家 Supabase Storage 公開網址 — 由後端 /api/uploads/* 上傳產生
 *
 * ⚠️ 這是前端唯一一份驗證實作。新增圖片欄位請 import 這裡，
 *    不要再各自寫一份 regex（歷史上散落 8 份，行為互相矛盾造成存檔失敗）。
 *    後端對應實作在 `backend/utils/imageUrl.ts`，兩邊規則必須一致。
 */

/** Cloudinary 網址前綴（不限帳號，業主可用任何 Cloudinary 帳號的圖） */
export const CLOUDINARY_PREFIX = "https://res.cloudinary.com/";

/** Supabase Storage 公開物件路徑特徵 */
const SUPABASE_PUBLIC_PATTERN =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[^/]+\/.+/i;

/** 允許上傳的 MIME 類型（與後端 multer fileFilter 對齊） */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

/** `<input accept>` 用字串 */
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

/** 單檔大小上限（5MB，與後端 multer limits 對齊） */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 是否為本站 Cloudinary 網址 */
export function isCloudinaryUrl(url: string): boolean {
  return typeof url === "string" && url.trim().startsWith(CLOUDINARY_PREFIX);
}

/** 是否為自家 Supabase Storage 公開網址 */
export function isOwnStorageUrl(url: string): boolean {
  return typeof url === "string" && SUPABASE_PUBLIC_PATTERN.test(url.trim());
}

/**
 * 是否為站內相對路徑（例如 `/images/coach-aaron.jpg`）。
 * 明確排除 protocol-relative（`//evil.com/x.jpg`）。與後端規則一致。
 */
export function isSiteRelativeImagePath(url: string): boolean {
  return typeof url === "string" && /^\/(?!\/)/.test(url.trim());
}

/**
 * 圖片欄位是否可存檔。
 * 空字串視為合法（代表「未設定」，欄位非必填時由呼叫端自行擋）。
 */
export function isAllowedImageUrl(url: string | null | undefined): boolean {
  if (url === null || url === undefined) return true;
  const trimmed = url.trim();
  if (trimmed === "") return true;
  return (
    isCloudinaryUrl(trimmed) ||
    isOwnStorageUrl(trimmed) ||
    isSiteRelativeImagePath(trimmed)
  );
}

/**
 * 取得不合法圖片網址的繁中錯誤訊息；合法時回 null。
 * @param label 欄位名稱，用來組出「封面縮圖 必須…」這種訊息
 */
export function imageUrlError(
  url: string | null | undefined,
  label = "圖片",
): string | null {
  if (isAllowedImageUrl(url)) return null;
  return `${label}網址不合法：請使用「上傳圖片」，或貼上以 ${CLOUDINARY_PREFIX} 開頭的 Cloudinary 網址。`;
}

/** 檔案本身是否可上傳；不合法回繁中原因，合法回 null */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "檔案格式不支援，請選擇 JPG / PNG / WebP / GIF / AVIF 圖片。";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `檔案太大（${mb} MB），請壓縮到 5 MB 以內再上傳。`;
  }
  return null;
}
