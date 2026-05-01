-- ============================================================
-- Migration 024: Landing Page 新增 4 個模板
-- 建立時間: 2026-05-01
-- 說明:
--   AARON_FITNESS_DARK  — 健身深黑：全寬 Hero + 數據帶 + 特色 + 見證 + CTA
--   AARON_PRICING       — 定價方案：3 欄定價卡 + FAQ + CTA
--   AARON_MINIMAL_LIGHT — 極簡亮色：留白 Hero + 分割內容 + 引言 + 特色 + CTA
--   AARON_STORY         — 個人故事：電影感 Hero + 時間軸 + Gallery + 聯絡
--
--   每個模板各有 3 個 variant（品牌金 / 深海藍 / 簡約白）
--   前置條件：Migration 023 已執行
-- ============================================================

BEGIN;

-- ============================================================
-- ① AARON_FITNESS_DARK
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_FITNESS_DARK', 'fitness-dark', 'brand_narrative',
   '{fitness,coaching,dark-theme,bold}', 'fullscreen-hero',
   'aos', 'Aaron 教練', '健身訓練課程 | Aaron 教練',
   'FitnessDarkLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, true, 1)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_stats BIGINT; s_feat BIGINT; s_testi BIGINT; s_cta BIGINT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_FITNESS_DARK';
  IF t_id IS NULL THEN RETURN; END IF;

  -- Variants
  INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order) VALUES
    (t_id, 'dark_gold', '品牌金', 'Dark Gold',
     '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}', true, 0),
    (t_id, 'dark_blue', '深海藍', 'Dark Blue',
     '{"primary":"#60a5fa","bg":"#050d1a","surface":"#0f172a","text":"#f0f9ff","muted":"#94a3b8","border":"rgba(255,255,255,0.08)"}', false, 1),
    (t_id, 'light_classic', '簡約白', 'Light Classic',
     '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}', false, 2)
  ON CONFLICT (template_id, variant_key) DO NOTHING;

  -- Sections
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'hero',         'Hero 主視覺',   'hero',         1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'stats',        '數字統計',      'metrics',      3, 1) RETURNING id INTO s_stats;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'features',     '核心特色',      'features',     3, 2) RETURNING id INTO s_feat;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'testimonials', '學員見證',      'testimonials', 3, 3) RETURNING id INTO s_testi;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',          '行動呼籲',      'cta',          1, 4) RETURNING id INTO s_cta;

  -- Fields: hero
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_image',       'Hero 背景圖片', 'image',      'image',     'hero', 0, NULL),
    (t_id, s_hero, 'hero_title',       '大標題',        'plain_text', 'text',      'hero', 1, '你的最佳訓練夥伴'),
    (t_id, s_hero, 'hero_subtitle',    '副標題',        'plain_text', 'text',      'hero', 2, '科學化訓練，快速看見成果'),
    (t_id, s_hero, 'hero_description', '說明文字',      'long_text',  'text_long', 'hero', 3, '讓 Aaron 教練帶你打破瓶頸，建立持續進步的訓練習慣。'),
    (t_id, s_hero, 'hero_cta_text',    'CTA 按鈕文字',  'plain_text', 'text',      'hero', 4, '立即預約諮詢'),
    (t_id, s_hero, 'hero_cta_url',     'CTA 按鈕連結',  'url',        'url',       'hero', 5, '/booking');

  -- Fields: stats
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_stats, 'stat_1_number', '數據 1 數字', 'plain_text', 'text', 'stats', 0, '500+'),
    (t_id, s_stats, 'stat_1_label',  '數據 1 說明', 'plain_text', 'text', 'stats', 1, '學員'),
    (t_id, s_stats, 'stat_2_number', '數據 2 數字', 'plain_text', 'text', 'stats', 2, '5年'),
    (t_id, s_stats, 'stat_2_label',  '數據 2 說明', 'plain_text', 'text', 'stats', 3, '執教經驗'),
    (t_id, s_stats, 'stat_3_number', '數據 3 數字', 'plain_text', 'text', 'stats', 4, '98%'),
    (t_id, s_stats, 'stat_3_label',  '數據 3 說明', 'plain_text', 'text', 'stats', 5, '滿意度');

  -- Fields: features
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_feat, 'features_title',    '區塊標題',       'plain_text', 'text', 'features', 0, '為什麼選擇 Aaron 教練'),
    (t_id, s_feat, 'feature_1_icon',    '特色 1 圖示',    'plain_text', 'text', 'features', 1, '💪'),
    (t_id, s_feat, 'feature_1_title',   '特色 1 標題',    'plain_text', 'text', 'features', 2, '客製化訓練計畫'),
    (t_id, s_feat, 'feature_1_desc',    '特色 1 說明',    'long_text',  'text_long', 'features', 3, '依照你的目標、體能與時間量身打造'),
    (t_id, s_feat, 'feature_2_icon',    '特色 2 圖示',    'plain_text', 'text', 'features', 4, '🔥'),
    (t_id, s_feat, 'feature_2_title',   '特色 2 標題',    'plain_text', 'text', 'features', 5, '科學化週期訓練'),
    (t_id, s_feat, 'feature_2_desc',    '特色 2 說明',    'long_text',  'text_long', 'features', 6, '融合最新運動科學，讓每次訓練都有方向'),
    (t_id, s_feat, 'feature_3_icon',    '特色 3 圖示',    'plain_text', 'text', 'features', 7, '📊'),
    (t_id, s_feat, 'feature_3_title',   '特色 3 標題',    'plain_text', 'text', 'features', 8, '數據追蹤進步'),
    (t_id, s_feat, 'feature_3_desc',    '特色 3 說明',    'long_text',  'text_long', 'features', 9, '記錄每一次的突破，看見真實的成長');

  -- Fields: testimonials
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_testi, 'testimonials_title',    '區塊標題',         'plain_text', 'text', 'testimonials', 0, '學員怎麼說'),
    (t_id, s_testi, 'testimonial_1_avatar',  '見證 1 頭像',      'image',      'image', 'testimonials', 1, NULL),
    (t_id, s_testi, 'testimonial_1_name',    '見證 1 姓名',      'plain_text', 'text', 'testimonials', 2, '林 ○ 宸'),
    (t_id, s_testi, 'testimonial_1_role',    '見證 1 身份',      'plain_text', 'text', 'testimonials', 3, '上班族 / 減脂 15kg'),
    (t_id, s_testi, 'testimonial_1_text',    '見證 1 內容',      'long_text',  'text_long', 'testimonials', 4, '跟著 Aaron 訓練 6 個月，體脂從 30% 降到 18%，最重要的是學到了正確觀念。'),
    (t_id, s_testi, 'testimonial_2_avatar',  '見證 2 頭像',      'image',      'image', 'testimonials', 5, NULL),
    (t_id, s_testi, 'testimonial_2_name',    '見證 2 姓名',      'plain_text', 'text', 'testimonials', 6, '陳 ○ 筠'),
    (t_id, s_testi, 'testimonial_2_role',    '見證 2 身份',      'plain_text', 'text', 'testimonials', 7, '家庭主婦 / 增肌塑形'),
    (t_id, s_testi, 'testimonial_2_text',    '見證 2 內容',      'long_text',  'text_long', 'testimonials', 8, '從完全不運動到現在每週訓練 4 次，Aaron 教練的耐心讓我堅持下來。'),
    (t_id, s_testi, 'testimonial_3_avatar',  '見證 3 頭像',      'image',      'image', 'testimonials', 9, NULL),
    (t_id, s_testi, 'testimonial_3_name',    '見證 3 姓名',      'plain_text', 'text', 'testimonials', 10, '張 ○ 豪'),
    (t_id, s_testi, 'testimonial_3_role',    '見證 3 身份',      'plain_text', 'text', 'testimonials', 11, '運動員 / 提升競技表現'),
    (t_id, s_testi, 'testimonial_3_text',    '見證 3 內容',      'long_text',  'text_long', 'testimonials', 12, '深蹲突破 200kg 個人紀錄，Aaron 的技術分析讓我少走很多彎路。');

  -- Fields: cta
  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題',    'plain_text', 'text',      'cta', 0, '準備好改變了嗎？'),
    (t_id, s_cta, 'cta_desc',        'CTA 說明',    'long_text',  'text_long', 'cta', 1, '立即預約免費 40 分鐘諮詢，Aaron 教練親自為你評估並制定專屬計畫。'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字',    'plain_text', 'text',      'cta', 2, '免費諮詢'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結',    'url',        'url',       'cta', 3, '/booking');
