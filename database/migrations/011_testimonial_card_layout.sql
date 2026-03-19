-- =============================================
-- Migration 011: 學員見證幻燈片版型設定
-- 在 testimonial_config 新增 card_layout 欄位
-- 允許後台切換「直立式 (portrait)」或「橫式 (landscape)」卡片版型
-- =============================================

ALTER TABLE testimonial_config
  ADD COLUMN IF NOT EXISTS card_layout VARCHAR(10) NOT NULL DEFAULT 'portrait'
    CONSTRAINT testimonial_config_layout_check
      CHECK (card_layout IN ('portrait', 'landscape'));

-- 確保現有資料列有預設值（若已存在則更新）
UPDATE testimonial_config SET card_layout = 'portrait' WHERE card_layout IS NULL;
