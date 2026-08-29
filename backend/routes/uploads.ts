/**
 * @fileoverview 統一圖片上傳 API
 *
 *   POST /api/uploads/:entity/temp        — 傳到暫存路徑（實體還沒 id 時用）
 *   POST /api/uploads/:entity/:entityKey  — 直接傳到實體正式路徑
 *
 * 兩者都是 multipart/form-data（欄位名不限，取第一個檔案），
 * `kind` 可放 query 或 body；回傳 `{ url, path }`。
 *
 * entity 白名單：course / lesson / article / testimonial / gallery / site-content
 *
 * ⚠️ 上傳成功「不會」刪掉該實體現用的舊圖 —— 使用者可能上傳後取消編輯，
 *    這時舊圖還在線上用。舊檔由實體儲存時的 replaceCleanup、
 *    或 imageCron 的孤兒掃描負責清理。
 *
 * @module routes/uploads
 */

import express, { Request, Response, Router } from "express";
import multer from "multer";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  buildEntityKey,
  isImageEntity,
  normalizeKind,
  uploadEntityImage,
  uploadTempImage,
  type ImageEntity,
  type UploadResult,
} from "../utils/imageStorage.js";

const router: Router = express.Router();

/** fileFilter 拒絕時用的專屬錯誤，好跟「沒帶檔案」區分開 */
class UnsupportedImageTypeError extends Error {
  constructor(mimetype: string) {
    super(`不支援的圖片格式：${mimetype}`);
    this.name = "UnsupportedImageTypeError";
  }
}

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOAD_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new UnsupportedImageTypeError(file.mimetype));
    }
  },
}).any();

/** 跑 multer 並取出唯一那個檔案 */
function receiveFile(req: Request, res: Response): Promise<Express.Multer.File | null> {
  return new Promise((resolve, reject) => {
    uploader(req, res, (err: unknown) => {
      if (err) {
        reject(err);
        return;
      }
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      resolve(files[0] ?? null);
    });
  });
}

/** 把 multer / sharp 的錯誤轉成中文 JSON */
function sendUploadError(res: Response, err: unknown, context: string): void {
  if (err instanceof UnsupportedImageTypeError) {
    res.status(400).json({
      error: "不支援的圖片格式，僅接受 JPEG、PNG、WebP、GIF、AVIF",
    });
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "圖片檔案過大，請壓到 5MB 以內" });
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({ error: "一次只能上傳一張圖片" });
      return;
    }
    res.status(400).json({ error: "圖片上傳失敗，請確認檔案格式" });
    return;
  }
  logger.error(context, err as Error);
  res.status(500).json({ error: "圖片上傳失敗，請稍後再試" });
}

/** 從 query / body 取 kind */
function readKind(req: Request): unknown {
  return (
    (req.query.kind as string | undefined) ??
    (req.body as Record<string, unknown> | undefined)?.kind
  );
}

/**
 * 給舊 endpoint 薄轉發用：base64 data URL → 暫存圖片。
 *
 * `POST /api/courses/upload-image`、`POST /api/lessons/upload-thumbnail`
 * 仍收 `{ image: "data:image/...;base64,..." }`，內部一律走這裡，
 * 讓新舊路徑共用同一套壓縮參數與生命週期。
 *
 * @throws Error 圖片格式不合法（呼叫端轉 400）
 */
export async function uploadBase64AsTemp(
  entity: ImageEntity,
  kind: string,
  dataUrl: unknown,
): Promise<UploadResult> {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error("INVALID_DATA_URL");
  }
  const base64 = dataUrl.replace(/^data:image\/[\w+.-]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw new Error("INVALID_DATA_URL");
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("FILE_TOO_LARGE");

  return uploadTempImage({ entity, kind, buffer });
}

// ───────────────────────────────────────────────────────────────
// 路由
// ───────────────────────────────────────────────────────────────

/**
 * 上傳到暫存路徑 `temp/{kind}_{ts}_{rand}.webp`
 * @route POST /api/uploads/:entity/temp
 *
 * ⚠️ 必須定義在 /:entity/:entityKey 之前，否則 "temp" 會被當成 entityKey。
 */
router.post(
  "/:entity/temp",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const entity = req.params.entity;
    if (!isImageEntity(entity)) {
      res.status(404).json({ error: "不支援的圖片類別" });
      return;
    }

    try {
      const file = await receiveFile(req, res);
      if (!file) {
        res.status(400).json({ error: "請附上圖片檔案" });
        return;
      }

      const kind = normalizeKind(entity, readKind(req));
      const result = await uploadTempImage({ entity, kind, buffer: file.buffer });

      logger.info("圖片上傳（暫存）", { entity, kind, path: result.path });
      res.json(result);
    } catch (err) {
      sendUploadError(res, err, "暫存圖片上傳失敗");
    }
  },
);

/**
 * 上傳到實體正式路徑 `{entityKey}/{kind}_{ts}{rand}.webp`
 * @route POST /api/uploads/:entity/:entityKey
 */
router.post(
  "/:entity/:entityKey",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const entity = req.params.entity;
    if (!isImageEntity(entity)) {
      res.status(404).json({ error: "不支援的圖片類別" });
      return;
    }

    const entityKey = buildEntityKey(entity, req.params.entityKey);
    if (!entityKey) {
      res.status(400).json({ error: "圖片歸屬的項目識別碼不合法" });
      return;
    }

    try {
      const file = await receiveFile(req, res);
      if (!file) {
        res.status(400).json({ error: "請附上圖片檔案" });
        return;
      }

      const kind = normalizeKind(entity, readKind(req));
      const result = await uploadEntityImage({
        entity,
        entityKey,
        kind,
        buffer: file.buffer,
      });

      logger.info("圖片上傳（正式路徑）", { entity, entityKey, kind, path: result.path });
      res.json(result);
    } catch (err) {
      sendUploadError(res, err, "圖片上傳失敗");
    }
  },
);

export default router;
