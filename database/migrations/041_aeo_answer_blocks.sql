-- =====================================================
-- 041: AEO/GEO 答案區塊 + 來源流量量測
-- 請貼到 Supabase Dashboard SQL Editor 執行（冪等，可重跑）
-- =====================================================
--
-- 用途：
--   1) articles / courses 加「答案區塊」欄位，讓每一篇內容都能主動提供
--      AI 搜尋（ChatGPT / Perplexity / Google AI Overview 等）最容易引用的
--      結構化片段：一句話結論（answer_summary）、重點清單（key_points）、
--      FAQ（faq，前端用來產生 FAQPage JSON-LD）、站內關聯（related_*）。
--      中英各一組（*_en），空值時前端 fallback 中文（同 useLocalize 慣例）。
--
--   2) traffic_events：量測「AI 來源」到站流量（AEO/GEO 成效）。
--      ⚠️ 刻意不存 IP、不存 User-Agent、不設 cookie、不做跨站追蹤 ——
--      只存 referrer 的 host（去掉路徑與查詢字串），因此無個資（符合個資法）。
--      source_class 的判定在 backend/utils/trafficSource.ts（純函式）。
--
-- 未貼之前（程式已做 42703/PGRST204 容錯）：
--   - 讀取端：articles/courses API 照常回 200，新欄位一律回 null（不會 500）
--   - 寫入端：若送了新欄位 → 回 503 並明確提示「請先執行 migration 041」
--   - /api/track/pageview → 靜默回 204（42P01 不噴錯），後台流量頁為空
-- =====================================================

-- ── 1. articles 答案區塊 ──────────────────────────────
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS answer_summary       TEXT,
  ADD COLUMN IF NOT EXISTS answer_summary_en    TEXT,
  ADD COLUMN IF NOT EXISTS key_points           JSONB,   -- string[]（≤ 12 條，各 ≤ 200 字）
  ADD COLUMN IF NOT EXISTS key_points_en        JSONB,
  ADD COLUMN IF NOT EXISTS faq                  JSONB,   -- [{question,answer}]（≤ 10 題，純文字）
  ADD COLUMN IF NOT EXISTS faq_en               JSONB,
  ADD COLUMN IF NOT EXISTS related_article_ids  JSONB;   -- number[]（≤ 6 個 article_id）

-- 文章可掛一門主要課程（內部連結 / 轉換動線）
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS related_course_id    INTEGER
    REFERENCES courses(course_id) ON DELETE SET NULL;

-- ── 2. courses 答案區塊 ───────────────────────────────
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS answer_summary       TEXT,
  ADD COLUMN IF NOT EXISTS answer_summary_en    TEXT,
  ADD COLUMN IF NOT EXISTS key_points           JSONB,
  ADD COLUMN IF NOT EXISTS key_points_en        JSONB,
  ADD COLUMN IF NOT EXISTS faq                  JSONB,
  ADD COLUMN IF NOT EXISTS faq_en               JSONB,
  ADD COLUMN IF NOT EXISTS related_article_ids  JSONB;

COMMENT ON COLUMN articles.answer_summary IS
  'AEO：一句話直接回答本文主題（≤ 300 字純文字），供 AI 摘要與 meta description 引用';
COMMENT ON COLUMN articles.faq IS
  'AEO：[{question,answer}] 純文字，前端轉 FAQPage JSON-LD；≤ 10 題';
COMMENT ON COLUMN courses.answer_summary IS
  'AEO：一句話說明這門課解決什麼問題（≤ 300 字純文字）';

-- ── 3. traffic_events：來源分類流量（無 PII、無 cookie） ──
CREATE TABLE IF NOT EXISTS traffic_events (
  id            BIGSERIAL PRIMARY KEY,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  day           DATE NOT NULL,              -- 以 Asia/Taipei（UTC+8）的日期計
  path          TEXT NOT NULL,              -- 站內路徑（含 query 已由前端去除）
  referrer_host TEXT,                       -- 只存 host，NULL = 直接進站
  source_class  TEXT NOT NULL
    CHECK (source_class IN ('ai', 'search', 'social', 'direct', 'other')),
  lang          TEXT
);

CREATE INDEX IF NOT EXISTS idx_traffic_events_day_source
  ON traffic_events (day, source_class);

CREATE INDEX IF NOT EXISTS idx_traffic_events_day_referrer
  ON traffic_events (day, referrer_host);

COMMENT ON TABLE traffic_events IS
  'AEO/GEO 來源量測：每個頁面瀏覽一列。刻意不存 IP/UA/cookie，referrer 只留 host，無個資。';
