/**
 * @fileoverview 圖片網址驗證 — 後端唯一實作
 *
 * 全站圖片欄位只接受三種值：
 *   1. 空值（"" / null / undefined）＝ 沒有圖
 *   2. Cloudinary 網址（任何帳號皆可，業主可自由使用自己的 Cloudinary）
 *   3. 本站 Supabase Storage 的 public URL（限自管 bucket）
 *   4. 站內相對路徑（`/images/xxx.jpg` 這類打包在前端的靜態圖）
 *
 * 前端對應檔：`frontend/src/lib/imageUrl.ts`（同一份契約，兩邊各留一份）
 *
 * 注意：本模組刻意保持「零相依」（不 import supabase client / logger），
 * 讓 route、cron、工具腳本都能安全引用，也不會產生循環相依。
 *
 * @module utils/imageUrl
 */

// ───────────────────────────────────────────────────────────────
// 常數
// ───────────────────────────────────────────────────────────────

/** 唯一允許的 Cloudinary 帳號前綴（鎖帳號，避免任意外站圖） */
export const CLOUDINARY_PREFIX = "https://res.cloudinary.com/";

/**
 * 本站自管的 Storage bucket — 全專案唯一真實來源。
 * `utils/imageStorage.ts` 會 re-export，route 請從那裡取用。
 */
export const IMAGE_BUCKETS = {
  /** 課程封面 / banner */
  COURSE: "course-images",
  /** 教學影片縮圖 */
  LESSON: "lesson-thumbnails",
  /** 文章封面 / banner / 內文插圖 */
  ARTICLE: "article-images",
  /** 學員見證 / 相片輪播 / 網站內容圖 */
  CONTENT: "content-images",
  /** IG 影片縮圖（videos.ts 既有機制） */
  VIDEO: "thumbnails",
  /** Landing Page 專案圖 */
  LANDING: "lp-images",
  /** 聊天室圖片（由 chatCron 自行管理，本系統不介入） */
  CHAT: "chat-images",
} as const;

export type ImageBucket = (typeof IMAGE_BUCKETS)[keyof typeof IMAGE_BUCKETS];

/** 所有自管 bucket — 判斷「這是不是我們自己的檔案」用 */
export const ALL_IMAGE_BUCKETS: readonly ImageBucket[] = Object.freeze([
  IMAGE_BUCKETS.COURSE,
  IMAGE_BUCKETS.LESSON,
  IMAGE_BUCKETS.ARTICLE,
  IMAGE_BUCKETS.CONTENT,
  IMAGE_BUCKETS.VIDEO,
  IMAGE_BUCKETS.LANDING,
  IMAGE_BUCKETS.CHAT,
]);

/**
 * 清理 cron 會掃描的 bucket。
 * chat-images 有自己的 TTL cron（chatCron.ts），刻意排除避免雙重清理。
 */
export const MANAGED_IMAGE_BUCKETS: readonly ImageBucket[] = Object.freeze([
  IMAGE_BUCKETS.COURSE,
  IMAGE_BUCKETS.LESSON,
  IMAGE_BUCKETS.ARTICLE,
  IMAGE_BUCKETS.CONTENT,
  IMAGE_BUCKETS.VIDEO,
  IMAGE_BUCKETS.LANDING,
]);

/** Supabase public object URL 的固定路徑片段 */
const STORAGE_PATH_SEGMENT = "/storage/v1/object/public/";

/** Loom oEmbed 自動帶回的縮圖網域（lessons.ts 專用放行，見 isLessonThumbnailUrl） */
const LOOM_THUMBNAIL_PREFIXES = [
  "https://cdn.loom.com/",
  "https://cdn.loom.com.s3.amazonaws.com/",
  "https://loom-videos.s3.amazonaws.com/",
] as const;

// ───────────────────────────────────────────────────────────────
// 基礎判斷
// ───────────────────────────────────────────────────────────────

/**
 * Storage public URL 的前綴（`{SUPABASE_URL}/storage/v1/object/public/`）。
 *
 * 用 function 而非 module 常數是刻意的：本檔可能在 `dotenv.config()` 之前被 import，
 * 提前抓 `process.env.SUPABASE_URL` 會拿到空字串並永久失效。
 */
export function storagePublicBase(): string {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}${STORAGE_PATH_SEGMENT}` : "";
}

/** 是否為空值（空字串 / null / undefined）— 代表「沒有圖」，一律視為合法 */
export function isEmptyImageValue(url: unknown): boolean {
  return url === null || url === undefined || (typeof url === "string" && url.trim() === "");
}

/** 是否為 Cloudinary 網址（不限帳號） */
export function isCloudinaryUrl(url: unknown): boolean {
  return typeof url === "string" && url.startsWith(CLOUDINARY_PREFIX);
}

/** 是否為本站 Supabase Storage（自管 bucket）的 public URL */
export function isOwnStorageUrl(url: unknown): boolean {
  return parseStorageUrl(url) !== null;
}

/**
 * 是否為站內相對路徑（例如 `/images/coach-aaron.jpg`）。
 * 明確排除 protocol-relative（`//evil.com/x.jpg`）避免被當成外站跳板。
 */
