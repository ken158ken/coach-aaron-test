-- ============================================================
-- 032_courses_seo_fields.sql
-- courses 表新增 SEO 專用欄位
--
-- 背景：產品頁的 <title> / meta description 原本直接綁
--   course_title / course_description（頁面上顯示的真實產品文案），
--   無法在「不動產品說明」的前提下單獨優化 SEO。
--   本 migration 比照 lp_projects 既有的 seo_title / seo_description /
--   seo_keywords 命名，_en 後綴則對齊 add_i18n_en_columns.sql 慣例
--   （前端 loc() 會自動讀取）。
--
-- 前端讀取優先序（CourseDetail.tsx）：
--   title       : seo_title       || course_title
--   description : seo_description || course_description
--   keywords    : seo_keywords    || course_keywords
--   欄位為 NULL 時行為與加欄位前完全相同，可安全上線。
--
-- ⚠️ 執行方式（專案慣例，同 migrate_run_016.mjs 註解）：
--   到 Supabase Dashboard → SQL Editor 貼上本檔全文執行。
--   執行完後跑 node database/scripts/seed_course_seo.mjs 寫入 SEO 值。
-- ============================================================

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS seo_title          VARCHAR(70),
  ADD COLUMN IF NOT EXISTS seo_description    VARCHAR(320),
  ADD COLUMN IF NOT EXISTS seo_keywords       TEXT,
  ADD COLUMN IF NOT EXISTS seo_title_en       VARCHAR(70),
  ADD COLUMN IF NOT EXISTS seo_description_en VARCHAR(320),
  ADD COLUMN IF NOT EXISTS seo_keywords_en    TEXT;

COMMENT ON COLUMN courses.seo_title          IS 'SEO 專用標題（<title>/og:title 用；NULL 時 fallback course_title）';
COMMENT ON COLUMN courses.seo_description    IS 'SEO 專用描述（meta description 用；NULL 時 fallback course_description）';
COMMENT ON COLUMN courses.seo_keywords       IS 'SEO 專用關鍵字（逗號分隔；NULL 時 fallback course_keywords）';
COMMENT ON COLUMN courses.seo_title_en       IS 'SEO title (English)';
COMMENT ON COLUMN courses.seo_description_en IS 'SEO description (English)';
COMMENT ON COLUMN courses.seo_keywords_en    IS 'SEO keywords (English, comma-separated)';

-- 讓 PostgREST 立即重載 schema cache，避免 seed script 撞到 PGRST204
NOTIFY pgrst, 'reload schema';
