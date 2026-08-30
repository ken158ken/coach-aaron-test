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
    columns: [
      "course_thumbnail_url",
      "course_banner_url",
      "course_content",
      "course_content_en",
    ],
  },
  { table: "lesson_videos", columns: ["thumbnail_url"] },
  {
    table: "articles",
    columns: [
      "article_thumbnail_url",
      "article_banner_url",
      "article_content",
      "article_content_en",
    ],
  },
  { table: "testimonial_slides", columns: ["image_url"] },
  { table: "gallery_slides", columns: ["image_url"] },
  { table: "site_content", columns: ["content_value", "content_value_en"] },
  // 首頁彈窗的內文 HTML 可插入本站上傳圖（前端以 site-content entity 上傳）
  { table: "site_popups", columns: ["popup_content", "popup_content_en"] },
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
  /** 內文欄位（含 _en）：清完檔案後把死掉的 storage URL 一併從 HTML 移除 */
  htmlColumns?: string[];
}> = [
  {
    table: "courses",
    idColumn: "course_id",
    entity: "course",
    imageColumns: ["course_thumbnail_url", "course_banner_url"],
    htmlColumns: ["course_content", "course_content_en"],
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
    htmlColumns: ["article_content", "article_content_en"],
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

/**
 * 步驟 1：清掉超過 24h 的暫存檔。
 *
 * ⚠️ 必須比對引用集合：finalizeHtmlImages 超過單次上限、或 finalize 失敗時，
 * DB 裡會刻意留著 temp URL —— 這些 temp 檔「仍被引用」，刪掉會變死連結。
 */
async function cleanupTempFiles(
  refs: Set<string>,
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
        .filter((f) => !refs.has(`${bucket}/${f.path}`))
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
          if (refs.has(`${bucket}/${f.path}`)) continue;
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
      const htmlColumns = target.htmlColumns ?? [];
      const orFilter = [
        ...target.imageColumns.map((c) => `${c}.not.is.null`),
        ...htmlColumns.map(
          (c) => `${c}.ilike.*/storage/v1/object/public/*`,
        ),
      ].join(",");

      const selectCols = [
        target.idColumn,
        ...target.imageColumns,
        ...htmlColumns,
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
        for (const col of htmlColumns) {
          const html = row[col];
          if (typeof html === "string" && html) {
            let stripped = html;
            for (const url of extractStorageUrls(html)) {
              stripped = stripped.split(url).join("");
            }
            if (stripped !== html) patch[col] = stripped;
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

/** 引用查詢分頁大小（Supabase PostgREST 預設單次回傳上限就是 1000） */
const REF_PAGE_SIZE = 1000;
/** 單表分頁上限（10 頁 = 1 萬列）；讀不完代表引用集合不完整，必須放棄掃描 */
const REF_MAX_PAGES = 10;

/**
 * 讀取單一來源表的全部引用（分頁到完）。
 * @returns "ok" 讀完 / "skip" 選用表不存在 / "abort" 讀不完或查詢失敗（集合不完整，禁止刪檔）
 */
async function collectSourceRefs(
  source: (typeof REFERENCE_SOURCES)[number],
  refs: Set<string>,
): Promise<"ok" | "skip" | "abort"> {
  for (let page = 0; page < REF_MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin
      .from(source.table)
      .select(source.columns.join(", "))
      .range(page * REF_PAGE_SIZE, (page + 1) * REF_PAGE_SIZE - 1);

    if (error) {
      // optional 來源：表不存在（migration 未跑）視為可略過
      const missingTable =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        /does not exist|find the table/i.test(error.message ?? "");
      if (source.optional && missingTable) {
        logger.info("孤兒掃描：略過不存在的選用來源表", { table: source.table });
        return "skip";
      }
      logger.error("孤兒掃描：引用來源查詢失敗", error, { table: source.table });
      return "abort";
    }

    const rows = data ?? [];
    for (const raw of rows) {
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

    // 未滿一頁 = 已讀完
    if (rows.length < REF_PAGE_SIZE) return "ok";
  }

  // 讀滿 REF_MAX_PAGES 仍未見底 —— 引用集合可能不完整，寧可放棄本次掃描
  logger.error(
    "孤兒掃描：來源表超過分頁上限，引用集合不完整，放棄本次掃描",
    new Error("reference source truncated"),
    { table: source.table, maxRows: REF_PAGE_SIZE * REF_MAX_PAGES },
  );
  return "abort";
}

/** 建立引用集合：`{bucket}/{path}` 字串 Set；任何來源讀取不完整回傳 null（禁止刪檔） */
async function buildReferenceSet(): Promise<Set<string> | null> {
  const refs = new Set<string>();

  // 各來源表彼此獨立，平行查詢（Set 寫入在單執行緒 event loop 上安全）
  const results = await Promise.all(
    REFERENCE_SOURCES.map((source) => collectSourceRefs(source, refs)),
  );

  if (results.includes("abort")) return null;
  return refs;
}

/** 步驟 3：孤兒掃描（refs 由呼叫端建好傳入，與 temp 清理共用） */
async function cleanupOrphans(
  refs: Set<string>,
  isExpired: () => boolean,
  errors: string[],
): Promise<{ deleted: number; skipped: boolean }> {
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
    // 沒設定 CRON_SECRET 時直接拒絕 —— 這是跨 6 個 bucket 的刪檔端點，
    // 絕不能因為環境變數漏設就變成公開可打
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      logger.error(
        "cleanup-images：CRON_SECRET 未設定，拒絕執行",
        new Error("CRON_SECRET missing"),
      );
      res.status(503).json({ error: "CRON_SECRET 未設定" });
      return;
    }
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${secret}`) {
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

    // 0. 先建引用集合（temp 清理與孤兒掃描共用；建不完整就兩者都跳過）
    let refs: Set<string> | null = null;
    try {
      refs = await buildReferenceSet();
    } catch (err) {
      errors.push(`引用集合建立失敗：${(err as Error)?.message}`);
    }
    if (refs !== null && refs.size === 0) {
      // 保險絲：正常情況下 DB 一定引用著一批 storage 檔案。
      // 引用集合完全是空的，比較可能是查詢被權限擋掉而不是真的沒圖 —— 不冒險。
      errors.push("引用集合為空，疑似查詢異常 —— temp 清理與孤兒掃描皆跳過");
      refs = null;
    }

    // 1. temp TTL（需要引用集合：DB 刻意留著的 temp URL 不能刪）
    if (refs !== null) {
      try {
        stats.tempFilesDeleted = await cleanupTempFiles(refs, isExpired, errors);
      } catch (err) {
        errors.push(`temp 清理整體失敗：${(err as Error)?.message}`);
      }
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
    if (refs === null) {
      stats.orphanScanSkipped = true;
      errors.push("孤兒掃描已跳過：引用集合不完整（安全起見不刪任何檔案）");
    } else if (!isExpired()) {
      try {
        const result = await cleanupOrphans(refs, isExpired, errors);
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

// ───────────────────────────────────────────────────────────────
// CI 煙霧測試端點
// ───────────────────────────────────────────────────────────────

/**
 * 部署後煙霧測試（GitHub Actions 呼叫，CRON_SECRET 保護）。
 * @route GET /api/cron/smoke
 *
 * 真實走一遍「註冊層級」的關鍵路徑，抓住像 users 欄位 drift（migration 移除
 * 欄位但程式還在 INSERT）這種「編譯過但上線全滅」的低級錯誤：
 *   1. 以與 auth 註冊完全相同的欄位組 INSERT 一個測試使用者
 *   2. SELECT 回讀驗證
 *   3. 硬 DELETE 清掉（不留痕跡）
 *   4. 幾個核心表的可讀性檢查
 */
router.get("/smoke", async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ ok: false, error: "CRON_SECRET 未設定" });
    return;
  }
  if ((req.headers.authorization || "") !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const checks: Record<string, string> = {};
  let ok = true;
  const fail = (name: string, detail: string): void => {
    checks[name] = `FAIL: ${detail}`;
    ok = false;
  };

  // 1+2+3. 註冊關鍵路徑：INSERT 欄位組必須與 routes/auth.ts 的註冊完全一致
  const tag = `ci_smoke_${Date.now()}`;
  try {
    const { data: created, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({
        username: tag,
        email: `${tag}@smoke.local`,
        password_hash: "!ci-smoke-not-a-login",
        display_name: "CI Smoke（自動清除）",
        phone_number: null,
      })
      .select("user_id, email")
      .single();

    if (insErr || !created) {
      fail("register_insert", insErr?.message ?? "no row returned");
    } else {
      checks.register_insert = "ok";
      const { error: delErr } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("user_id", created.user_id);
      if (delErr) fail("register_cleanup", delErr.message);
      else checks.register_cleanup = "ok";
    }
  } catch (err) {
    fail("register_insert", (err as Error)?.message ?? "unknown");
  }

  // 4. 核心表可讀
  for (const table of ["courses", "articles", "site_content"] as const) {
    const { error } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true })
      .limit(1);
    if (error) fail(`read_${table}`, error.message);
    else checks[`read_${table}`] = "ok";
  }

  // 失敗時寄警報信給教練/站主（best-effort；Vercel cron 的失敗不會有人看 log）
  if (!ok) {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const coachEmail = process.env.COACH_EMAIL || "s330221@gmail.com";
      if (resendApiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Coach Aaron 網站 <onboarding@resend.dev>",
            to: [coachEmail],
            subject: "🚨 網站煙霧測試失敗 — 請立即檢查",
            html: `<h2>coach-aaron 煙霧測試失敗</h2><pre>${JSON.stringify(
              checks,
              null,
              2,
            )}</pre><p>${new Date().toISOString()}</p>`,
          }),
        });
      }
      logger.error("煙霧測試失敗", new Error("smoke failed"), { checks });
    } catch (mailErr) {
      logger.error("煙霧測試警報信寄送失敗", mailErr as Error);
    }
  }

  res.status(ok ? 200 : 500).json({ ok, checks, timestamp: new Date().toISOString() });
});

export default router;
