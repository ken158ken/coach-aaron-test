-- =====================================================
-- Migration: 新增英文 i18n 欄位
-- 版本: 2026-03-15
-- 說明: 為所有動態內容表格新增 *_en 英文欄位
--       純 ADD COLUMN，不動任何現有資料
--       新欄位預設值為 NULL（系統在 lang=en 時若為 NULL 則 fallback 顯示中文）
-- 執行方式: 在 Supabase SQL Editor 貼上並執行
-- =====================================================

-- ============================================================
-- 1. articles（文章）
-- ============================================================
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS article_title_en       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS article_description_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS article_content_en     TEXT,
  ADD COLUMN IF NOT EXISTS article_keywords_en    TEXT,
  ADD COLUMN IF NOT EXISTS article_category_en    TEXT;

-- ============================================================
-- 2. courses（課程）
-- ============================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_title_en       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS course_description_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS course_content_en     TEXT,
  ADD COLUMN IF NOT EXISTS course_keywords_en    TEXT,
  ADD COLUMN IF NOT EXISTS course_category_en    TEXT;

-- ============================================================
-- 3. videos（短影音）
-- ============================================================
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);

-- ============================================================
-- 4. site_content（靜態頁面內容 / 教練介紹等）
-- ============================================================
ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS content_value_en TEXT;

-- ============================================================
-- 5. site_popups（彈出訊息）
-- ============================================================
ALTER TABLE public.site_popups
  ADD COLUMN IF NOT EXISTS popup_title_en   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS popup_content_en TEXT;

-- ============================================================
-- 驗證：確認新欄位已建立
-- ============================================================
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_en'
ORDER BY table_name, column_name;

-- =====================================================
-- 完成！接下來可在後台管理各筆記錄填入英文翻譯
-- 或用以下 UPDATE 範本批次填入（依需求補上翻譯）：
-- =====================================================

/*
-- 範例 UPDATE 模板（課程）：
UPDATE public.courses SET
  course_title_en       = 'English Title Here',
  course_description_en = 'English description here.',
  course_category_en    = 'Fitness'
WHERE course_id = 1;

-- 範例 UPDATE 模板（文章）：
UPDATE public.articles SET
  article_title_en       = 'English Title Here',
  article_description_en = 'English description here.',
  article_category_en    = 'Nutrition'
WHERE article_id = 1;

-- 範例 UPDATE 模板（site_content）：
UPDATE public.site_content SET
  content_value_en = 'English content value here'
WHERE content_key = 'hero_title';

-- 範例 UPDATE 模板（videos）：
UPDATE public.videos SET
  title_en = 'English video title here'
WHERE video_id = 1;
*/
