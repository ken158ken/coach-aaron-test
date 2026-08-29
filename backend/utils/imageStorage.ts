/**
 * @fileoverview 圖片 Storage 生命週期工具
 *
 * 設計沿用 `routes/videos.ts` 的 finalizeThumbnail / removeStorageFile 模式，
 * 但抽成通用版本供所有實體共用。
 *
 * 路徑規則
 * ─────────────────────────────────────────────────────────────
 *   已有 id 的實體：`{entityKey}/{kind}_{ts}{rand4}.webp`
 *   還沒 id 的實體：`temp/{kind}_{ts}_{rand6}.webp`
 *
 *   entityKey：
 *     course / lesson / article / testimonial → 純數字 id
 *     gallery                                 → `gallery_{id}`
 *     site-content                            → `site_{content_key}`
 *
 * 生命週期
 * ─────────────────────────────────────────────────────────────
 *   建立/儲存 → finalizeImageUrl()：temp 檔搬到正式路徑並改寫欄位值
 *   換圖      → replaceCleanup()：舊檔是自家 storage 且與新值不同就刪掉
 *   硬刪除    → deleteEntityImages()：整個 `{entityKey}/` 前綴清空
 *   軟刪除    → 不動圖，交給 routes/imageCron.ts 30 天後清
 *
 * 所有刪除都是 best-effort：失敗只記 log，不讓使用者的儲存動作失敗。
 *
 * @module utils/imageStorage
 */

import sharp from "sharp";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "./logger.js";
import {
  ALL_IMAGE_BUCKETS,
  IMAGE_BUCKETS,
  MANAGED_IMAGE_BUCKETS,
  extractStorageUrls,
  parseStorageUrl,
  type ImageBucket,
  type ParsedStorageUrl,
} from "./imageUrl.js";

// bucket 常數集中在圖片系統，route 一律從這裡取（landing.ts / chat.ts 也是）
export {
  ALL_IMAGE_BUCKETS,
  IMAGE_BUCKETS,
  MANAGED_IMAGE_BUCKETS,
  parseStorageUrl,
  extractStorageUrls,
};
export type { ImageBucket, ParsedStorageUrl };

// ───────────────────────────────────────────────────────────────
// 型別與設定
// ───────────────────────────────────────────────────────────────

/** sharp 壓縮預設集 */
export type Preset = "cover" | "banner" | "thumb" | "content" | "photo";

/** 壓縮參數：一律轉 WebP，只縮不放大 */
const PRESET_CONFIG: Record<Preset, { width: number; quality: number }> = {
  cover: { width: 1200, quality: 78 },
  banner: { width: 1920, quality: 78 },
  thumb: { width: 480, quality: 75 },
  content: { width: 1600, quality: 78 },
  photo: { width: 1000, quality: 78 },
};

/** 統一上傳 API 的 entity slug 白名單 */
export type ImageEntity =
  | "course"
  | "lesson"
  | "article"
  | "testimonial"
  | "gallery"
  | "site-content";

export const IMAGE_ENTITIES: readonly ImageEntity[] = Object.freeze([
  "course",
  "lesson",
  "article",
  "testimonial",
  "gallery",
  "site-content",
]);

/** entity → bucket */
const ENTITY_BUCKET: Record<ImageEntity, ImageBucket> = {
  course: IMAGE_BUCKETS.COURSE,
  lesson: IMAGE_BUCKETS.LESSON,
  article: IMAGE_BUCKETS.ARTICLE,
  testimonial: IMAGE_BUCKETS.CONTENT,
  gallery: IMAGE_BUCKETS.CONTENT,
  "site-content": IMAGE_BUCKETS.CONTENT,
};

/** entity → 允許的 kind（第一個為預設值） */
const ENTITY_KINDS: Record<ImageEntity, readonly string[]> = {
  course: ["cover", "banner", "content"],
  lesson: ["thumb"],
  article: ["cover", "banner", "content"],
  testimonial: ["photo"],
  gallery: ["photo"],
  "site-content": ["image", "content"],
};

