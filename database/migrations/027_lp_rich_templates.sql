-- ============================================================
-- Migration 027: Landing Page 圖文並茂模板（4 個）
-- 建立時間: 2026-06-25
-- 說明:
--   AARON_EDITORIAL — 左右交錯雜誌式：Hero + 多組圖文交錯區塊 + CTA
--   AARON_SHOWCASE  — 全寬大圖視覺式：Hero + 多段大圖疊字 + 數據帶 + CTA
--   AARON_GALLERY   — 相簿/作品集瀑布：Hero + 圖片瀑布 + 見證 + CTA
--   AARON_CARDS     — 圖文卡片網格：Hero + 圖文卡片 + CTA
--
--   設計原則（寧多勿少）：每個模板提供慷慨的固定圖片欄位，
--   空值前端自動不渲染；admin 可在 settings_json.hidden_sections
--   控制哪些區塊要顯示。
--
--   每個模板各 3 個 variant（品牌金 / 深海藍 / 簡約白）。
--   thumbnail_url 暫留 NULL，上線截圖後以 028 補上。
--   前置條件：Migration 023 已執行（lp_template_variants 存在）
-- ============================================================

BEGIN;

-- ============================================================
-- ① AARON_EDITORIAL — 左右交錯雜誌式（EditorialLP）
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_EDITORIAL', 'editorial', 'brand_narrative',
   '{editorial,magazine,image-text,storytelling}', 'magazine',
   'aos', 'Aaron 教練', '專業健身指導 | Aaron 教練',
   'EditorialLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, true, 5)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_blocks BIGINT; s_cta BIGINT;
  i INT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_EDITORIAL';
  IF t_id IS NULL THEN RETURN; END IF;

  INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order) VALUES
    (t_id, 'dark_gold', '品牌金', 'Dark Gold',
     '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}', true, 0),
    (t_id, 'dark_blue', '深海藍', 'Dark Blue',
     '{"primary":"#60a5fa","bg":"#050d1a","surface":"#0f172a","text":"#f0f9ff","muted":"#94a3b8","border":"rgba(255,255,255,0.08)"}', false, 1),
    (t_id, 'light_classic', '簡約白', 'Light Classic',
     '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}', false, 2)
  ON CONFLICT (template_id, variant_key) DO NOTHING;

  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'hero',   'Hero 主視覺', 'hero',    1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'blocks', '圖文交錯區塊', 'content', 2, 1) RETURNING id INTO s_blocks;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',    '行動呼籲',    'cta',     1, 2) RETURNING id INTO s_cta;

  -- hero
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_image',    'Hero 背景圖', 'image',      'image',     'hero', 0, NULL),
    (t_id, s_hero, 'hero_title',    '大標題',      'plain_text', 'text',      'hero', 1, '科學化訓練，看得見的改變'),
    (t_id, s_hero, 'hero_subtitle', '副標題',      'plain_text', 'text',      'hero', 2, '從評估到執行，陪你走完每一步'),
    (t_id, s_hero, 'hero_cta_text', 'CTA 按鈕文字','plain_text', 'text',      'hero', 3, '預約諮詢'),
    (t_id, s_hero, 'hero_cta_url',  'CTA 按鈕連結','url',        'url',       'hero', 4, '/booking');

  -- blocks 1~8（圖+標題+說明+選用按鈕），第一組填預設示範，其餘留空
  FOR i IN 1..8 LOOP
    INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
      (t_id, s_blocks, format('block_%s_image', i),    format('區塊 %s 圖片', i),   'image',      'image',     'blocks', i*10+0, NULL),
      (t_id, s_blocks, format('block_%s_title', i),    format('區塊 %s 標題', i),   'plain_text', 'text',      'blocks', i*10+1,
        CASE i WHEN 1 THEN '客製化訓練計畫' WHEN 2 THEN '科學化週期安排' WHEN 3 THEN '數據追蹤進步' ELSE NULL END),
      (t_id, s_blocks, format('block_%s_desc', i),     format('區塊 %s 說明', i),   'long_text',  'text_long', 'blocks', i*10+2,
        CASE i WHEN 1 THEN '依你的目標、體能與時間量身打造，沒有罐頭課表。'
               WHEN 2 THEN '融合最新運動科學，每個訓練階段都有清楚方向。'
               WHEN 3 THEN '記錄每一次突破，用數據看見真實的成長。' ELSE NULL END),
      (t_id, s_blocks, format('block_%s_cta_text', i), format('區塊 %s 按鈕文字', i),'plain_text', 'text',     'blocks', i*10+3, NULL),
      (t_id, s_blocks, format('block_%s_cta_url', i),  format('區塊 %s 按鈕連結', i),'url',        'url',      'blocks', i*10+4, NULL);
  END LOOP;

  -- cta
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題', 'plain_text', 'text',      'cta', 0, '準備好開始了嗎？'),
    (t_id, s_cta, 'cta_desc',        'CTA 說明', 'long_text',  'text_long', 'cta', 1, '預約免費 40 分鐘諮詢，讓我們一起規劃你的訓練。'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字', 'plain_text', 'text',      'cta', 2, '免費諮詢'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結', 'url',        'url',       'cta', 3, '/booking');