END $$;


-- ============================================================
-- ② AARON_PRICING
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_PRICING', 'pricing', 'pricing',
   '{pricing,courses,comparison}', 'standard',
   'aos', 'Aaron 教練', '課程方案與費用 | Aaron 教練',
   'PricingLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, false, 2)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_pricing BIGINT; s_faq BIGINT; s_cta BIGINT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_PRICING';
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
    (t_id, 'hero',    'Hero',      'hero',    1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'pricing', '定價方案',  'pricing', 3, 1) RETURNING id INTO s_pricing;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'faq',     '常見問題',  'faq',     1, 2) RETURNING id INTO s_faq;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',     '最終 CTA',  'cta',     1, 3) RETURNING id INTO s_cta;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_title',    '主標題', 'plain_text', 'text',      'hero', 0, '選擇適合你的訓練計畫'),
    (t_id, s_hero, 'hero_subtitle', '副標題', 'long_text',  'text_long', 'hero', 1, '彈性方案，從初學到進階都有合適選項');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_pricing, 'plan_1_name',     '方案 1 名稱',     'plain_text', 'text',      'pricing', 0, '基礎班'),
    (t_id, s_pricing, 'plan_1_price',    '方案 1 價格',     'plain_text', 'text',      'pricing', 1, '$2,800'),
    (t_id, s_pricing, 'plan_1_period',   '方案 1 週期',     'plain_text', 'text',      'pricing', 2, '/ 月'),
    (t_id, s_pricing, 'plan_1_features', '方案 1 內容（每行一項）', 'long_text', 'text_long', 'pricing', 3,
     E'每週 2 堂課\n個人化訓練計畫\n基礎動作指導\n進度追蹤 App'),
    (t_id, s_pricing, 'plan_1_cta_text', '方案 1 按鈕',     'plain_text', 'text',      'pricing', 4, '立即報名'),
    (t_id, s_pricing, 'plan_1_cta_url',  '方案 1 連結',     'url',        'url',       'pricing', 5, '/booking'),
    (t_id, s_pricing, 'plan_2_name',     '方案 2 名稱',     'plain_text', 'text',      'pricing', 6, '進階班'),
    (t_id, s_pricing, 'plan_2_price',    '方案 2 價格',     'plain_text', 'text',      'pricing', 7, '$4,500'),
    (t_id, s_pricing, 'plan_2_period',   '方案 2 週期',     'plain_text', 'text',      'pricing', 8, '/ 月'),
    (t_id, s_pricing, 'plan_2_badge',    '方案 2 標籤（空白=不顯示）', 'plain_text', 'text', 'pricing', 9, '最多人選擇'),
    (t_id, s_pricing, 'plan_2_features', '方案 2 內容（每行一項）', 'long_text', 'text_long', 'pricing', 10,
     E'每週 4 堂課\n全面週期訓練計畫\n動作深度分析\n營養諮詢\n進度追蹤 App\n月度體態評估'),
    (t_id, s_pricing, 'plan_2_cta_text', '方案 2 按鈕',     'plain_text', 'text',      'pricing', 11, '立即報名'),
    (t_id, s_pricing, 'plan_2_cta_url',  '方案 2 連結',     'url',        'url',       'pricing', 12, '/booking'),
    (t_id, s_pricing, 'plan_3_name',     '方案 3 名稱',     'plain_text', 'text',      'pricing', 13, '菁英班'),
    (t_id, s_pricing, 'plan_3_price',    '方案 3 價格',     'plain_text', 'text',      'pricing', 14, '洽詢'),
    (t_id, s_pricing, 'plan_3_period',   '方案 3 週期',     'plain_text', 'text',      'pricing', 15, ''),
    (t_id, s_pricing, 'plan_3_features', '方案 3 內容（每行一項）', 'long_text', 'text_long', 'pricing', 16,
     E'無限堂數\n完全客製化計畫\n24/7 教練諮詢\n賽事備賽支援\n專業運動攝影\n品牌合作媒合'),
    (t_id, s_pricing, 'plan_3_cta_text', '方案 3 按鈕',     'plain_text', 'text',      'pricing', 17, '聯絡洽詢'),
    (t_id, s_pricing, 'plan_3_cta_url',  '方案 3 連結',     'url',        'url',       'pricing', 18, '/contact');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_faq, 'faq_title',      'FAQ 標題',    'plain_text', 'text',      'faq', 0, '常見問題'),
    (t_id, s_faq, 'faq_1_question', '問題 1',      'plain_text', 'text',      'faq', 1, '課程適合完全初學者嗎？'),
    (t_id, s_faq, 'faq_1_answer',   '解答 1',      'long_text',  'text_long', 'faq', 2, '當然！Aaron 教練擅長從零開始培養，基礎班特別為初學者設計，安全有效。'),
    (t_id, s_faq, 'faq_2_question', '問題 2',      'plain_text', 'text',      'faq', 3, '可以試上一堂課嗎？'),
    (t_id, s_faq, 'faq_2_answer',   '解答 2',      'long_text',  'text_long', 'faq', 4, '可以！預約免費 40 分鐘評估諮詢，了解你的目標後，再決定最適合的方案。'),
    (t_id, s_faq, 'faq_3_question', '問題 3',      'plain_text', 'text',      'faq', 5, '訓練地點在哪裡？'),
    (t_id, s_faq, 'faq_3_answer',   '解答 3',      'long_text',  'text_long', 'faq', 6, '提供台北市區多處場地，亦可至指定健身房合作。'),
    (t_id, s_faq, 'faq_4_question', '問題 4',      'plain_text', 'text',      'faq', 7, '中途可以換方案嗎？'),
    (t_id, s_faq, 'faq_4_answer',   '解答 4',      'long_text',  'text_long', 'faq', 8, '隨時可以升級或降級方案，費用依比例計算。');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題',  'plain_text', 'text',      'cta', 0, '還有疑問？直接聯絡我'),
    (t_id, s_cta, 'cta_desc',        'CTA 說明',  'long_text',  'text_long', 'cta', 1, '預約免費評估，讓 Aaron 教練親自幫你找到最適合的訓練路徑。'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字',  'plain_text', 'text',      'cta', 2, '免費諮詢'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結',  'url',        'url',       'cta', 3, '/booking');
