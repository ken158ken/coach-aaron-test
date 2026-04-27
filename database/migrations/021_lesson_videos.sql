-- =============================================
-- Migration 021: 教學影片（Loom 為主）
-- 建立時間: 2026-04-27
--
-- 跟舊的 videos 表（短影音 / Reels 牆）分開：
--   - videos：YouTube / IG / TikTok 短影音，純列表
--   - lesson_videos：較長的教學影片（含逐字稿），目前只支援 Loom
-- =============================================

CREATE TABLE IF NOT EXISTS lesson_videos (
  id                SERIAL       PRIMARY KEY,
  title             TEXT         NOT NULL,
  title_en          TEXT,
  description       TEXT,
  description_en    TEXT,
  -- Loom URL parsing
  provider          TEXT         NOT NULL DEFAULT 'loom',
  loom_id           TEXT         NOT NULL,           -- 解析自 share URL
  loom_url          TEXT         NOT NULL,           -- 原始 URL（給後台/編輯時參考）
  -- Cover / metadata
  thumbnail_url     TEXT,
  category          TEXT,
  category_en       TEXT,
  keywords          TEXT,                            -- 跟 articles.article_keywords 同樣 comma-separated
  duration_seconds  INTEGER,
  -- Transcript：parser 把 VTT/SRT 拆成 [{start: 1.5, end: 3.2, text: "..."}, ...]
  -- start/end 都是「秒」（小數）
  transcript        JSONB,
  transcript_lang   TEXT         DEFAULT 'zh-TW',
  -- 顯示控制
  is_published      BOOLEAN      NOT NULL DEFAULT true,
  sort_order        INTEGER      NOT NULL DEFAULT 0,
  view_count        INTEGER      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT lesson_videos_provider_check CHECK (provider IN ('loom'))
);

CREATE INDEX IF NOT EXISTS idx_lesson_published_sort
  ON lesson_videos(is_published, sort_order, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_loom_id
  ON lesson_videos(loom_id)
  WHERE deleted_at IS NULL;

-- updated_at trigger（沿用現有 set_updated_at function；如果沒有就跳過）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS lesson_videos_set_updated_at ON lesson_videos;
    CREATE TRIGGER lesson_videos_set_updated_at
      BEFORE UPDATE ON lesson_videos
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- RLS — 所有讀寫經 backend service_role；admin 可在 SQL editor 直接管
ALTER TABLE lesson_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_admin_all" ON lesson_videos;
CREATE POLICY "lesson_admin_all" ON lesson_videos FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- 種一筆：客戶提供的「心理學導向教練諮詢流程」
-- （後台一啟用就可以馬上看到一筆 demo）
-- =====================================================
INSERT INTO lesson_videos (
  title,
  description,
  provider,
  loom_id,
  loom_url,
  category,
  keywords,
  is_published,
  sort_order
) VALUES (
  '心理學導向諮詢流程',
  '建立信任、挖掘動機、價值變現 — 一套心理學導向的體驗課諮詢流程，從建立信任開始，挖掘學員的需求與生存動機，最後體現專業價值。',
  'loom',
  'd3479f55223e473b9ddef8b8d74c9dd3',
  'https://www.loom.com/share/d3479f55223e473b9ddef8b8d74c9dd3',
  '教練養成',
  '心理學,諮詢流程,體驗課,教練培訓',
  true,
  0
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 完成
-- =============================================
