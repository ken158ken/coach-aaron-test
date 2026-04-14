-- ============================================================
-- Migration 014: videos 表補充欄位
-- 建立時間: 2026-04-08
-- 說明:
--   新增 description 與 thumbnail_url 欄位至 videos 表，
--   支援影片牆新增功能（截圖自動擷取 + 說明文字）。
--
-- 使用方式：在 Supabase SQL Editor 直接執行。
-- 安全：使用 IF NOT EXISTS，可重複執行。
-- ============================================================

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
