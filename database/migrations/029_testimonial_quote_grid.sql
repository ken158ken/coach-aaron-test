-- ============================================================
-- 029_testimonial_quote_grid.sql
-- 目的：首頁「Student Reviews」與「Real Reviews」兩個區塊合併為單一區塊後，
--       原 CardStackTestimonial 的三欄引言版型收進 testimonial_config.card_layout，
--       成為第三種選項 'quote-grid'。
--       本 migration 放寬 011_testimonial_card_layout.sql 建立的 CHECK 約束。
-- 套用方式：於 Supabase SQL Editor 手動執行
-- ============================================================

ALTER TABLE testimonial_config
  DROP CONSTRAINT IF EXISTS testimonial_config_card_layout_check;

ALTER TABLE testimonial_config
  ADD CONSTRAINT testimonial_config_card_layout_check
      CHECK (card_layout IN ('portrait', 'landscape', 'quote-grid'));

-- 欄位長度：'quote-grid' 為 10 字元，VARCHAR(10) 剛好容納；
-- 若日後新增更長的版型名稱，需一併放寬長度。
ALTER TABLE testimonial_config
  ALTER COLUMN card_layout TYPE VARCHAR(20);

COMMENT ON COLUMN testimonial_config.card_layout IS
  '見證卡片版型：portrait（直立 coverflow）/ landscape（橫式 coverflow）/ quote-grid（三欄引言牆）';