END $$;


-- ============================================================
-- ③ AARON_MINIMAL_LIGHT
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_MINIMAL_LIGHT', 'minimal-light', 'lead_gen',
   '{minimal,light-theme,consultation,clean}', 'standard',
   'aos', 'Aaron 教練', '專業健身諮詢 | Aaron 教練',
   'MinimalLightLP',
   '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}',
   true, false, 3)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_about BIGINT; s_quote BIGINT; s_features BIGINT; s_cta BIGINT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_MINIMAL_LIGHT';
  IF t_id IS NULL THEN RETURN; END IF;

  INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order) VALUES
    (t_id, 'light_classic', '簡約白', 'Light Classic',
     '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}', true, 0),
    (t_id, 'dark_gold', '品牌金', 'Dark Gold',
     '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}', false, 1),
    (t_id, 'sage_green', '自然綠', 'Sage Green',
     '{"primary":"#16a34a","bg":"#f7fdf9","surface":"#ffffff","text":"#14532d","muted":"#6b7280","border":"rgba(0,0,0,0.08)"}', false, 2)
  ON CONFLICT (template_id, variant_key) DO NOTHING;

  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'hero',     'Hero',        'hero',    1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'about',    '關於教練',    'about',   2, 1) RETURNING id INTO s_about;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'quote',    '引言',        'content', 1, 2) RETURNING id INTO s_quote;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'features', '服務特色',    'features',2, 3) RETURNING id INTO s_features;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'cta',      '行動呼籲',    'cta',     1, 4) RETURNING id INTO s_cta;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_title',       '主標題',        'plain_text', 'text',      'hero', 0, '健康，是一種選擇'),
    (t_id, s_hero, 'hero_subtitle',    '副標題',        'plain_text', 'text',      'hero', 1, '讓專業教練陪你走上正確的訓練之路'),
    (t_id, s_hero, 'hero_cta_text',    'CTA 按鈕文字',  'plain_text', 'text',      'hero', 2, '預約免費諮詢'),
    (t_id, s_hero, 'hero_cta_url',     'CTA 按鈕連結',  'url',        'url',       'hero', 3, '/booking');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_about, 'about_image',  '教練照片',    'image',     'image',     'about', 0, NULL),
    (t_id, s_about, 'about_title',  '標題',        'plain_text','text',      'about', 1, '你好，我是 Aaron'),
    (t_id, s_about, 'about_body',   '自我介紹',    'long_text', 'text_long', 'about', 2, '擁有 NSCA-CSCS 認證、5 年以上私人教練資歷。我相信每個人都有潛力，需要的只是正確的方法與持之以恆的陪伴。');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_quote, 'quote_text',         '引言文字',   'long_text',  'text_long', 'quote', 0, '訓練不只是讓身體更好，更是讓自己更有力量面對生活。'),
    (t_id, s_quote, 'quote_author',       '作者姓名',   'plain_text', 'text',      'quote', 1, 'Aaron 教練'),
    (t_id, s_quote, 'quote_author_title', '作者頭銜',   'plain_text', 'text',      'quote', 2, 'NSCA-CSCS 認證私人教練');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_features, 'feature_1_title', '特色 1 標題', 'plain_text', 'text',      'features', 0, '1 對 1 完全專注'),
    (t_id, s_features, 'feature_1_desc',  '特色 1 說明', 'long_text',  'text_long', 'features', 1, '每堂課 60 分鐘全心投入，動作細節一個不漏'),
    (t_id, s_features, 'feature_2_title', '特色 2 標題', 'plain_text', 'text',      'features', 2, '科學化評估'),
    (t_id, s_features, 'feature_2_desc',  '特色 2 說明', 'long_text',  'text_long', 'features', 3, '首次諮詢完整評估體能、姿勢、生活習慣'),
    (t_id, s_features, 'feature_3_title', '特色 3 標題', 'plain_text', 'text',      'features', 4, '彈性安排'),
    (t_id, s_features, 'feature_3_desc',  '特色 3 說明', 'long_text',  'text_long', 'features', 5, '台北市多處場地，配合你的行程與生活節奏'),
    (t_id, s_features, 'feature_4_title', '特色 4 標題', 'plain_text', 'text',      'features', 6, '持續支援'),
    (t_id, s_features, 'feature_4_desc',  '特色 4 說明', 'long_text',  'text_long', 'features', 7, '課後問題隨時 LINE 諮詢，訓練之外也有人陪');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_cta, 'cta_title',       'CTA 標題',  'plain_text', 'text',      'cta', 0, '踏出第一步'),
    (t_id, s_cta, 'cta_button_text', '按鈕文字',  'plain_text', 'text',      'cta', 1, '預約免費評估'),
    (t_id, s_cta, 'cta_button_url',  '按鈕連結',  'url',        'url',       'cta', 2, '/booking');
