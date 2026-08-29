-- =============================================
-- Migration 010: 學員見證幻燈片 + 相片輪播（手動翻頁）
-- 執行前請確認 public.is_admin() 函數已存在（Migration 009）
-- =============================================

-- ===================================================
-- 一、學員見證幻燈片（自動輪播）
-- ===================================================

CREATE TABLE IF NOT EXISTS testimonial_slides (
  id          SERIAL       PRIMARY KEY,
  image_url   TEXT         NOT NULL,
  name        VARCHAR(50)  NOT NULL DEFAULT '',
  achievement VARCHAR(100)          DEFAULT '',
  quote       TEXT                  DEFAULT '',
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 全域設定（固定單列，id 永遠為 1）
CREATE TABLE IF NOT EXISTS testimonial_config (
  id           INT     PRIMARY KEY DEFAULT 1,
  interval_ms  INT     NOT NULL DEFAULT 4000,   -- 自動輪播間隔（毫秒）
  is_published BOOLEAN NOT NULL DEFAULT true,    -- 是否在首頁顯示
  CONSTRAINT testimonial_config_single_row CHECK (id = 1)
);

-- 初始化設定列（若已存在則跳過）
INSERT INTO testimonial_config (id, interval_ms, is_published)
  VALUES (1, 4000, true)
  ON CONFLICT (id) DO NOTHING;

-- ===================================================
-- 二、相片輪播（手動翻頁）
-- ===================================================

CREATE TABLE IF NOT EXISTS gallery_slides (
  id         SERIAL       PRIMARY KEY,
  image_url  TEXT         NOT NULL,
  caption    VARCHAR(200)          DEFAULT '',
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 全域設定（固定單列）
CREATE TABLE IF NOT EXISTS gallery_config (
  id           INT     PRIMARY KEY DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT gallery_config_single_row CHECK (id = 1)
);

INSERT INTO gallery_config (id, is_published)
  VALUES (1, true)
  ON CONFLICT (id) DO NOTHING;

-- ===================================================
-- 三、Row Level Security
-- ===================================================

ALTER TABLE testimonial_slides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_slides      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_config      ENABLE ROW LEVEL SECURITY;

-- 公開讀取（僅 is_active=true 的幻燈片）
CREATE POLICY "testimonial_slides_public_select"
  ON testimonial_slides FOR SELECT
  USING (is_active = true);

-- 管理員完整權限
CREATE POLICY "testimonial_slides_admin_all"
  ON testimonial_slides FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 設定：公開讀取（前端需要 interval_ms 和 is_published）
CREATE POLICY "testimonial_config_public_select"
  ON testimonial_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "testimonial_config_admin_all"
  ON testimonial_config FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 相片輪播：公開讀取
CREATE POLICY "gallery_slides_public_select"
  ON gallery_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "gallery_slides_admin_all"
  ON gallery_slides FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 相片輪播設定：公開讀取
CREATE POLICY "gallery_config_public_select"
  ON gallery_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "gallery_config_admin_all"
  ON gallery_config FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===================================================
-- 四、示範資料（使用 Cloudinary 圖片）
-- ===================================================

INSERT INTO testimonial_slides (image_url, name, achievement, quote, sort_order) VALUES
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471256/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_7_fap5ki.jpg',
    '小美', '3個月減脂12公斤',
    '跟著阿倫教練學會了正確的銷售方法，業績直接翻倍！以前怕開口說價格，現在自信滿滿。',
    1
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471255/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_8_r0asnz.jpg',
    '阿傑', '月收入從3萬提升至9萬',
    '教練的 NLP 技巧真的很實用，學員續課率從 50% 提升到 90%，收入穩定了很多。',
    2
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471252/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_13_evlvi4.jpg',
    '小雯', '半年培訓30位學員',
    '原本只是個普通教練，透過阿倫老師的課程，現在已有穩定學員群，還開始自己帶課程了。',
    3
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471253/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_10_irutga.jpg',
    '大明', '年收突破百萬',
    '最感謝的就是阿倫老師教的心理銷售技巧，讓我真正理解學員需求，而不只是賣課程。',
    4
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471254/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_9_fhuaqw.jpg',
    '小玲', '成功開設個人工作室',
    '以前在健身房都被業績壓著走，現在自己出來開工作室，完全靠阿倫老師教的方法建立口碑。',
    5
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471251/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_15_fu6wvc.jpg',
    '阿維', '課程售出率達95%',
    '銷售不再是壓力，反而成為我最享受的部分。阿倫老師讓我看見，好的教練也可以是好的銷售者。',
    6
  );

INSERT INTO gallery_slides (image_url, caption, sort_order) VALUES
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471250/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_3_oswqyt.jpg',
    '學員成果分享', 1
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471248/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_14_pmvdb3.jpg',
    '培訓現場記錄', 2
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471256/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_7_fap5ki.jpg',
    '教練成長歷程', 3
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471255/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_8_r0asnz.jpg',
    '實戰銷售演練', 4
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471252/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_13_evlvi4.jpg',
    '學員心得分享', 5
  ),
  (
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471253/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_10_irutga.jpg',
    '教練培訓合照', 6
  );