END $$;


-- ============================================================
-- ② AARON_SHOWCASE — 全寬大圖視覺式（ShowcaseLP）
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_SHOWCASE', 'showcase', 'brand_narrative',
   '{showcase,fullscreen,big-image,cinematic}', 'fullscreen-hero',
   'aos', 'Aaron 教練', '視覺體驗 | Aaron 教練',
   'ShowcaseLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, false, 6)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_scenes BIGINT; s_stats BIGINT; s_cta BIGINT;
  i INT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_SHOWCASE';
  IF t_id IS NULL THEN RETURN; END IF;

  INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order) VALUES
    (t_id, 'dark_gold', '品牌金', 'Dark Gold',
     '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}', true, 0),
    (t_id, 'dark_blue', '深海藍', 'Dark Blue',
     '{"primary":"#60a5fa","bg":"#050d1a","surface":"#0f172a","text":"#f0f9ff","muted":"#94a3b8","border":"rgba(255,255,255,0.08)"}', false, 1),
    (t_id, 'light_classic', '簡約白', 'Light Classic',
     '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}', false, 2)
  ON CONFLICT (template_id, variant_key) DO NOTHING;

  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'hero',   'Hero 主視覺', 'hero',    1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'scenes', '大圖段落',    'gallery', 1, 1) RETURNING id INTO s_scenes;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'stats',  '數字統計',    'metrics', 3, 2) RETURNING id INTO s_stats;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',    '行動呼籲',    'cta',     1, 3) RETURNING id INTO s_cta;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_image',    'Hero 背景圖', 'image',      'image', 'hero', 0, NULL),
    (t_id, s_hero, 'hero_title',    '大標題',      'plain_text', 'text',  'hero', 1, '突破極限'),
    (t_id, s_hero, 'hero_subtitle', '副標題',      'plain_text', 'text',  'hero', 2, '每一次訓練，都是更好的自己'),
    (t_id, s_hero, 'hero_cta_text', 'CTA 按鈕文字','plain_text', 'text',  'hero', 3, '開始訓練'),
    (t_id, s_hero, 'hero_cta_url',  'CTA 按鈕連結','url',        'url',   'hero', 4, '/booking');

  -- scenes 1~6（全寬大圖 + 疊字標題 + 說明）
  FOR i IN 1..6 LOOP
    INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
      (t_id, s_scenes, format('scene_%s_image', i), format('段落 %s 大圖', i),  'image',      'image',     'scenes', i*10+0, NULL),
      (t_id, s_scenes, format('scene_%s_title', i), format('段落 %s 標題', i),  'plain_text', 'text',      'scenes', i*10+1,
        CASE i WHEN 1 THEN '力量' WHEN 2 THEN '專注' WHEN 3 THEN '堅持' ELSE NULL END),
      (t_id, s_scenes, format('scene_%s_desc', i),  format('段落 %s 說明', i),  'long_text',  'text_long', 'scenes', i*10+2,
        CASE i WHEN 1 THEN '建立扎實的肌力基礎，從核心開始。'
               WHEN 2 THEN '每個動作都全神貫注，品質勝過數量。'
               WHEN 3 THEN '改變不是一天造成，而是日復一日的累積。' ELSE NULL END);
  END LOOP;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_stats, 'stat_1_number', '數據 1 數字', 'plain_text', 'text', 'stats', 0, '500+'),
    (t_id, s_stats, 'stat_1_label',  '數據 1 說明', 'plain_text', 'text', 'stats', 1, '學員'),
    (t_id, s_stats, 'stat_2_number', '數據 2 數字', 'plain_text', 'text', 'stats', 2, '5年'),
    (t_id, s_stats, 'stat_2_label',  '數據 2 說明', 'plain_text', 'text', 'stats', 3, '執教經驗'),
    (t_id, s_stats, 'stat_3_number', '數據 3 數字', 'plain_text', 'text', 'stats', 4, '98%'),
    (t_id, s_stats, 'stat_3_label',  '數據 3 說明', 'plain_text', 'text', 'stats', 5, '滿意度');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題', 'plain_text', 'text',      'cta', 0, '你的改變，從現在開始'),
    (t_id, s_cta, 'cta_desc',        'CTA 說明', 'long_text',  'text_long', 'cta', 1, '預約免費諮詢，讓 Aaron 教練為你評估。'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字', 'plain_text', 'text',      'cta', 2, '免費諮詢'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結', 'url',        'url',       'cta', 3, '/booking');
