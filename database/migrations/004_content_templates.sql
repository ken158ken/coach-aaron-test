-- ============================================================
-- Migration 004: 網站內容預設範本系統
-- 建立時間: 2026-02-12
-- 說明:
--   建立 content_templates 表，存放多組預設文案範本
--   管理員可在新增/編輯內容時快速套用範本
--   前端在 DB 無自定義內容時隨機取用範本作為 fallback
-- 資料來源: 教練雜資料.md (阿倫教官行銷素材)
-- ============================================================

-- =========================
-- 1. content_templates 範本表
-- =========================
CREATE TABLE IF NOT EXISTS content_templates (
    template_id   SERIAL PRIMARY KEY,
    content_key   VARCHAR(100) NOT NULL,          -- 對應 site_content.content_key
    template_name VARCHAR(200) NOT NULL,           -- 範本顯示名稱
    template_value TEXT NOT NULL DEFAULT '',        -- 範本文案內容
    sort_order    INT NOT NULL DEFAULT 0,          -- 排列順序
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_content_templates_key ON content_templates(content_key);

-- =========================
-- 2. hero_title 範本 (首頁主標語)
-- =========================
INSERT INTO content_templates (content_key, template_name, template_value, sort_order) VALUES
(
    'hero_title',
    '品牌定位型 - 私教變現',
    '私教變現\n用銷售心理學 月入八萬↑',
    1
),
(
    'hero_title',
    '專業權威型 - 十年實戰',
    '健身產業十年實戰\n把專業換成收入',
    2
),
(
    'hero_title',
    '數據成果型 - 130位教練',
    '成功協助 130 位教練\n年收突破七位數',
    3
),
(
    'hero_title',
    '激勵行動型 - 突破瓶頸',
    '打造 理想體態\n遇見更好的自己',
    4
),
(
    'hero_title',
    '痛點切入型 - 收入停滯',
    '專業換不到業績？\n讓教練職涯徹底翻轉',
    5
);

-- =========================
-- 3. hero_subtitle 範本 (首頁副標語)
-- =========================
INSERT INTO content_templates (content_key, template_name, template_value, sort_order) VALUES
(
    'hero_subtitle',
    '銷售心理學定位',
    '結合心理學知識和實務銷售經驗\n讓專業轉化為看得見的收入',
    1
),
(
    'hero_subtitle',
    '三大核心承諾',
    '穩定月業績 20 萬 × 學生自然續約 × 自媒體精準獲客',
    2
),
(
    'hero_subtitle',
    '專業教學導向',
    '專業一對一健身指導，量身打造訓練計畫\n科學化訓練 × 飲食規劃 × 心理建設',
    3
),
(
    'hero_subtitle',
    '溝通銷售導向',
    '教練最大的競爭力不在技術\n而在溝通、表達和行銷',
    4
),
(
    'hero_subtitle',
    '證照權威導向',
    'NSCA 美國肌力與體能 × TQUK 英國心理諮詢 × NLP 心理執行師',
    5
);

-- =========================
-- 4. about_coach 範本 (關於教練介紹)
-- =========================
INSERT INTO content_templates (content_key, template_name, template_value, sort_order) VALUES
(
    'about_coach',
    '完整經歷版',
    '在健身產業深耕 10 年，現任威豪健身總教官，帶領 50 人教練團隊。曾培訓超過 130 位教練年薪破百萬，累積教練培訓時數超過 1000 小時，主持百場企業內訓講座。持有 NSCA 美國肌力與體能、TQUK 英國心理諮詢師、NLP 心理執行師、Andaction 生活教練等專業認證。',
    1
),
(
    'about_coach',
    '銷售導向版',
    '我是阿倫教官，在健身產業 10 年，我發現教練最大的競爭力不在技術，而在溝通、表達和行銷。我們結合心理學知識和實務銷售經驗，讓專業轉化為看得見的收入。成功協助 130 位教練，用銷售心理學技巧，100 天內月入 8 萬以上。',
    2
),
(
    'about_coach',
    '體適能教學版',
    '擁有超過 10 年健身教學經驗，專注於體態雕塑、增肌減脂與運動表現提升。結合科學化訓練方法與個人化指導，幫助學員突破極限，達成目標。曾服務超過 500 位學員，是你健身路上最專業的夥伴。',
    3
),
(
    'about_coach',
    '多元背景版',
    '從前永慶房屋單月兩百萬業績的房產經紀人，到 2019 年全國健身模特兒冠軍，再到威豪健身總教官 — 阿倫教官以跨界實戰經驗，將銷售心理學融入教練培訓，八年健身房管理經驗，打造出獨一無二的教練養成系統。',
    4
),
(
    'about_coach',
    '精簡版',
    '阿倫教官，威豪健身總教官，帶領 50 人教練團隊。10 年健身產業實戰，培訓 130+ 教練年收破百萬，持有 NSCA、TQUK、NLP 國際認證。',
    5
);

-- ============================================================
-- 完成
-- ============================================================
