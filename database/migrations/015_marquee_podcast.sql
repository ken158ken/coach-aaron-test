-- =============================================
-- Migration 015: 認證/成果 Marquee + Podcast 單集入表
-- 建立時間: 2026-04-24
--
-- 說明：
--   把原本存在 site_content 的 JSON 陣列 (marquee_certs / marquee_stats /
--   podcast_episodes) 拆到獨立的正規化表，讓非工程師也能在 admin UI
--   用表單新增/編輯每一筆，而不是手改 JSON。
--
-- 執行順序：
--   1. 建 marquee_items / podcast_episodes 兩張表
--   2. 從現有 site_content JSON 把資料搬進新表（ordinality 即 sort_order）
--   3. 刪除 site_content 中對應的 3 個 json row
--   4. 套用 RLS 政策（仿 testimonial_slides）
-- =============================================

-- =====================================================
-- 一、認證 / 成果 Marquee（合併一表，用 type 區分）
-- =====================================================

CREATE TABLE IF NOT EXISTS marquee_items (
  id         SERIAL       PRIMARY KEY,
  type       VARCHAR(10)  NOT NULL CHECK (type IN ('cert', 'stat')),
  icon       VARCHAR(20)  NOT NULL DEFAULT '',   -- emoji；主要給 cert 使用，stat 可留空
  label      VARCHAR(100) NOT NULL,              -- 主文字：cert='NSCA-CPT' / stat='130+'
  sub        VARCHAR(200)          DEFAULT '',   -- 副文字：cert='美國體能協會認證' / stat='培訓教練人次'
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marquee_items_type_sort
  ON marquee_items(type, sort_order);

-- =====================================================
-- 二、Podcast 單集
-- =====================================================

CREATE TABLE IF NOT EXISTS podcast_episodes (
  id               SERIAL       PRIMARY KEY,
  title            VARCHAR(200) NOT NULL DEFAULT '',
  description      VARCHAR(500)          DEFAULT '',   -- 卡片預覽用短敘述
  full_description TEXT                  DEFAULT '',   -- 展開後完整介紹
  duration         VARCHAR(20)           DEFAULT '',   -- 例: '45:30'
  episode_date     VARCHAR(20)           DEFAULT '',   -- 以字串存，讓 admin 自由填 (e.g. '2024-01-15')
  category         VARCHAR(30)  NOT NULL DEFAULT 'training'
                     CHECK (category IN ('training', 'nutrition', 'mindset')),
  sort_order       INT          NOT NULL DEFAULT 0,
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_podcast_episodes_sort
  ON podcast_episodes(sort_order);

-- =====================================================
-- 三、從 site_content 搬資料（只在新表還是空的時才搬，冪等）
-- =====================================================

-- 3.1 marquee_certs -> marquee_items (type='cert')
INSERT INTO marquee_items (type, icon, label, sub, sort_order)
SELECT
  'cert',
  COALESCE(item->>'icon', ''),
  COALESCE(item->>'label', ''),
  COALESCE(item->>'sub', ''),
  ord::INT
FROM site_content sc,
     jsonb_array_elements(sc.content_value::jsonb) WITH ORDINALITY AS t(item, ord)
WHERE sc.content_key = 'marquee_certs'
  AND sc.content_type = 'json'
  AND NOT EXISTS (SELECT 1 FROM marquee_items WHERE type = 'cert');

-- 3.2 marquee_stats -> marquee_items (type='stat')
--    stat 在前端是 {value, label}，對應到 DB 的 {label, sub}
INSERT INTO marquee_items (type, icon, label, sub, sort_order)
SELECT
  'stat',
  '',
  COALESCE(item->>'value', ''),
  COALESCE(item->>'label', ''),
  ord::INT
FROM site_content sc,
     jsonb_array_elements(sc.content_value::jsonb) WITH ORDINALITY AS t(item, ord)
WHERE sc.content_key = 'marquee_stats'
  AND sc.content_type = 'json'
  AND NOT EXISTS (SELECT 1 FROM marquee_items WHERE type = 'stat');

-- 3.3 podcast_episodes (site_content) -> podcast_episodes (新表)
INSERT INTO podcast_episodes (
  title, description, full_description, duration, episode_date, category, sort_order
)
SELECT
  COALESCE(item->>'title', ''),
  COALESCE(item->>'description', ''),
  COALESCE(item->>'fullDescription', ''),
  COALESCE(item->>'duration', ''),
  COALESCE(item->>'date', ''),
  COALESCE(NULLIF(item->>'category', ''), 'training'),
  ord::INT
FROM site_content sc,
     jsonb_array_elements(sc.content_value::jsonb) WITH ORDINALITY AS t(item, ord)
WHERE sc.content_key = 'podcast_episodes'
  AND sc.content_type = 'json'
  AND NOT EXISTS (SELECT 1 FROM podcast_episodes);

-- =====================================================
-- 四、刪除 site_content 中已搬家的 JSON row
-- =====================================================
DELETE FROM site_content
WHERE content_key IN ('marquee_certs', 'marquee_stats', 'podcast_episodes');

-- =====================================================
-- 五、Row Level Security
-- =====================================================

ALTER TABLE marquee_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes  ENABLE ROW LEVEL SECURITY;

-- 公開讀取（僅 is_active=true）
DROP POLICY IF EXISTS "marquee_items_public_select" ON marquee_items;
CREATE POLICY "marquee_items_public_select"
  ON marquee_items FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "marquee_items_admin_all" ON marquee_items;
CREATE POLICY "marquee_items_admin_all"
  ON marquee_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "podcast_episodes_public_select" ON podcast_episodes;
CREATE POLICY "podcast_episodes_public_select"
  ON podcast_episodes FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "podcast_episodes_admin_all" ON podcast_episodes;
CREATE POLICY "podcast_episodes_admin_all"
  ON podcast_episodes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 完成
-- =====================================================