/** kind → 壓縮預設集（kind 名稱以「用途」命名，preset 以「尺寸」命名，故分開對應） */
const KIND_PRESET: Record<string, Preset> = {
  cover: "cover",
  banner: "banner",
  thumb: "thumb",
  content: "content",
  photo: "photo",
  image: "photo",
};

/** 上傳允許的 MIME */
export const ALLOWED_UPLOAD_MIME: readonly string[] = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** 上傳檔案大小上限（5 MB，與 bucket 設定一致） */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** temp 檔路徑前綴 */
export const TEMP_PREFIX = "temp/";

// ───────────────────────────────────────────────────────────────
// 小工具
// ───────────────────────────────────────────────────────────────

function randomToken(length: number): string {
  return Math.random().toString(36).slice(2, 2 + length).padEnd(length, "0");
}

/** entity slug 是否合法 */
export function isImageEntity(value: unknown): value is ImageEntity {
  return typeof value === "string" && (IMAGE_ENTITIES as readonly string[]).includes(value);
}

/** 取得 entity 對應的 bucket */
export function bucketForEntity(entity: ImageEntity): ImageBucket {
  return ENTITY_BUCKET[entity];
}

/** 取得 entity 的預設 kind */
export function defaultKindForEntity(entity: ImageEntity): string {
  return ENTITY_KINDS[entity][0];
}

/**
 * 正規化 kind：不在白名單內就退回該 entity 的預設值。
 * 刻意不報錯 — kind 只影響壓縮尺寸與檔名，不值得讓上傳失敗。
 */
export function normalizeKind(entity: ImageEntity, rawKind: unknown): string {
  const kind = typeof rawKind === "string" ? rawKind.trim().toLowerCase() : "";
  return ENTITY_KINDS[entity].includes(kind) ? kind : defaultKindForEntity(entity);
}

/**
 * 把外部傳進來的 key 正規化成 storage 路徑用的 entityKey。
 *
 * @returns 不合法時回 null（呼叫端應回 400 或跳過）
 */
export function buildEntityKey(entity: ImageEntity, rawKey: unknown): string | null {
  const raw = String(rawKey ?? "").trim();
  if (!raw) return null;

  switch (entity) {
    case "course":
    case "lesson":
    case "article":
    case "testimonial":
      return /^\d+$/.test(raw) ? raw : null;

    case "gallery": {
      const id = raw.startsWith("gallery_") ? raw.slice("gallery_".length) : raw;
      return /^\d+$/.test(id) ? `gallery_${id}` : null;
    }

    case "site-content": {
      const key = raw.startsWith("site_") ? raw.slice("site_".length) : raw;
      // content_key 是 varchar(100)，只允許安全字元進路徑
      return /^[A-Za-z0-9_-]{1,100}$/.test(key) ? `site_${key}` : null;
    }

    default:
      return null;
  }
}

