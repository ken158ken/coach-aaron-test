/**
 * 統一圖片上傳服務
 * @module services/content/upload.service
 *
 * @description
 * 對接後端 `POST /api/uploads/:entity/:entityKey`（或 `/temp`）。
 * 後端會用 sharp 壓成 WebP 後放進對應 bucket，回 `{ url, path }`。
 *
 * 為什麼用 XMLHttpRequest 而不是共用的 axios client：
 *   1. axios instance 的 default header 是 `application/json`，v1 的 transformRequest
 *      看到 JSON content-type 會把 FormData 轉成 JSON 字串，multipart 直接壞掉。
 *   2. 需要真實的上傳進度（fetch 沒有 upload progress 事件）。
 * 認證沿用同一套記憶體 token（`getAuthToken()`），與 api client 一致。
 */

import { getAuthToken, getBaseURL } from "../api";

/** 後端 uploads route 的 entity 白名單 */
export type ImageEntity =
  | "course"
  | "lesson"
  | "article"
  | "testimonial"
  | "gallery"
  | "site-content";

/** 後端 sharp preset 對應的用途 */
export type ImageKind = "cover" | "banner" | "thumb" | "content" | "photo";

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadOptions {
  entity: ImageEntity;
  /** 已存在的實體 key（數字 id / `gallery_3` / `site_hero_bg`）；null 或空 → 走 temp/ */
  entityKey?: string | number | null;
  kind: ImageKind;
  file: File;
  /** 0–100；瀏覽器不支援 lengthComputable 時不會被呼叫 */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/** 從 XHR 回應中取出後端的中文錯誤訊息 */
function parseError(xhr: XMLHttpRequest): string {
  try {
    const body = JSON.parse(xhr.responseText) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    /* 非 JSON 回應（例如 proxy 502 的 HTML）→ 用泛用訊息 */
  }
  if (xhr.status === 401 || xhr.status === 403) return "沒有上傳權限，請重新登入後再試。";
  if (xhr.status === 413) return "檔案太大，請壓縮到 5 MB 以內再上傳。";
  if (xhr.status === 404) return "上傳位置不存在，請重新整理頁面後再試。";
  if (xhr.status === 0) return "網路連線中斷，請檢查網路後重試。";
  return `上傳失敗（${xhr.status}），請稍後再試。`;
}

/**
 * 上傳一張圖片。
 * entityKey 有值 → 直接存到正式路徑；沒有值 → 存到 `temp/`，
 * 由後端在實體儲存時 finalize 搬到正式路徑（前端不需處理）。
 */
export function uploadImage({
  entity,
  entityKey,
  kind,
  file,
  onProgress,
  signal,
}: UploadOptions): Promise<UploadResult> {
  const key =
    entityKey === null || entityKey === undefined || entityKey === ""
      ? "temp"
      : encodeURIComponent(String(entityKey));

  const url =
    `${getBaseURL()}/api/uploads/${entity}/${key}` +
    `?kind=${encodeURIComponent(kind)}`;

  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    // kind 同時放進 body，讓後端 body/query 兩種讀法都成立
    form.append("kind", kind);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.withCredentials = true;

    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // 不要手動設 Content-Type：讓瀏覽器帶上 multipart boundary

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort);

    const cleanup = () => signal?.removeEventListener("abort", onAbort);

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResult;
          if (!data?.url) {
            reject(new Error("上傳成功但未取得圖片網址，請稍後再試。"));
            return;
          }
          resolve(data);
        } catch {
          reject(new Error("上傳回應格式錯誤，請稍後再試。"));
        }
      } else {
        reject(new Error(parseError(xhr)));
      }
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("網路連線中斷，請檢查網路後重試。"));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("已取消上傳", "AbortError"));
    };

    xhr.send(form);
  });
}

export const uploadService = { uploadImage };
