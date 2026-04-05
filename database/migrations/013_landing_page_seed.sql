-- ============================================================
-- Migration 013: Landing Page 種子資料
-- 建立時間: 2026-04-04
-- 說明:
--   插入 Aaron 教練課程通用模板 + 兩個示範專案：
--     1. 2026 春季特訓班 (2026-spring-bootcamp)
--     2. 企業員工健康方案 (corporate-wellness)
--
-- 使用方式：在 Supabase SQL Editor 直接執行此檔案。
-- 安全：所有 INSERT 均使用 ON CONFLICT DO NOTHING，可重複執行。
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────
-- 以匿名函數處理 ID 依賴關係
-- ─────────────────────────────────────────────────────────
DO $$
DECLARE
    tmpl_id       BIGINT;
    sect_hero_id  BIGINT;
    sect_feat_id  BIGINT;
    sect_test_id  BIGINT;
    sect_cta_id   BIGINT;
    proj1_id      BIGINT;
    proj2_id      BIGINT;
BEGIN

-- ============================================================
-- 1. 模板：Aaron 教練課程通用模板
-- ============================================================
INSERT INTO lp_templates (
    template_code,
    template_slug,
    page_kind,
    category_tags,
    page_layout,
    animation_type,
    brand_name,
    html_title,
    color_vars,
    is_active,
    is_featured,
    sort_order
) VALUES (
    'AARON_GENERIC_001',
    'aaron-generic',
    'brand_narrative',
    ARRAY['fitness', 'coaching', 'dark-theme'],
    'standard',
    'none',
    'Aaron 教練',
    'Aaron 教練專業健身指導',
    '{"primary": "#C9A96E", "bg": "#0a0a0a", "text": "#ffffff"}'::JSONB,
    TRUE,
    TRUE,
    1
) ON CONFLICT (template_code) DO NOTHING;

SELECT id INTO tmpl_id FROM lp_templates WHERE template_code = 'AARON_GENERIC_001';

-- ============================================================
-- 2. 區塊定義（Sections）
-- ============================================================
INSERT INTO lp_template_sections
    (template_id, section_key, section_name, section_type, layout_cols, sort_order)
VALUES
    (tmpl_id, 'hero',         'Hero 主視覺',   'hero',         1, 10),
    (tmpl_id, 'features',     '核心特色',       'features',     3, 20),
    (tmpl_id, 'testimonials', '學員見證',       'testimonials', 2, 30),
    (tmpl_id, 'cta',          '行動呼籲',       'cta',          1, 40)
ON CONFLICT (template_id, section_key) DO NOTHING;

SELECT id INTO sect_hero_id FROM lp_template_sections WHERE template_id = tmpl_id AND section_key = 'hero';
SELECT id INTO sect_feat_id FROM lp_template_sections WHERE template_id = tmpl_id AND section_key = 'features';
SELECT id INTO sect_test_id FROM lp_template_sections WHERE template_id = tmpl_id AND section_key = 'testimonials';
SELECT id INTO sect_cta_id  FROM lp_template_sections WHERE template_id = tmpl_id AND section_key = 'cta';

-- ============================================================
-- 3. 欄位定義（Fields）
-- ============================================================

-- ─── Hero 區塊 ───────────────────────────────────────────
INSERT INTO lp_template_fields
    (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, default_value, sort_order, is_required, is_visible)
VALUES
    (tmpl_id, sect_hero_id, 'hero_title',
     '主標題', 'plain_text', 'string', 'hero',
     'Aaron 教練專業健身訓練', 10, TRUE, TRUE),

    (tmpl_id, sect_hero_id, 'hero_subtitle',
     '副標題', 'plain_text', 'string', 'hero',
     '讓身體成為你最強大的競爭力', 20, FALSE, TRUE),

    (tmpl_id, sect_hero_id, 'hero_description',
     '描述文字', 'long_text', 'text', 'hero',
     '專業私人教練，為你量身打造最適合的訓練方案，從基礎體能到進階運動表現。', 30, FALSE, TRUE),

    (tmpl_id, sect_hero_id, 'hero_cta_text',
     'CTA 按鈕文字', 'plain_text', 'string', 'hero',
     '立即報名', 40, FALSE, TRUE),

    (tmpl_id, sect_hero_id, 'hero_cta_url',
     'CTA 按鈕連結', 'url', 'url', 'hero',
     '/contact', 50, FALSE, TRUE)
ON CONFLICT (template_id, field_key) DO NOTHING;

-- ─── Features 區塊 ──────────────────────────────────────
INSERT INTO lp_template_fields
    (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, default_value, sort_order, is_visible)
