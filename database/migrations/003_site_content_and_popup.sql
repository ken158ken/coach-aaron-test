-- ============================================================
-- Migration 003: 網站內容管理 + 首頁彈窗系統
-- 建立時間: 2026-02-11
-- 說明:
--   1. site_content - 網站靜態文案管理 (首頁標語、關於教練等)
--   2. site_popups  - 首頁自定義彈窗 (管理員可編輯 HTML 內容)
-- ============================================================

-- =========================
-- 1. site_content 網站內容表
-- =========================
CREATE TABLE IF NOT EXISTS site_content (
    content_id    SERIAL PRIMARY KEY,
    content_key   VARCHAR(100) UNIQUE NOT NULL,   -- 唯一識別碼 (hero_title, hero_subtitle, about_coach...)
    content_name  VARCHAR(200) NOT NULL,           -- 顯示名稱 (首頁標語, 首頁副標...)
    content_value TEXT NOT NULL DEFAULT '',         -- 文案內容 (純文字或 HTML)
    content_type  VARCHAR(20) NOT NULL DEFAULT 'text',  -- 'text' | 'html' | 'json'
    sort_order    INT NOT NULL DEFAULT 0,          -- 排列順序
    is_active     BOOLEAN NOT NULL DEFAULT true,   -- 是否啟用
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 觸發器：自動更新 updated_at
CREATE TRIGGER set_site_content_updated_at
    BEFORE UPDATE ON site_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(content_key);
CREATE INDEX IF NOT EXISTS idx_site_content_sort ON site_content(sort_order);

-- 預設資料
INSERT INTO site_content (content_key, content_name, content_value, content_type, sort_order) VALUES
    ('hero_title',    '首頁標語', '打造理想體態，遇見更好的自己',               'text', 1),
    ('hero_subtitle', '首頁副標', '專業一對一健身指導，量身打造訓練計畫',         'text', 2),
    ('about_coach',   '關於教練', '擁有超過 10 年健身教學經驗，專精肌力訓練、體態雕塑與運動營養規劃。曾服務超過 500 位學員，幫助他們達成健身目標。', 'text', 3)
ON CONFLICT (content_key) DO NOTHING;

-- =========================
-- 2. site_popups 首頁彈窗表
-- =========================
CREATE TABLE IF NOT EXISTS site_popups (
    popup_id      SERIAL PRIMARY KEY,
    popup_title   VARCHAR(200) NOT NULL DEFAULT '',  -- 彈窗標題
    popup_content TEXT NOT NULL DEFAULT '',           -- HTML 內容 (由富文本編輯器產生)
    is_active     BOOLEAN NOT NULL DEFAULT false,    -- 是否啟用 (同時只能有一個啟用)
    show_once     BOOLEAN NOT NULL DEFAULT true,     -- 每位用戶只顯示一次 (localStorage 記錄)
    start_date    TIMESTAMPTZ,                        -- 排程開始時間 (NULL = 立即)
    end_date      TIMESTAMPTZ,                        -- 排程結束時間 (NULL = 永久)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 觸發器：自動更新 updated_at
CREATE TRIGGER set_site_popups_updated_at
    BEFORE UPDATE ON site_popups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 完成
-- ============================================================
