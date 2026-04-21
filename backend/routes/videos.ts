/**
 * @fileoverview 影片管理路由
 * 處理公開影片查詢及管理員影片 CRUD 操作
 *
 * 縮圖結構設計：
 *   - Storage bucket: `thumbnails`
 *   - 最終檔名：`{video_id}.webp`（一個影片對應一個固定檔名）
 *   - 上傳暫存檔名：`temp_{timestamp}_{random}.webp`（送出批次後會被 move 成最終檔）
 *   - URL 加 `?v={timestamp}` 做 cache-bust（同檔名覆蓋後舊快取不會卡住）
 *   - PUT 換縮圖：自動搬動並 cache-bust；DELETE 影片：連縮圖一併清掉
 */

import express, { Request, Response, Router } from 'express';
import sharp from 'sharp';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router: Router = express.Router();
const THUMBNAIL_BUCKET = 'thumbnails';

// ───────────────────────────────────────────────────────────────
// Storage 輔助函式
// ───────────────────────────────────────────────────────────────

const STORAGE_PUBLIC_PREFIX = `${process.env.SUPABASE_URL ?? ''}/storage/v1/object/public/${THUMBNAIL_BUCKET}/`;

/** 從公開 URL 擷取 bucket 內的檔名；不屬於本 bucket 則回 null */
function parseStorageFilename(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith(STORAGE_PUBLIC_PREFIX)) return null;
  return url.slice(STORAGE_PUBLIC_PREFIX.length).split('?')[0];
}

/** 在 URL 尾端加上 ?v=timestamp 以破除瀏覽器快取 */
function cacheBust(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}

/** 安全刪除 Storage 檔案（找不到也不報錯） */
async function removeStorageFile(filename: string): Promise<void> {
  try {
    await supabaseAdmin.storage.from(THUMBNAIL_BUCKET).remove([filename]);
  } catch {
    /* best effort */
  }
}

/**
 * 把暫存檔 move 成最終檔名 `{videoId}.webp`，回傳帶 cache-bust 的 public URL。
 * 若 source 已經是最終檔名，僅回傳新 URL。
 */
