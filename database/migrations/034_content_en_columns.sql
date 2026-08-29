-- 034: 首頁內容表補英文欄位（i18n 全域檢查發現缺口）
-- 這四張表原本沒有 _en 欄位，是 EN 模式下首頁殘留中文的主要來源。
-- 冪等：IF NOT EXISTS，可重複執行。
-- 套用方式：貼到 Supabase Dashboard 的 SQL Editor 執行。
-- 前端已透過 useLocalize 的 loc() 讀取 *_en 並在空值時 fallback 中文，
-- 欄位加上後即可在後台/DB 逐步補英文內容，不影響現有中文顯示。

ALTER TABLE testimonial_slides
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS achievement_en text,
  ADD COLUMN IF NOT EXISTS quote_en text;

ALTER TABLE gallery_slides
  ADD COLUMN IF NOT EXISTS caption_en text;

ALTER TABLE marquee_items
  ADD COLUMN IF NOT EXISTS label_en text,
  ADD COLUMN IF NOT EXISTS sub_en text;

ALTER TABLE podcast_episodes
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS full_description_en text;