export function isSiteRelativeImagePath(url: unknown): boolean {
  return typeof url === "string" && /^\/(?!\/)/.test(url);
}

/**
 * Loom 自動帶回的縮圖網址。
 * 只有 lesson 縮圖會用到（後端從 oEmbed 自動填入，不是使用者輸入）。
 */
export function isLoomThumbnailUrl(url: unknown): boolean {
  return (
    typeof url === "string" &&
    LOOM_THUMBNAIL_PREFIXES.some((prefix) => url.startsWith(prefix))
  );
}

/**
 * 全站圖片欄位的統一驗證。
 *
 * @param url 待驗證的值
 * @returns 合法為 true；空值視為合法（代表清空圖片）
 */
export function isAllowedImageUrl(url: unknown): boolean {
  if (isEmptyImageValue(url)) return true;
  if (typeof url !== "string") return false;
  return isCloudinaryUrl(url) || isOwnStorageUrl(url) || isSiteRelativeImagePath(url);
}

/**
 * lesson 縮圖專用：在通用規則之外額外放行 Loom CDN。
 *
 * 原因：`POST/PUT /api/lessons` 在 admin 沒給縮圖時會呼叫 Loom oEmbed 自動補圖，
 * 那個網址不是使用者輸入、也不可能是我們的 bucket，用通用規則會把自家流程擋掉。
 */
export function isAllowedLessonThumbnailUrl(url: unknown): boolean {
  return isAllowedImageUrl(url) || isLoomThumbnailUrl(url);
}

/**
 * 產生統一的中文錯誤訊息。
 * @param fieldLabel 欄位中文名（例如「課程封面」）
 */
export function imageUrlErrorMessage(fieldLabel: string): string {
  return `${fieldLabel}網址不合法：只接受 Cloudinary（${CLOUDINARY_PREFIX}…）或本站上傳的圖片`;
}

// ───────────────────────────────────────────────────────────────
// Storage URL 解析
// ───────────────────────────────────────────────────────────────

export interface ParsedStorageUrl {
  /** bucket 名稱 */
  bucket: ImageBucket;
  /** bucket 內的物件路徑（已 decode，可直接丟給 storage API） */
  path: string;
}

/**
 * 把本站 Storage public URL 拆成 `{ bucket, path }`。
 *
 * - 會自動去掉 query string（videos.ts 的 `?v=` cache-bust）
 * - bucket 不在自管清單內回 null（不會去動別人的 bucket）
 * - path 會嘗試 decodeURIComponent（Supabase getPublicUrl 會編碼非 ASCII 檔名）
 *
 * @returns 不是自家 storage URL 時回 null
 */
export function parseStorageUrl(url: unknown): ParsedStorageUrl | null {
  if (typeof url !== "string" || !url) return null;

  const base = storagePublicBase();
  if (!base || !url.startsWith(base)) return null;

  const rest = url.slice(base.length).split("?")[0].split("#")[0];
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;

  const bucket = rest.slice(0, slash) as ImageBucket;
  if (!ALL_IMAGE_BUCKETS.includes(bucket)) return null;

  const rawPath = rest.slice(slash + 1);
  if (!rawPath) return null;

  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    /* 含孤立 % 的舊檔名，維持原樣 */
  }

  return { bucket, path };
}

/**
 * 從任意文字（通常是文章內文 HTML）抽出所有本站 Storage 圖片 URL。
 * 孤兒掃描與「換圖刪舊檔」都需要知道內文引用了哪些檔案。
 *
 * @param text HTML 或純文字
 * @returns 去重後的 URL 陣列（保持原始字串，未 decode）
 */
/** extractStorageUrls 的 RegExp 快取（base 來自環境變數，行程內不會變） */
let cachedPattern: { base: string; re: RegExp } | null = null;

export function extractStorageUrls(text: unknown): string[] {
  if (typeof text !== "string" || !text) return [];

  const base = storagePublicBase();
  if (!base || !text.includes(base)) return [];

  // 以 base 為錨點往後吃到「網址不可能出現的字元」為止
  if (cachedPattern === null || cachedPattern.base !== base) {
    cachedPattern = {
      base,
      re: new RegExp(
        `${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\s"'<>\\\\)]+`,
        "g",
      ),
    };
  }
  const pattern = cachedPattern.re;

  const found = text.match(pattern) ?? [];
  const unique = new Set<string>();
  for (const raw of found) {
    // HTML 屬性尾端常黏到 &quot; / 標點，去掉不屬於網址的結尾字元
    const cleaned = raw.replace(/[.,;:!?&]+$/, "");
    if (parseStorageUrl(cleaned)) unique.add(cleaned);
  }
  return [...unique];
}

/**
 * 從內文 HTML 抽出「bucket + path」清單（孤兒掃描比對用）。
 */
export function extractStoragePaths(text: unknown): ParsedStorageUrl[] {
  return extractStorageUrls(text)
    .map(parseStorageUrl)
    .filter((p): p is ParsedStorageUrl => p !== null);
}