async function finalizeThumbnail(
  sourceFilename: string,
  videoId: number
): Promise<string> {
  const targetFilename = `${videoId}.webp`;

  if (sourceFilename !== targetFilename) {
    // 目的檔若已存在，先刪除再 move（Supabase move 不支援 overwrite）
    await removeStorageFile(targetFilename);
    const { error } = await supabaseAdmin.storage
      .from(THUMBNAIL_BUCKET)
      .move(sourceFilename, targetFilename);
    if (error) throw new Error(`Storage move failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(THUMBNAIL_BUCKET)
    .getPublicUrl(targetFilename);
  return cacheBust(data.publicUrl);
}

// ===== 公開 API =====

/**
 * 取得所有可見影片
 * @route GET /api/videos
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 50)
    );

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('is_visible', true);

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ data, total: count ?? 0 });
  } catch (err) {
    console.error('Get videos error:', err);
    res.status(500).json({ error: '取得影片失敗' });
  }
});

// ===== 管理員 API =====

/**
 * 取得所有影片
 * @route GET /api/videos/admin/all
 */
router.get(
  '/admin/all',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('videos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Get all videos error:', err);
      res.status(500).json({ error: '取得影片失敗' });
    }
  }
);

/**
 * 批量新增影片
 * @route POST /api/videos/batch
 * body: { videos: Array<{ title, url, type, description?, thumbnail? }> }
 *
 * thumbnail 傳的是 /upload-thumbnail 回傳的暫存 URL；
 * 本 handler 會在 INSERT 取得 video_id 後，把暫存檔 move 成 `{video_id}.webp`。
 */
router.post(
  '/batch',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { videos: items } = req.body as {
        videos: Array<{
          title: string;
          url: string;
          type?: string;
          description?: string;
          thumbnail?: string;
        }>;
      };

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'videos 陣列不可為空' });
        return;
      }

      // 取得目前最小 sort_order，新影片放到最前面（越小越前）
      const { data: minRow } = await supabaseAdmin
        .from('videos')
        .select('sort_order')
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      const baseOrder = (minRow?.sort_order ?? 1) as number;

      // 第一筆新影片 → baseOrder - items.length (最小、最前)
      // 最後一筆新影片 → baseOrder - 1 (仍比原先最小的還小)
      //
      // 插入時 thumbnail_url 先留空，等 INSERT 拿到 video_id 再 move 並填回。
      const rows = items.map((item, i) => ({
        title: item.title,
        url: item.url,
        type: item.type ?? 'instagram',
        is_visible: true,
        sort_order: baseOrder - items.length + i,
        ...(item.description ? { description: item.description } : {}),
      }));

      const { data, error } = await supabaseAdmin
        .from('videos')
        .insert(rows)
        .select();

      if (error) throw error;
      if (!data) {
        res.json({ inserted: 0, data: [] });
        return;
      }

      // 依順序處理每筆縮圖：temp_xxx.webp → {video_id}.webp
      for (let i = 0; i < data.length; i++) {
        const inserted = data[i];
        const tempUrl = items[i]?.thumbnail;
        if (!tempUrl) continue;

        const tempFilename = parseStorageFilename(tempUrl);
        if (!tempFilename) {
          // 外部 URL 或格式不符，直接存原值
          const { error: upErr } = await supabaseAdmin
            .from('videos')
            .update({ thumbnail_url: tempUrl })
            .eq('video_id', inserted.video_id);
          if (!upErr) inserted.thumbnail_url = tempUrl;
          continue;
        }

        try {
          const finalUrl = await finalizeThumbnail(tempFilename, inserted.video_id);
          await supabaseAdmin
            .from('videos')
            .update({ thumbnail_url: finalUrl })
            .eq('video_id', inserted.video_id);
          inserted.thumbnail_url = finalUrl;
        } catch (err) {
          console.error(
            `Finalize thumbnail for video_id=${inserted.video_id} failed:`,
            err
          );
          // 讓該筆影片的 thumbnail_url 維持空值，使用者可事後再編輯
        }
      }

      res.json({ inserted: data.length, data });
    } catch (err) {
      console.error('Batch create videos error:', err);
      res.status(500).json({ error: '批量新增失敗' });
    }
  }
);

/**
 * 新增單部影片
 * @route POST /api/videos
 *
 * thumbnail 同 /batch：傳暫存 URL，取得 video_id 後 rename 成 `{video_id}.webp`。
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, url, type, sortOrder, description, thumbnail } = req.body;

      const { data, error } = await supabaseAdmin
        .from('videos')
        .insert({
          title,
          url,
          type: type || 'instagram',
          sort_order: sortOrder || 0,
          is_visible: true,
          ...(description !== undefined && { description }),
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(500).json({ error: '新增影片失敗' });
        return;
      }

      if (thumbnail) {
        const tempFilename = parseStorageFilename(thumbnail);
        if (tempFilename) {
          try {
            const finalUrl = await finalizeThumbnail(tempFilename, data.video_id);
            await supabaseAdmin
              .from('videos')
              .update({ thumbnail_url: finalUrl })
              .eq('video_id', data.video_id);
            data.thumbnail_url = finalUrl;
          } catch (err) {
            console.error('Finalize thumbnail failed:', err);
          }
        } else {
          // 外部 URL，直接存
          await supabaseAdmin
            .from('videos')
            .update({ thumbnail_url: thumbnail })
            .eq('video_id', data.video_id);
          data.thumbnail_url = thumbnail;
        }
      }

      res.json(data);
    } catch (err) {
      console.error('Create video error:', err);
      res.status(500).json({ error: '新增影片失敗' });
    }
  }
);

/**
 * 上傳縮圖 — 前端傳 base64 data URL，後端壓縮成 WebP 並上傳到 Supabase Storage
 * @route POST /api/videos/upload-thumbnail
 * body: { image: string }  // "data:image/png;base64,..."
 * response: { url: string }
 *
 * 產生的是暫存檔（`temp_*.webp`），送出 POST /batch 或 PUT /:id 時會被搬成 `{video_id}.webp`。
 */
router.post(
  '/upload-thumbnail',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { image } = req.body as { image?: string };
      if (!image || !image.startsWith('data:image/')) {
        res.status(400).json({ error: '請提供有效的圖片 (base64 data URL)' });
        return;
      }

      const base64 = image.replace(/^data:image\/\w+;base64,/, '');
      const inputBuffer = Buffer.from(base64, 'base64');

      const webpBuffer = await sharp(inputBuffer)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(THUMBNAIL_BUCKET)
        .upload(filename, webpBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const { data } = supabaseAdmin.storage
        .from(THUMBNAIL_BUCKET)
        .getPublicUrl(filename);

      res.json({ url: data.publicUrl });
    } catch (err) {
      console.error('Upload thumbnail error:', err);
      res.status(500).json({ error: '上傳縮圖失敗' });
    }
  }
);

/**
 * 批量更新排序 — 必須在 /:id 之前，否則 Express 會把 "admin" 當 id
 * @route PUT /api/videos/admin/reorder
 */
router.put(
  '/admin/reorder',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orders } = req.body; // [{ id: 1, sortOrder: 0 }, ...]

      for (const item of orders) {
        await supabaseAdmin
          .from('videos')
          .update({ sort_order: item.sortOrder })
          .eq('video_id', item.id);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Reorder videos error:', err);
      res.status(500).json({ error: '更新排序失敗' });
    }
  }
);

/**
 * 更新影片
 * @route PUT /api/videos/:id
 *
 * thumbnail 欄位語意：
 *   - undefined → 不動縮圖
 *   - '' (空字串) → 移除縮圖（連 Storage 檔一併刪）
 *   - 暫存 URL (temp_*.webp) → move 成 `{id}.webp` 並 cache-bust
 *   - 最終 URL (`{id}.webp`) → 只做 cache-bust（內容可能被 upload-thumbnail 覆蓋過）
 *   - 外部 URL → 直接存 URL（不處理 Storage）
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const videoId = Number(id);
      const { title, url, type, sortOrder, isVisible, description, thumbnail } =
        req.body;

      // 處理 thumbnail 變更 → 決定最終要寫入 DB 的 URL
      let finalThumbnailUrl: string | undefined = undefined;
      if (thumbnail !== undefined) {
        if (thumbnail === '') {
          // 移除縮圖
          await removeStorageFile(`${videoId}.webp`);
          finalThumbnailUrl = '';
        } else {
          const sourceFilename = parseStorageFilename(thumbnail);
          if (sourceFilename) {
            try {
              finalThumbnailUrl = await finalizeThumbnail(sourceFilename, videoId);
            } catch (err) {
              console.error('Finalize thumbnail on PUT failed:', err);
              finalThumbnailUrl = thumbnail; // 退回原 URL，避免資料遺失
            }
          } else {
            // 外部 URL，直接存
            finalThumbnailUrl = thumbnail;
          }
        }
      }

      const { data, error } = await supabaseAdmin
        .from('videos')
        .update({
          ...(title !== undefined && { title }),
          ...(url !== undefined && { url }),
          ...(type !== undefined && { type }),
          ...(sortOrder !== undefined && { sort_order: sortOrder }),
          ...(isVisible !== undefined && { is_visible: isVisible }),
          ...(description !== undefined && { description }),
          ...(finalThumbnailUrl !== undefined && {
            thumbnail_url: finalThumbnailUrl,
          }),
        })
        .eq('video_id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Update video error:', err);
      res.status(500).json({ error: '更新影片失敗' });
    }
  }
);

/**
 * 刪除影片（連 Storage 縮圖一併刪除）
 * @route DELETE /api/videos/:id
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('videos')
        .delete()
        .eq('video_id', id);

      if (error) throw error;

      // 清掉對應的縮圖檔（找不到也不報錯）
      await removeStorageFile(`${id}.webp`);

      res.json({ success: true });
    } catch (err) {
      console.error('Delete video error:', err);
      res.status(500).json({ error: '刪除影片失敗' });
    }
  }
);

export default router;
