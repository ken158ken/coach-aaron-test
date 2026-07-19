-- ============================================================
-- Migration 028: Landing Page 圖文示範專案（Editorial）
-- 建立時間: 2026-06-26
-- 說明:
--   建立一個使用 AARON_EDITORIAL（左右交錯雜誌式）的已發布示範頁，
--   讓 /page/editorial-demo 立刻可看到圖文並茂版型。
--
--   圖片刻意全部留空 → 前端自動顯示內建佔位圖；
--   admin 之後在後台編輯器逐張上傳即可覆蓋。
--
--   前置條件：Migration 027 已執行（AARON_EDITORIAL 存在）
--   可重複執行：ON CONFLICT 保護。
-- ============================================================

BEGIN;

DO $$
DECLARE
  t_id    BIGINT;
  proj_id BIGINT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_EDITORIAL';
  IF t_id IS NULL THEN
    RAISE NOTICE '找不到 AARON_EDITORIAL，請先執行 027_lp_rich_templates.sql';
    RETURN;
  END IF;

  -- 建立示範專案
  INSERT INTO lp_projects (
    template_id, project_code, project_name, locale,
    custom_slug, status, published_at,
    seo_title, seo_description
  ) VALUES (
    t_id,
    'LP_DEMO_EDITORIAL',
    '圖文並茂示範頁（Editorial）',
    'zh-Hant',
    'editorial-demo',
    'published',
    NOW(),
    '專業健身指導 | Aaron 教練',
    '左右交錯圖文版型示範。圖片尚未上傳時自動顯示佔位圖，後台上傳後即替換。'
  ) ON CONFLICT (project_code) DO NOTHING;

  SELECT id INTO proj_id FROM lp_projects WHERE project_code = 'LP_DEMO_EDITORIAL';

  -- 欄位覆寫值（只覆寫文字；圖片留空 → 前端顯示佔位圖）
  -- 預設模板已填 hero + block 1~3 + cta，這裡再補 block 4、5 讓示範更豐富
  INSERT INTO lp_project_field_values (project_id, field_id, value_text, sort_order)
  SELECT proj_id, f.id, vals.value_text, 0
  FROM (VALUES
    ('hero_title',     '用圖文，說好你的故事'),
    ('hero_subtitle',  '左右交錯版型 — 圖片尚未上傳時自動顯示佔位圖'),
    ('block_4_title',  '彈性時間安排'),
    ('block_4_desc',   '配合你的生活節奏，台北市多處場地可選，課程不再難排。'),
    ('block_5_title',  '課後持續支援'),
    ('block_5_desc',   '訓練之外的問題隨時 LINE 諮詢，讓改變真正融入日常。')
  ) AS vals(field_key, value_text)
  JOIN lp_template_fields f
    ON f.template_id = t_id AND f.field_key = vals.field_key
  ON CONFLICT (project_id, field_id, sort_order)
  DO UPDATE SET value_text = EXCLUDED.value_text;

END $$;

COMMIT;