VALUES
    (tmpl_id, sect_feat_id, 'feature_1_title',
     '特色 1 標題', 'plain_text', 'string', 'features',
     '個人化訓練計畫', 10, TRUE),

    (tmpl_id, sect_feat_id, 'feature_1_desc',
     '特色 1 描述', 'long_text', 'text', 'features',
     '根據您的體能基礎、目標與時間，制定專屬計畫。', 20, TRUE),

    (tmpl_id, sect_feat_id, 'feature_2_title',
     '特色 2 標題', 'plain_text', 'string', 'features',
     '科學化營養指導', 30, TRUE),

    (tmpl_id, sect_feat_id, 'feature_2_desc',
     '特色 2 描述', 'long_text', 'text', 'features',
     '結合運動訓練與飲食規劃，加速達成目標。', 40, TRUE),

    (tmpl_id, sect_feat_id, 'feature_3_title',
     '特色 3 標題', 'plain_text', 'string', 'features',
     '持續追蹤與調整', 50, TRUE),

    (tmpl_id, sect_feat_id, 'feature_3_desc',
     '特色 3 描述', 'long_text', 'text', 'features',
     '每週檢視訓練數據，及時調整計畫確保持續進步。', 60, TRUE)
ON CONFLICT (template_id, field_key) DO NOTHING;

-- ─── Testimonials 區塊 ──────────────────────────────────
INSERT INTO lp_template_fields
    (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, default_value, sort_order, is_visible)
VALUES
    (tmpl_id, sect_test_id, 'testimonial_1_name',
     '見證 1 姓名', 'plain_text', 'string', 'testimonials',
     '王小明', 10, TRUE),

    (tmpl_id, sect_test_id, 'testimonial_1_role',
     '見證 1 身份', 'plain_text', 'string', 'testimonials',
     '上班族，訓練 6 個月', 20, TRUE),

    (tmpl_id, sect_test_id, 'testimonial_1_text',
     '見證 1 內容', 'long_text', 'text', 'testimonials',
     '跟 Aaron 教練訓練半年後，體脂從 28% 降到 18%，整個人精神狀態都變好了。', 30, TRUE),

    (tmpl_id, sect_test_id, 'testimonial_2_name',
     '見證 2 姓名', 'plain_text', 'string', 'testimonials',
     '林美玲', 40, TRUE),

    (tmpl_id, sect_test_id, 'testimonial_2_role',
     '見證 2 身份', 'plain_text', 'string', 'testimonials',
     '媽媽族，訓練 3 個月', 50, TRUE),

    (tmpl_id, sect_test_id, 'testimonial_2_text',
     '見證 2 內容', 'long_text', 'text', 'testimonials',
     '產後恢復訓練讓我重拾自信，Aaron 教練非常有耐心，強力推薦！', 60, TRUE)
ON CONFLICT (template_id, field_key) DO NOTHING;

-- ─── CTA 區塊 ───────────────────────────────────────────
INSERT INTO lp_template_fields
    (template_id, section_id, field_key, field_label, field_kind, data_type, content_group, default_value, sort_order, is_visible)
VALUES
    (tmpl_id, sect_cta_id, 'cta_title',
     'CTA 標題', 'plain_text', 'string', 'cta',
     '準備好開始了嗎？', 10, TRUE),

    (tmpl_id, sect_cta_id, 'cta_description',
     'CTA 描述', 'long_text', 'text', 'cta',
     '立即預約免費體驗課，讓 Aaron 教練為您評估目前體能狀況。', 20, TRUE),

    (tmpl_id, sect_cta_id, 'cta_button_text',
     'CTA 按鈕文字', 'plain_text', 'string', 'cta',
     '預約免費體驗', 30, TRUE),

    (tmpl_id, sect_cta_id, 'cta_button_url',
     'CTA 按鈕連結', 'url', 'url', 'cta',
     '/contact', 40, TRUE)
ON CONFLICT (template_id, field_key) DO NOTHING;

-- ============================================================
-- 4. 專案 1：2026 春季特訓班
-- ============================================================
INSERT INTO lp_projects (
    template_id, project_code, project_name, locale,
    custom_slug, status, published_at,
    seo_title, seo_description
) VALUES (
    tmpl_id,
    'LP_SPRING_2026',
    '2026 春季特訓班 — 限時早鳥優惠',
    'zh-Hant',
    '2026-spring-bootcamp',
    'published',
    NOW(),
    '2026 春季特訓班 - 早鳥 85 折 | Aaron 教練',
    '6 週密集訓練，報名享 85 折＋免費體適能評估。限時優惠，名額有限！'
) ON CONFLICT (project_code) DO NOTHING;

SELECT id INTO proj1_id FROM lp_projects WHERE project_code = 'LP_SPRING_2026';

-- 專案 1 欄位值
INSERT INTO lp_project_field_values (project_id, field_id, value_text, sort_order)
SELECT
    proj1_id,
    f.id,
    vals.value_text,
    0