/** 取得 bucket 內某物件的 public URL */
export function publicUrlFor(bucket: ImageBucket, path: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** 兩個 URL 是否指向同一個 storage 物件（忽略 cache-bust query） */
function isSameStorageObject(a: unknown, b: unknown): boolean {
  const pa = parseStorageUrl(a);
  const pb = parseStorageUrl(b);
  if (!pa || !pb) return a === b;
  return pa.bucket === pb.bucket && pa.path === pb.path;
}

// ───────────────────────────────────────────────────────────────
// 影像處理
// ───────────────────────────────────────────────────────────────

/**
 * 壓縮圖片：修正 EXIF 方向 → 依 preset 限寬 → 轉 WebP。
 *
 * @param buffer 原始檔案 buffer
 * @param preset 壓縮預設集
 * @throws 檔案不是有效圖片時 sharp 會丟錯，由呼叫端轉成 400
 */
export async function processImage(buffer: Buffer, preset: Preset): Promise<Buffer> {
  const { width, quality } = PRESET_CONFIG[preset];
  return sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

/** 依 kind 取得對應 preset */
export function presetForKind(kind: string): Preset {
  return KIND_PRESET[kind] ?? "photo";
}

// ───────────────────────────────────────────────────────────────
// 上傳
// ───────────────────────────────────────────────────────────────

export interface UploadResult {
  /** public URL（直接寫進 DB 欄位） */
  url: string;
  /** bucket 內路徑 */
  path: string;
}

async function uploadWebp(
  bucket: ImageBucket,
  path: string,
  buffer: Buffer,
): Promise<UploadResult> {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Storage 上傳失敗（${bucket}/${path}）：${error.message}`);
  return { url: publicUrlFor(bucket, path), path };
}

/**
 * 上傳到實體的正式路徑 `{entityKey}/{kind}_{ts}{rand4}.webp`。
 *
 * 刻意「不刪舊檔」：使用者可能上傳後取消編輯，這時舊圖還在用。
 * 舊檔一律由實體儲存時的 replaceCleanup 或 cron 孤兒掃描處理。
 */
export async function uploadEntityImage(params: {
  entity: ImageEntity;
  entityKey: string;
  kind: string;
  buffer: Buffer;
}): Promise<UploadResult> {
  const { entity, buffer } = params;
  const kind = normalizeKind(entity, params.kind);
  const key = buildEntityKey(entity, params.entityKey);
  if (!key) throw new Error(`entityKey 不合法：${String(params.entityKey)}`);

  const webp = await processImage(buffer, presetForKind(kind));
  const path = `${key}/${kind}_${Date.now()}${randomToken(4)}.webp`;
  return uploadWebp(bucketForEntity(entity), path, webp);
}

/**
 * 上傳到暫存路徑 `temp/{kind}_{ts}_{rand6}.webp`（實體還沒 id 時用）。
 *
 * kind 寫進檔名是刻意的：finalizeImageUrl 只拿得到 URL，
 * 靠檔名才能還原出正式路徑該用哪個 kind。
 */
export async function uploadTempImage(params: {
  entity: ImageEntity;
  kind: string;
  buffer: Buffer;
}): Promise<UploadResult> {
  const { entity, buffer } = params;
  const kind = normalizeKind(entity, params.kind);

  const webp = await processImage(buffer, presetForKind(kind));
  const path = `${TEMP_PREFIX}${kind}_${Date.now()}_${randomToken(6)}.webp`;
  return uploadWebp(bucketForEntity(entity), path, webp);
}

// ───────────────────────────────────────────────────────────────
// finalize（temp → 正式路徑）
// ───────────────────────────────────────────────────────────────

/** 從 temp 檔名還原 kind：`temp/{kind}_{ts}_{rand}.webp` */
function kindFromTempPath(path: string): string | null {
  const name = path.slice(TEMP_PREFIX.length);
  const idx = name.indexOf("_");
  if (idx <= 0) return null;
  const kind = name.slice(0, idx);
  return KIND_PRESET[kind] ? kind : null;
}

/**
 * 把 temp 檔搬到實體正式路徑，回傳新的 public URL。
 *
 * 非 temp 值（Cloudinary URL、站內相對路徑、已在正式路徑的檔）原樣返回。
 * 搬移失敗只記 log 並回傳原 URL — 圖片還在 temp，寧可讓 cron 之後清掉，
 * 也不要因為 storage 抖動就讓使用者的存檔失敗。
 */
export async function finalizeImageUrl(params: {
  entity: ImageEntity;
  entityKey: string | number;
  url: string | null | undefined;
  /** 指定 kind；省略時從 temp 檔名推導 */
  kind?: string;
}): Promise<string | null | undefined> {
  const { entity, url } = params;
  if (!url || typeof url !== "string") return url;

  const parsed = parseStorageUrl(url);
  if (!parsed) return url; // Cloudinary / 相對路徑 / 外站
  if (parsed.bucket !== bucketForEntity(entity)) return url; // 不跨 bucket 搬
  if (!parsed.path.startsWith(TEMP_PREFIX)) return url; // 已是正式路徑

  const key = buildEntityKey(entity, params.entityKey);
  if (!key) {
    logger.warn("finalizeImageUrl: entityKey 不合法，保留 temp 路徑", {
      entity,
      entityKey: String(params.entityKey),
    });
    return url;
  }

  const kind = normalizeKind(
    entity,
    params.kind ?? kindFromTempPath(parsed.path) ?? undefined,
  );
  const target = `${key}/${kind}_${Date.now()}${randomToken(4)}.webp`;

  const { error } = await supabaseAdmin.storage
    .from(parsed.bucket)
    .move(parsed.path, target);

  if (error) {
    logger.error("finalizeImageUrl 搬移失敗，沿用暫存 URL", error, {
      entity,
      from: parsed.path,
      to: target,
    });
    return url;
  }

  return publicUrlFor(parsed.bucket, target);
}

/**
 * 把 HTML 內文裡所有 temp 圖片搬到正式路徑，並改寫 HTML。
 *
 * 用於文章內文插圖（RichTextEditor 在文章還沒 id 時先傳到 temp/）。
 *
 * @param maxImages 單次處理上限，避免超長內文拖垮 serverless 時限
 * @returns 改寫後的 HTML（沒有 temp 圖片時原樣返回）
 */
export async function finalizeHtmlImages(params: {
  entity: ImageEntity;
  entityKey: string | number;
  html: string | null | undefined;
  maxImages?: number;
}): Promise<string | null | undefined> {
  const { entity, html } = params;
  if (!html || typeof html !== "string") return html;

  const bucket = bucketForEntity(entity);
  const tempUrls = extractStorageUrls(html).filter((u) => {
    const p = parseStorageUrl(u);
    return p !== null && p.bucket === bucket && p.path.startsWith(TEMP_PREFIX);
  });
  if (tempUrls.length === 0) return html;

  const limit = params.maxImages ?? 30;
  let result = html;

  for (const tempUrl of tempUrls.slice(0, limit)) {
    const finalUrl = await finalizeImageUrl({
      entity,
      entityKey: params.entityKey,
      url: tempUrl,
      kind: "content",
    });
    if (finalUrl && finalUrl !== tempUrl) {
      result = result.split(tempUrl).join(finalUrl);
    }
  }

  if (tempUrls.length > limit) {
    logger.warn("finalizeHtmlImages: 內文暫存圖片超過單次上限，剩餘留給下次儲存或 cron", {
      entity,
      entityKey: String(params.entityKey),
      total: tempUrls.length,
      processed: limit,
    });
  }

  return result;
}

// ───────────────────────────────────────────────────────────────
// 刪除
// ───────────────────────────────────────────────────────────────

/** 安全刪除 storage 物件（找不到也不報錯） */
export async function removeStorageFiles(
  bucket: ImageBucket,
  paths: string[],
): Promise<number> {
  if (paths.length === 0) return 0;
  let removed = 0;
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    try {
      const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);
      if (error) {
        logger.warn("Storage 刪除部分失敗", {
          bucket,
          batchSize: batch.length,
          error: error.message,
        });
      } else {
        removed += batch.length;
      }
    } catch (err) {
      logger.warn("Storage 刪除例外", { bucket, error: (err as Error)?.message });
    }
  }
  return removed;
}

/**
 * 依 public URL 刪除單一檔案。
 * 只處理自家 storage URL；Cloudinary／外站／相對路徑一律忽略（無 SDK 也無權限）。
 */
export async function deleteByPublicUrl(url: unknown): Promise<void> {
  const parsed = parseStorageUrl(url);
  if (!parsed) return;
  await removeStorageFiles(parsed.bucket, [parsed.path]);
}

/**
 * 換圖清理：舊值是自家 storage 檔且與新值不同時刪掉舊檔。
 *
 * 一定要在 DB 更新成功之後才呼叫 —— 先刪檔再更新失敗會留下壞連結。
 */
export async function replaceCleanup(
  oldUrl: unknown,
  newUrl: unknown,
): Promise<void> {
  if (!oldUrl) return;
  if (isSameStorageObject(oldUrl, newUrl)) return;
  await deleteByPublicUrl(oldUrl);
}

/**
 * 內文換圖清理：刪掉「舊 HTML 有、新 HTML 沒有」的自家圖片。
 */
export async function replaceHtmlCleanup(
  oldHtml: unknown,
  newHtml: unknown,
): Promise<number> {
  const oldUrls = extractStorageUrls(oldHtml);
  if (oldUrls.length === 0) return 0;

  const kept = new Set(extractStorageUrls(newHtml));
  const removedUrls = oldUrls.filter((u) => !kept.has(u));

  // 依 bucket 分組刪除
  const byBucket = new Map<ImageBucket, string[]>();
  for (const url of removedUrls) {
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;
    const list = byBucket.get(parsed.bucket) ?? [];
    list.push(parsed.path);
    byBucket.set(parsed.bucket, list);
  }

  let total = 0;
  for (const [bucket, paths] of byBucket) {
    total += await removeStorageFiles(bucket, paths);
  }
  return total;
}

/**
 * 列出 bucket 內某前綴底下的所有檔案（自動翻頁）。
 *
 * @param prefix 資料夾路徑（不含結尾斜線），空字串代表 bucket 根目錄
 * @param options.recursive 是否遞迴進子資料夾
 * @param options.limit 回傳檔案數上限（保護 serverless 時限）
 */
export async function listFiles(
  bucket: ImageBucket,
  prefix: string,
  options: { recursive?: boolean; limit?: number } = {},
): Promise<Array<{ path: string; createdAt: string | null }>> {
  const limit = options.limit ?? 1000;
  const out: Array<{ path: string; createdAt: string | null }> = [];
  const queue: string[] = [prefix];

  while (queue.length > 0 && out.length < limit) {
    const dir = queue.shift() as string;
    let offset = 0;

    while (out.length < limit) {
      const { data, error } = await supabaseAdmin.storage.from(bucket).list(dir, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        logger.warn("Storage list 失敗", { bucket, dir, error: error.message });
        break;
      }
      if (!data || data.length === 0) break;

      for (const item of data) {
        const path = dir ? `${dir}/${item.name}` : item.name;
        // Supabase 用 id === null 表示這是「資料夾」（其實是路徑前綴）
        if (item.id === null) {
          if (options.recursive) queue.push(path);
          continue;
        }
        out.push({
          path,
          createdAt:
            (item.created_at as string | undefined) ??
            (item.updated_at as string | undefined) ??
            null,
        });
        if (out.length >= limit) break;
      }

      if (data.length < 100) break;
      offset += data.length;
    }
  }

  return out;
}

/**
 * 硬刪除實體時清掉整個 `{entityKey}/` 資料夾。
 */
export async function deleteEntityImages(
  entity: ImageEntity,
  entityKey: string | number,
): Promise<number> {
  const key = buildEntityKey(entity, entityKey);
  if (!key) return 0;
  return deleteFolder(bucketForEntity(entity), key);
}

/**
 * 清掉指定 bucket 底下某個資料夾的所有檔案（含子資料夾）。
 * LP 專案用 `lp-images/{projectId}/`，不走 entity 對應表，故獨立一支。
 */
export async function deleteFolder(bucket: ImageBucket, prefix: string): Promise<number> {
  const files = await listFiles(bucket, prefix, { recursive: true, limit: 1000 });
  if (files.length === 0) return 0;
  return removeStorageFiles(
    bucket,
    files.map((f) => f.path),
  );
}
