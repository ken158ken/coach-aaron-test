/**
 * @fileoverview 圖片 Storage 每日清理 cron
 *
 * 由 vercel.json 觸發：`GET /api/cron/cleanup-images`（每日 20:00 UTC）
 * 安全性：CRON_SECRET Bearer（與 chatCron 一致）
 *
 * 三個步驟，依序執行、各自 try/catch，單步失敗不影響其他步驟：
 *   1. temp TTL     — 各 bucket `temp/` 下超過 24h 的檔案（含 thumbnails 的 `temp_*` 平放檔）
 *   2. 軟刪除清理   — deleted_at 超過 30 天的實體：刪整個資料夾 + 圖片欄位設 NULL
 *   3. 孤兒掃描     — 不被任何 DB 欄位引用、且建立超過 24h 的檔案
 *
 * ⚠️ Vercel serverless maxDuration 只有 10 秒：
 *    每步驟都有批次上限，並在超過 DEADLINE_MS 時提前收工，剩下的下次 cron 繼續。
 *
 * ⚠️ 孤兒掃描的安全閥：只要有任何一張「引用來源表」查詢失敗，
 *    整個步驟直接放棄 —— 引用集合不完整時刪檔會誤刪正在使用的圖。
 *
 * @module routes/imageCron
 */