END $$;


-- ============================================================
-- ③ AARON_GALLERY — 相簿/作品集瀑布（GalleryLP）
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_GALLERY', 'gallery', 'portfolio',
   '{gallery,portfolio,before-after,grid}', 'magazine',
   'aos', 'Aaron 教練', '成果作品集 | Aaron 教練',
   'GalleryLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, false, 7)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_gallery BIGINT; s_testi BIGINT; s_cta BIGINT;
  i INT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_GALLERY';
  IF t_id IS NULL THEN RETURN; END IF;

  INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order) VALUES
    (t_id, 'dark_gold', '品牌金', 'Dark Gold',
     '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}', true, 0),
    (t_id, 'dark_blue', '深海藍', 'Dark Blue',
     '{"primary":"#60a5fa","bg":"#050d1a","surface":"#0f172a","text":"#f0f9ff","muted":"#94a3b8","border":"rgba(255,255,255,0.08)"}', false, 1),
    (t_id, 'light_classic', '簡約白', 'Light Classic',
     '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}', false, 2)
  ON CONFLICT (template_id, variant_key) DO NOTHING;

  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'hero',         'Hero 主視覺', 'hero',         1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'gallery',      '圖片瀑布',    'gallery',      3, 1) RETURNING id INTO s_gallery;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'testimonials', '學員見證',    'testimonials', 3, 2) RETURNING id INTO s_testi;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',          '行動呼籲',    'cta',          1, 3) RETURNING id INTO s_cta;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_image',    'Hero 背景圖', 'image',      'image', 'hero', 0, NULL),
    (t_id, s_hero, 'hero_title',    '大標題',      'plain_text', 'text',  'hero', 1, '看見真實的成果'),
    (t_id, s_hero, 'hero_subtitle', '副標題',      'plain_text', 'text',  'hero', 2, '每一張照片，都是一段努力的故事');

  -- gallery 1~12（圖 + 說明）
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_gallery, 'gallery_title', '區塊標題', 'plain_text', 'text', 'gallery', 0, '成果集錦');
  FOR i IN 1..12 LOOP
    INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
      (t_id, s_gallery, format('gallery_%s_image', i),   format('圖片 %s', i),    'image',      'image', 'gallery', i*10+0, NULL),
      (t_id, s_gallery, format('gallery_%s_caption', i), format('圖片 %s 說明', i),'plain_text', 'text',  'gallery', i*10+1, NULL);
  END LOOP;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_testi, 'testimonials_title',   '區塊標題',   'plain_text', 'text',      'testimonials', 0, '學員怎麼說'),
    (t_id, s_testi, 'testimonial_1_avatar', '見證 1 頭像','image',      'image',     'testimonials', 1, NULL),
    (t_id, s_testi, 'testimonial_1_name',   '見證 1 姓名','plain_text', 'text',      'testimonials', 2, '林 ○ 宸'),
    (t_id, s_testi, 'testimonial_1_role',   '見證 1 身份','plain_text', 'text',      'testimonials', 3, '減脂 15kg'),
    (t_id, s_testi, 'testimonial_1_text',   '見證 1 內容','long_text',  'text_long', 'testimonials', 4, '6 個月體脂從 30% 降到 18%，最重要的是學到正確觀念。'),
    (t_id, s_testi, 'testimonial_2_avatar', '見證 2 頭像','image',      'image',     'testimonials', 5, NULL),
    (t_id, s_testi, 'testimonial_2_name',   '見證 2 姓名','plain_text', 'text',      'testimonials', 6, '陳 ○ 筠'),
    (t_id, s_testi, 'testimonial_2_role',   '見證 2 身份','plain_text', 'text',      'testimonials', 7, '增肌塑形'),
    (t_id, s_testi, 'testimonial_2_text',   '見證 2 內容','long_text',  'text_long', 'testimonials', 8, '從完全不運動到每週訓練 4 次，教練的耐心讓我堅持下來。'),
    (t_id, s_testi, 'testimonial_3_avatar', '見證 3 頭像','image',      'image',     'testimonials', 9, NULL),
    (t_id, s_testi, 'testimonial_3_name',   '見證 3 姓名','plain_text', 'text',      'testimonials', 10, '張 ○ 豪'),
    (t_id, s_testi, 'testimonial_3_role',   '見證 3 身份','plain_text', 'text',      'testimonials', 11, '提升競技表現'),
    (t_id, s_testi, 'testimonial_3_text',   '見證 3 內容','long_text',  'text_long', 'testimonials', 12, '深蹲突破 200kg，教練的技術分析讓我少走很多彎路。');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題', 'plain_text', 'text',      'cta', 0, '下一個成功故事，就是你'),
    (t_id, s_cta, 'cta_desc',        'CTA 說明', 'long_text',  'text_long', 'cta', 1, '預約免費諮詢，開始屬於你的轉變。'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字', 'plain_text', 'text',      'cta', 2, '免費諮詢'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結', 'url',        'url',       'cta', 3, '/booking');