FROM (VALUES
    ('hero_title',          '2026 春季特訓班 — 限時早鳥優惠'),
    ('hero_subtitle',       '6 週密集訓練 · 早鳥享 85 折'),
    ('hero_description',    '春季限定課程，完整 6 週密集訓練計畫。報名即享早鳥 85 折優惠，並贈送免費體適能評估（價值 NT$1,500）。名額有限，手腳要快！'),
    ('hero_cta_text',       '立即搶先報名'),
    ('hero_cta_url',        '/contact'),
    ('feature_1_title',     '6 週密集課程'),
    ('feature_1_desc',      '每週 3 次、共 18 堂課的系統化訓練，循序漸進提升體能與肌力。'),
    ('feature_2_title',     '早鳥 85 折優惠'),
    ('feature_2_desc',      '限時優惠！3 月底前完成報名，享 85 折早鳥價，省下數千元。'),
    ('feature_3_title',     '免費體適能評估'),
    ('feature_3_desc',      '隨課程附贈完整體適能評估（市價 NT$1,500），了解自己的起點與目標。'),
    ('testimonial_1_name',  '陳建宏'),
    ('testimonial_1_role',  '工程師，上梯特訓班'),
    ('testimonial_1_text',  '春季班讓我在 6 週內瘦了 5 公斤，體力也大幅提升！每次訓練都很紮實，非常值得報名。'),
    ('testimonial_2_name',  '劉雅婷'),
    ('testimonial_2_role',  '設計師，挑戰體態改造'),
    ('testimonial_2_text',  '原本以為 6 週很短，但 Aaron 教練安排得很有系統，完課後馬甲線初現，超開心！'),
    ('cta_title',           '名額有限，立即報名春季特訓班'),
    ('cta_description',     '早鳥優惠截止日期：2026 年 3 月底。完成報名後將有專人聯繫安排課表與體測時間。'),
    ('cta_button_text',     '馬上搶先報名'),
    ('cta_button_url',      '/contact')
) AS vals(field_key, value_text)
JOIN lp_template_fields f
    ON f.template_id = tmpl_id AND f.field_key = vals.field_key
ON CONFLICT (project_id, field_id, sort_order)
DO UPDATE SET value_text = EXCLUDED.value_text;

-- ============================================================
-- 5. 專案 2：企業員工健康方案
-- ============================================================
INSERT INTO lp_projects (
    template_id, project_code, project_name, locale,
    custom_slug, status, published_at,
    seo_title, seo_description
) VALUES (
    tmpl_id,
    'LP_CORP_WELLNESS',
    '企業員工健康方案',
    'zh-Hant',
    'corporate-wellness',
    'published',
    NOW(),
    '企業員工健康方案 | Aaron 教練',
    '客製化團體課程，提升團隊體能與工作效率。企業專案歡迎洽詢。'
) ON CONFLICT (project_code) DO NOTHING;

SELECT id INTO proj2_id FROM lp_projects WHERE project_code = 'LP_CORP_WELLNESS';

-- 專案 2 欄位值
INSERT INTO lp_project_field_values (project_id, field_id, value_text, sort_order)
SELECT
    proj2_id,
    f.id,
    vals.value_text,
    0
FROM (VALUES
    ('hero_title',          '企業員工健康方案'),
    ('hero_subtitle',       '打造高效能工作團隊'),
    ('hero_description',    '客製化企業健康計畫，為您的團隊提升體能、改善工作效率。提供到府授課、彈性排程，讓健康融入日常工作。'),
    ('hero_cta_text',       '立即洽詢方案'),
    ('hero_cta_url',        '/contact'),
    ('feature_1_title',     '客製化團體課程'),
    ('feature_1_desc',      '根據員工體能基礎與公司需求，設計最合適的團體訓練方案，從暖身到核心訓練一應俱全。'),
    ('feature_2_title',     '彈性排課，到府授課'),
    ('feature_2_desc',      '配合公司時間提供午休、下班後等彈性時段，可至貴公司場地或指定健身房進行。'),
    ('feature_3_title',     '員工健康追蹤報告'),
    ('feature_3_desc',      '定期評估員工體能狀況並提供書面分析報告，具體呈現企業健康投資的成效。'),
    ('testimonial_1_name',  '張總監'),
    ('testimonial_1_role',  '科技公司 HR 總監'),
    ('testimonial_1_text',  '導入 Aaron 教練的企業健康方案後，員工出勤率明顯提升，工作精神也更好，CP 值非常高！'),
    ('testimonial_2_name',  '李工程師'),
    ('testimonial_2_role',  '科技公司員工'),
    ('testimonial_2_text',  '公司的午休健身課讓我從零基礎開始，三個月後體重少了 4 公斤，下午工作效率提升好多。'),
    ('cta_title',           '為您的團隊打造健康計畫'),
    ('cta_description',     '歡迎來電或留言洽詢，我們將依貴公司需求提供客製化報價方案，並安排免費試課。'),
    ('cta_button_text',     '立即洽詢'),
    ('cta_button_url',      '/contact')
) AS vals(field_key, value_text)
JOIN lp_template_fields f
    ON f.template_id = tmpl_id AND f.field_key = vals.field_key
ON CONFLICT (project_id, field_id, sort_order)
DO UPDATE SET value_text = EXCLUDED.value_text;

END $$;

COMMIT;