import express, { Request, Response, Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import {
  extractStoragePaths,
  extractStorageUrls,
  parseStorageUrl,
} from "../utils/imageUrl.js";
import {
  IMAGE_BUCKETS,
  MANAGED_IMAGE_BUCKETS,
  TEMP_PREFIX,
  deleteEntityImages,
  listFiles,
  removeStorageFiles,
  type ImageBucket,
  type ImageEntity,
} from "../utils/imageStorage.js";

const router: Router = express.Router();

// ───────────────────────────────────────────────────────────────
// 參數
// ───────────────────────────────────────────────────────────────

/** 提前收工時間（留 2 秒給回應序列化，避免被 Vercel 硬砍） */
const DEADLINE_MS = 8_000;

/** temp 檔存活時間 */
const TEMP_TTL_MS = 24 * 60 * 60 * 1000;

/** 軟刪除保留期 */
const SOFT_DELETE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 孤兒判定的最小年齡（剛上傳還沒存檔的圖不能刪） */
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/** 每次 cron 各步驟的刪檔上限 */
const MAX_TEMP_DELETE = 200;
const MAX_ORPHAN_DELETE = 200;
/** 每次處理幾筆軟刪除實體 */
const MAX_SOFT_DELETE_ROWS = 20;
/** 單一 bucket 單次掃描的檔案數上限 */
const MAX_LIST_PER_BUCKET = 500;

// ───────────────────────────────────────────────────────────────
// 引用來源（孤兒掃描比對用）
// ───────────────────────────────────────────────────────────────

/**
 * 所有可能存放圖片 URL 的「表 → 欄位」。
 *
 * 刻意寧可多列不可少列：漏掉一張表就等於把那些圖判成孤兒刪掉。
 * 純文字欄位（article_content、value_text）也列進來，
 * 內文 HTML 裡的 storage URL 一樣算「被引用」。
 *
 * 注意：**不**過濾 deleted_at —— 軟刪除的實體圖片由步驟 2 依 30 天期限處理，
 * 孤兒掃描不該碰它們。
 */
const REFERENCE_SOURCES: ReadonlyArray<{
  table: string;
  columns: string[];
  /** 該表可能不存在（migration 未跑）—— 查不到就略過，不視為致命錯誤 */
  optional?: boolean;
}> = [
  {
    table: "courses",
    columns: ["course_thumbnail_url", "course_banner_url", "course_content"],
  },
  { table: "lesson_videos", columns: ["thumbnail_url"] },
  {
    table: "articles",
    columns: ["article_thumbnail_url", "article_banner_url", "article_content"],
  },
  { table: "testimonial_slides", columns: ["image_url"] },
  { table: "gallery_slides", columns: ["image_url"] },
  { table: "site_content", columns: ["content_value", "content_value_en"] },
  // 首頁彈窗的內文 HTML 可插入本站上傳圖（前端以 site-content entity 上傳）
  { table: "site_popups", columns: ["popup_content"] },
  { table: "content_templates", columns: ["template_value"] },
  { table: "videos", columns: ["thumbnail_url"] },
  { table: "homepage_banners", columns: ["background_url"] },
  {
    table: "lp_projects",
    columns: ["hero_image_url", "logo_url", "og_image_url", "favicon_url"],
  },
  { table: "lp_project_field_values", columns: ["cloudinary_url", "value_text"] },
  { table: "lp_templates", columns: ["thumbnail_url", "preview_url"] },
  { table: "lp_template_sections", columns: ["thumbnail_url", "text_preview"] },
  { table: "lp_template_field_options", columns: ["thumbnail_url"] },
  // migration 023 才建立，未跑過的環境查不到 —— 標成 optional
  {
    table: "lp_template_variants",
    columns: ["preview_thumbnail"],
    optional: true,
  },
];

/** 軟刪除實體 → storage 清理設定 */
const SOFT_DELETE_TARGETS: ReadonlyArray<{
  table: string;
  idColumn: string;
  entity: ImageEntity;
  imageColumns: string[];
  /** 內文欄位：清完檔案後把死掉的 storage URL 一併從 HTML 移除 */
  htmlColumn?: string;
}> = [
  {
    table: "courses",
    idColumn: "course_id",
    entity: "course",
    imageColumns: ["course_thumbnail_url", "course_banner_url"],
  },
  {
    table: "lesson_videos",
    idColumn: "id",
    entity: "lesson",
    imageColumns: ["thumbnail_url"],
  },
  {
    table: "articles",
    idColumn: "article_id",
    entity: "article",
    imageColumns: ["article_thumbnail_url", "article_banner_url"],
    htmlColumn: "article_content",
  },
];

// ───────────────────────────────────────────────────────────────
// 統計型別
// ───────────────────────────────────────────────────────────────

interface CleanupStats {
  ok: boolean;
  /** 是否因為時間不夠提前收工（下次 cron 會接著做） */
  truncated: boolean;
  tempFilesDeleted: number;
  softDeletedRowsProcessed: number;
  softDeletedFilesDeleted: number;
  orphanFilesDeleted: number;
  orphanScanSkipped: boolean;
  durationMs: number;
  errors: string[];
  timestamp: string;
}

// ───────────────────────────────────────────────────────────────
// 步驟實作
// ───────────────────────────────────────────────────────────────

/** 步驟 1：清掉超過 24h 的暫存檔 */
async function cleanupTempFiles(
  isExpired: () => boolean,
  errors: string[],
): Promise<number> {
  const cutoff = Date.now() - TEMP_TTL_MS;
  let deleted = 0;

  for (const bucket of MANAGED_IMAGE_BUCKETS) {
    if (isExpired() || deleted >= MAX_TEMP_DELETE) break;

    try {
      // `temp/` 資料夾（新制路徑）
      const tempFiles = await listFiles(bucket, TEMP_PREFIX.replace(/\/$/, ""), {
        recursive: false,
        limit: MAX_LIST_PER_BUCKET,
      });

      const stale = tempFiles
        .filter((f) => f.createdAt !== null && Date.parse(f.createdAt) < cutoff)
        .map((f) => f.path);

      // thumbnails bucket 的舊制：`temp_*.webp` 平放在根目錄（videos.ts 產生）
      if (bucket === IMAGE_BUCKETS.VIDEO) {
        const rootFiles = await listFiles(bucket, "", {
          recursive: false,
          limit: MAX_LIST_PER_BUCKET,
        });
        for (const f of rootFiles) {
          if (!f.path.startsWith("temp_")) continue;
          if (f.createdAt === null || Date.parse(f.createdAt) >= cutoff) continue;
          stale.push(f.path);
        }
      }

      if (stale.length === 0) continue;

      const budget = MAX_TEMP_DELETE - deleted;
      deleted += await removeStorageFiles(bucket, stale.slice(0, budget));
    } catch (err) {
      errors.push(`temp 清理失敗（${bucket}）：${(err as Error)?.message}`);
    }
  }

  return deleted;
}

/** 步驟 2：軟刪除超過 30 天的實體 → 刪整個資料夾 + 圖片欄位設 NULL */
async function cleanupSoftDeleted(
  isExpired: () => boolean,
  errors: string[],
): Promise<{ rows: number; files: number }> {
  const cutoff = new Date(Date.now() - SOFT_DELETE_TTL_MS).toISOString();
  let rows = 0;
  let files = 0;

  for (const target of SOFT_DELETE_TARGETS) {
    if (isExpired() || rows >= MAX_SOFT_DELETE_ROWS) break;

    try {
      // 只挑「還留著圖片欄位或內文含 storage URL」的 row，
      // 處理完會被清成 NULL，不會每天重複掃到同一批。
      const orFilter = [
        ...target.imageColumns.map((c) => `${c}.not.is.null`),
        ...(target.htmlColumn
          ? [`${target.htmlColumn}.ilike.*/storage/v1/object/public/*`]
          : []),
      ].join(",");

      const selectCols = [
        target.idColumn,
        ...target.imageColumns,
        ...(target.htmlColumn ? [target.htmlColumn] : []),
      ].join(", ");

      const { data, error } = await supabaseAdmin
        .from(target.table)
        .select(selectCols)
        .lt("deleted_at", cutoff)
        .or(orFilter)
        .limit(MAX_SOFT_DELETE_ROWS - rows);

      if (error) throw error;
      if (!data || data.length === 0) continue;

      for (const raw of data) {
        if (isExpired()) break;
        const row = raw as unknown as Record<string, unknown>;
        const id = row[target.idColumn];

        files += await deleteEntityImages(target.entity, id as string | number);

        const patch: Record<string, unknown> = {};
        for (const col of target.imageColumns) patch[col] = null;

        // 內文：把已刪除的自家圖片 URL 拿掉。
        // 一方面 URL 已成死連結，一方面下次 cron 才不會又掃到同一筆（避免卡住批次額度）。
        if (target.htmlColumn) {
          const html = row[target.htmlColumn];
          if (typeof html === "string" && html) {
            let stripped = html;
            for (const url of extractStorageUrls(html)) {
              stripped = stripped.split(url).join("");
            }
            if (stripped !== html) patch[target.htmlColumn] = stripped;
          }
        }

        const { error: updErr } = await supabaseAdmin
          .from(target.table)
          .update(patch)
          .eq(target.idColumn, id);
        if (updErr) throw updErr;

        rows += 1;
        if (rows >= MAX_SOFT_DELETE_ROWS) break;
      }
    } catch (err) {
      errors.push(`軟刪除清理失敗（${target.table}）：${(err as Error)?.message}`);
    }
  }

  return { rows, files };
}

/** 建立引用集合：`{bucket}/{path}` 字串 Set */
async function buildReferenceSet(): Promise<Set<string> | null> {
  const refs = new Set<string>();

  for (const source of REFERENCE_SOURCES) {
    const { data, error } = await supabaseAdmin
      .from(source.table)
      .select(source.columns.join(", "))
      .limit(5000);

    if (error) {
      // optional 來源：表不存在（migration 未跑）視為可略過
      const missingTable =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        /does not exist|find the table/i.test(error.message ?? "");
      if (source.optional && missingTable) {
        logger.info("孤兒掃描：略過不存在的選用來源表", { table: source.table });
        continue;
      }

      // 安全閥：引用集合不完整就不准刪任何東西
      logger.error("孤兒掃描：引用來源查詢失敗，放棄本次掃描", error, {
        table: source.table,
      });
      return null;
    }

    for (const raw of data ?? []) {
      const row = raw as unknown as Record<string, unknown>;
      for (const col of source.columns) {
        const value = row[col];
        if (typeof value !== "string" || !value) continue;

        const direct = parseStorageUrl(value);
        if (direct) refs.add(`${direct.bucket}/${direct.path}`);

        for (const p of extractStoragePaths(value)) {
          refs.add(`${p.bucket}/${p.path}`);
        }
      }
    }
  }

  return refs;
}

/** 步驟 3：孤兒掃描 */
async function cleanupOrphans(
  isExpired: () => boolean,
  errors: string[],
): Promise<{ deleted: number; skipped: boolean }> {
  const refs = await buildReferenceSet();
  if (refs === null) {
    errors.push("孤兒掃描已跳過：引用來源查詢失敗（安全起見不刪任何檔案）");
    return { deleted: 0, skipped: true };
  }

  // 保險絲：正常情況下 DB 一定引用著一批 storage 檔案。
  // 引用集合完全是空的，比較可能是查詢被權限擋掉而不是真的沒圖 —— 不冒險。
  if (refs.size === 0) {
    errors.push("孤兒掃描已跳過：引用集合為空，疑似查詢異常（安全起見不刪任何檔案）");
    return { deleted: 0, skipped: true };
  }

  const orphanCutoff = Date.now() - ORPHAN_MIN_AGE_MS;
  let deleted = 0;

  for (const bucket of MANAGED_IMAGE_BUCKETS) {
    if (isExpired() || deleted >= MAX_ORPHAN_DELETE) break;

    try {
      const files = await listFiles(bucket, "", {
        recursive: true,
        limit: MAX_LIST_PER_BUCKET,
      });

      const orphans: string[] = [];
      for (const file of files) {
        // temp/ 由步驟 1 負責；`.emptyFolderPlaceholder` 是 Supabase 自己的佔位檔
        if (file.path.startsWith(TEMP_PREFIX)) continue;
        if (file.path.endsWith(".emptyFolderPlaceholder")) continue;
        // 拿不到 created_at 就保守跳過，不冒誤刪風險
        if (file.createdAt === null) continue;
        if (Date.parse(file.createdAt) >= orphanCutoff) continue;
        if (refs.has(`${bucket}/${file.path}`)) continue;
        orphans.push(file.path);
      }

      if (orphans.length === 0) continue;

      const budget = MAX_ORPHAN_DELETE - deleted;
      const batch = orphans.slice(0, budget);
      deleted += await removeStorageFiles(bucket, batch);

      logger.info("孤兒圖片清理", { bucket, deleted: batch.length });
    } catch (err) {
      errors.push(`孤兒掃描失敗（${bucket}）：${(err as Error)?.message}`);
    }
  }

  return { deleted, skipped: false };
}

// ───────────────────────────────────────────────────────────────
// 路由
// ───────────────────────────────────────────────────────────────

router.get(
  "/cleanup-images",
  async (req: Request, res: Response): Promise<void> => {
    // 驗證 CRON_SECRET（Vercel Cron 會自動帶 Authorization: Bearer <secret>）
    const secret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization || "";
    if (secret && authHeader !== `Bearer ${secret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const startedAt = Date.now();
    const isExpired = (): boolean => Date.now() - startedAt > DEADLINE_MS;
    const errors: string[] = [];

    const stats: CleanupStats = {
      ok: true,
      truncated: false,
      tempFilesDeleted: 0,
      softDeletedRowsProcessed: 0,
      softDeletedFilesDeleted: 0,
      orphanFilesDeleted: 0,
      orphanScanSkipped: false,
      durationMs: 0,
      errors,
      timestamp: new Date().toISOString(),
    };

    // 1. temp TTL
    try {
      stats.tempFilesDeleted = await cleanupTempFiles(isExpired, errors);
    } catch (err) {
      errors.push(`temp 清理整體失敗：${(err as Error)?.message}`);
    }

    // 2. 軟刪除 30 天
    if (!isExpired()) {
      try {
        const result = await cleanupSoftDeleted(isExpired, errors);
        stats.softDeletedRowsProcessed = result.rows;
        stats.softDeletedFilesDeleted = result.files;
      } catch (err) {
        errors.push(`軟刪除清理整體失敗：${(err as Error)?.message}`);
      }
    }

    // 3. 孤兒掃描
    if (!isExpired()) {
      try {
        const result = await cleanupOrphans(isExpired, errors);
        stats.orphanFilesDeleted = result.deleted;
        stats.orphanScanSkipped = result.skipped;
      } catch (err) {
        errors.push(`孤兒掃描整體失敗：${(err as Error)?.message}`);
      }
    } else {
      stats.orphanScanSkipped = true;
    }

    stats.truncated = isExpired();
    stats.durationMs = Date.now() - startedAt;
    stats.ok = errors.length === 0;

    if (errors.length > 0) {
      logger.warn("圖片清理 cron 完成（含錯誤）", { ...stats });
    } else {
      logger.info("圖片清理 cron 完成", { ...stats });
    }

    res.json(stats);
  },
);

export default router;
