-- ============================================================
-- Migration 014: videos 表補充欄位
-- 建立時間: 2026-04-06
-- 說明:
--   新增 description 與 thumbnail_url 欄位至 videos 表，
--   支援影片牆新增功能（截圖自動擷取 + 說明文字）。
--
-- 使用方式：在 Supabase SQL Editor 直接執行。
-- 安全：使用 IF NOT EXISTS，可重複執行。
-- ============================================================

BEGIN;

-- 新增說明欄位
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 新增縮圖 URL 欄位（存 base64 data URL 或外部圖片 URL）
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 更新 updated_at trigger（若尚未存在）
-- Supabase 通常已自帶 moddatetime extension，以下為安全保障
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_videos_updated_at'
      AND tgrelid = 'public.videos'::regclass
  ) THEN
    CREATE TRIGGER set_videos_updated_at
      BEFORE UPDATE ON public.videos
      FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- moddatetime 不存在時略過，不影響主要欄位新增
  NULL;
END $$;

COMMIT;