END $$;


-- ============================================================
-- ④ AARON_CARDS — 圖文卡片網格（CardsLP）
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_CARDS', 'cards', 'lead_gen',
   '{cards,grid,services,courses}', 'standard',
   'aos', 'Aaron 教練', '課程與服務 | Aaron 教練',
   'CardsLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, false, 8)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_cards BIGINT; s_cta BIGINT;
  i INT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_CARDS';
  IF t_id IS NULL THEN RETURN; END IF;

  INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order) VALUES
    (t_id, 'dark_gold', '品牌金', 'Dark Gold',
     '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}', true, 0),
    (t_id, 'dark_blue', '深海藍', 'Dark Blue',
     '{"primary":"#60a5fa","bg":"#050d1a","surface":"#0f172a","text":"#f0f9ff","muted":"#94a3b8","border":"rgba(255,255,255,0.08)"}', false, 1),
    (t_id, 'light_classic', '簡約白', 'Light Classic',
     '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}', false, 2)
  ON CONFLICT (template_id, variant_key) DO NOTHING;

  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'hero',  'Hero 主視覺', 'hero',     1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cards', '圖文卡片',    'features', 3, 1) RETURNING id INTO s_cards;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',   '行動呼籲',    'cta',      1, 2) RETURNING id INTO s_cta;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_image',    'Hero 背景圖', 'image',      'image', 'hero', 0, NULL),
    (t_id, s_hero, 'hero_title',    '大標題',      'plain_text', 'text',  'hero', 1, '找到最適合你的方案'),
    (t_id, s_hero, 'hero_subtitle', '副標題',      'plain_text', 'text',  'hero', 2, '多元課程與服務，總有一個為你而設'),
    (t_id, s_hero, 'hero_cta_text', 'CTA 按鈕文字','plain_text', 'text',  'hero', 3, '了解更多'),
    (t_id, s_hero, 'hero_cta_url',  'CTA 按鈕連結','url',        'url',   'hero', 4, '/booking');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cards, 'cards_title', '區塊標題', 'plain_text', 'text', 'cards', 0, '我們提供的服務');
  -- cards 1~9（圖 + 標題 + 說明 + 選用按鈕）
  FOR i IN 1..9 LOOP
    INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
      (t_id, s_cards, format('card_%s_image', i),    format('卡片 %s 圖片', i),   'image',      'image',     'cards', i*10+0, NULL),
      (t_id, s_cards, format('card_%s_title', i),    format('卡片 %s 標題', i),   'plain_text', 'text',      'cards', i*10+1,
        CASE i WHEN 1 THEN '一對一私人教練' WHEN 2 THEN '團體課程' WHEN 3 THEN '線上課表' ELSE NULL END),
      (t_id, s_cards, format('card_%s_desc', i),     format('卡片 %s 說明', i),   'long_text',  'text_long', 'cards', i*10+2,
        CASE i WHEN 1 THEN '完全客製化，全程專注於你的目標。'
               WHEN 2 THEN '與夥伴一起訓練，氣氛更有動力。'
               WHEN 3 THEN '彈性時間，跟著系統化課表自主訓練。' ELSE NULL END),
      (t_id, s_cards, format('card_%s_cta_text', i), format('卡片 %s 按鈕文字', i),'plain_text', 'text',     'cards', i*10+3, NULL),
      (t_id, s_cards, format('card_%s_cta_url', i),  format('卡片 %s 按鈕連結', i),'url',        'url',      'cards', i*10+4, NULL);
  END LOOP;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題', 'plain_text', 'text',      'cta', 0, '還不確定哪個適合你？'),
    (t_id, s_cta, 'cta_desc',        'CTA 說明', 'long_text',  'text_long', 'cta', 1, '預約免費諮詢，讓我幫你找到最合適的選擇。'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字', 'plain_text', 'text',      'cta', 2, '免費諮詢'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結', 'url',        'url',       'cta', 3, '/booking');
END $$;

COMMIT;
