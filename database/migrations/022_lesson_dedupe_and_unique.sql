-- =============================================
-- Migration 022: 教學影片去重 + 加 unique constraint
-- 建立時間: 2026-04-27
--
-- 背景：021 的 INSERT ... ON CONFLICT DO NOTHING 沒指定欄位，
-- 而 SERIAL PK 每次都會給新 id，所以重複跑 migration 會塞重複的 row。
--
-- 這支做：
--   1. 把 (loom_id) 重複的 row 留 id 最小那筆，其他軟刪
--   2. 加 partial unique index（只對 deleted_at IS NULL 的 row 唯一）
--   3. 把現有 row 的 thumbnail_url 清空，讓下次 admin 編輯時用 oEmbed 自動補
-- =============================================

-- 1. 軟刪重複（留 id 最小那筆）
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY loom_id
      ORDER BY id
    ) AS rn
  FROM lesson_videos
  WHERE deleted_at IS NULL
)
UPDATE lesson_videos
SET deleted_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. 對 active row 建 partial unique index（保證未來不會再重複）
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lesson_loom_id_active
  ON lesson_videos(loom_id)
  WHERE deleted_at IS NULL;

-- 3. 清掉空 thumbnail_url + Loom CDN 自動猜測的舊 URL，讓下次 PUT 重抓 oEmbed
UPDATE lesson_videos
SET thumbnail_url = NULL
WHERE deleted_at IS NULL
  AND (
    thumbnail_url IS NULL
    OR thumbnail_url LIKE 'https://cdn.loom.com/sessions/thumbnails/%-with-play.%'
  );

-- =============================================
-- 完成
-- =============================================