END $$;


-- ============================================================
-- ④ AARON_STORY
-- ============================================================
INSERT INTO lp_templates
  (template_code, template_slug, page_kind, category_tags, page_layout,
   animation_type, brand_name, html_title, jsx_component_key,
   color_vars, is_active, is_featured, sort_order)
VALUES
  ('AARON_STORY', 'story', 'brand_narrative',
   '{story,personal-brand,timeline,cinematic}', 'fullscreen-hero',
   'aos', 'Aaron 教練', 'Aaron 的故事 | 健身教練',
   'StoryLP',
   '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
   true, false, 4)
ON CONFLICT (template_code) DO NOTHING;

DO $$
DECLARE
  t_id BIGINT;
  s_hero BIGINT; s_about BIGINT; s_milestone BIGINT; s_gallery BIGINT; s_contact BIGINT;
BEGIN
  SELECT id INTO t_id FROM lp_templates WHERE template_code = 'AARON_STORY';
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
    (t_id, 'hero',       'Hero',       'hero',    1, 0) RETURNING id INTO s_hero;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'about',      '關於我',     'about',   2, 1) RETURNING id INTO s_about;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'milestones', '里程碑',     'process', 1, 2) RETURNING id INTO s_milestone;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'gallery',    '作品集',     'gallery', 3, 3) RETURNING id INTO s_gallery;
  INSERT INTO lp_template_sections (template_id, section_key, section_name, section_type, layout_cols, sort_order) VALUES
    (t_id, 'contact',    '聯絡方式',   'contact', 1, 4) RETURNING id INTO s_contact;

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_hero, 'hero_image',   'Hero 背景圖', 'image',      'image', 'hero', 0, NULL),
    (t_id, s_hero, 'hero_title',   '大標題',      'plain_text', 'text',  'hero', 1, 'Aaron 的故事'),
    (t_id, s_hero, 'hero_tagline', '標語',        'plain_text', 'text',  'hero', 2, '從自身改變，到改變無數人的生命');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_about, 'about_image',  '個人照片',  'image',      'image',     'about', 0, NULL),
    (t_id, s_about, 'about_title',  '標題',      'plain_text', 'text',      'about', 1, '為什麼我走上這條路'),
    (t_id, s_about, 'about_body_1', '段落一',    'long_text',  'text_long', 'about', 2, '大學時期因為體重問題飽受困擾，那段時間讓我深刻體會到「改變」需要的不只是意志力，更需要正確的知識與持續的陪伴。'),
    (t_id, s_about, 'about_body_2', '段落二',    'long_text',  'text_long', 'about', 3, '取得 NSCA-CSCS 認證後，我把所有學到的知識都投入在幫助學員身上。看見他們的改變，是我最大的動力。');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_milestone, 'milestones_title',    '區塊標題',     'plain_text', 'text',      'milestones', 0, '這些年的足跡'),
    (t_id, s_milestone, 'milestone_1_year',    '里程碑 1 年份','plain_text', 'text',      'milestones', 1, '2018'),
    (t_id, s_milestone, 'milestone_1_title',   '里程碑 1 標題','plain_text', 'text',      'milestones', 2, '開始執教'),
    (t_id, s_milestone, 'milestone_1_desc',    '里程碑 1 說明','long_text',  'text_long', 'milestones', 3, '取得 NSCA-CSCS 認證，在台北市開始接第一批學員'),
    (t_id, s_milestone, 'milestone_2_year',    '里程碑 2 年份','plain_text', 'text',      'milestones', 4, '2020'),
    (t_id, s_milestone, 'milestone_2_title',   '里程碑 2 標題','plain_text', 'text',      'milestones', 5, '突破 100 位學員'),
    (t_id, s_milestone, 'milestone_2_desc',    '里程碑 2 說明','long_text',  'text_long', 'milestones', 6, '口碑帶動成長，學員涵蓋各年齡層與運動背景'),
    (t_id, s_milestone, 'milestone_3_year',    '里程碑 3 年份','plain_text', 'text',      'milestones', 7, '2022'),
    (t_id, s_milestone, 'milestone_3_title',   '里程碑 3 標題','plain_text', 'text',      'milestones', 8, '開設線上課程'),
    (t_id, s_milestone, 'milestone_3_desc',    '里程碑 3 說明','long_text',  'text_long', 'milestones', 9, '將訓練知識系統化，讓更多人能夠自主訓練'),
    (t_id, s_milestone, 'milestone_4_year',    '里程碑 4 年份','plain_text', 'text',      'milestones', 10, '2025'),
    (t_id, s_milestone, 'milestone_4_title',   '里程碑 4 標題','plain_text', 'text',      'milestones', 11, '累計 500+ 學員'),
    (t_id, s_milestone, 'milestone_4_desc',    '里程碑 4 說明','long_text',  'text_long', 'milestones', 12, '每一個改變的故事，都是我繼續前進的力量');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_gallery, 'gallery_title',     '區塊標題',  'plain_text', 'text',  'gallery', 0, '成果集錦'),
    (t_id, s_gallery, 'gallery_1_image',   '圖片 1',    'image',      'image', 'gallery', 1, NULL),
    (t_id, s_gallery, 'gallery_1_caption', '圖片 1 說明','plain_text', 'text', 'gallery', 2, ''),
    (t_id, s_gallery, 'gallery_2_image',   '圖片 2',    'image',      'image', 'gallery', 3, NULL),
    (t_id, s_gallery, 'gallery_2_caption', '圖片 2 說明','plain_text', 'text', 'gallery', 4, ''),
    (t_id, s_gallery, 'gallery_3_image',   '圖片 3',    'image',      'image', 'gallery', 5, NULL),
    (t_id, s_gallery, 'gallery_3_caption', '圖片 3 說明','plain_text', 'text', 'gallery', 6, '');

  INSERT INTO lp_template_fields (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, sort_order, default_value) VALUES
    (t_id, s_contact, 'contact_title',       '聯絡標題', 'plain_text', 'text',      'contact', 0, '想了解更多？'),
    (t_id, s_contact, 'contact_desc',        '聯絡說明', 'long_text',  'text_long', 'contact', 1, '不管你是好奇還是準備好了，歡迎直接聯絡我，一起聊聊你的目標。'),
    (t_id, s_contact, 'contact_button_text', '按鈕文字', 'plain_text', 'text',      'contact', 2, '傳訊息給我'),
    (t_id, s_contact, 'contact_button_url',  '按鈕連結', 'url',        'url',       'contact', 3, '/contact');
END $$;

COMMIT;
