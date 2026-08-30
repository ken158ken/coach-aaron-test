-- ══════════════════════════════════════════════════════════
-- 036_lp_leads.sql — Landing Page 表單報名資料
--
-- 背景：站上原本沒有任何「可長期保存 + 後台可查」的表單收件機制。
--   /api/contact  只寄信、不落地
--   whispers      message 只有 varchar(100)，且 30 天自動刪除
-- 「阿倫指定版面」的報名表單有 12 題（含複選與開放題），兩者都塞不下，
-- 因此新增本表，用 jsonb 存完整逐題答案，另存一份人類可讀摘要。
--
-- 由 POST /api/landing/leads（公開、限流、含蜜罐）寫入。
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lp_leads (
    id              BIGSERIAL   PRIMARY KEY,

    -- 來源頁面（專案被刪除仍保留報名資料，故為 SET NULL）
    project_id      BIGINT      REFERENCES lp_projects(id) ON DELETE SET NULL,
    project_slug    VARCHAR(255),
    project_name    VARCHAR(255),

    -- 聯絡資訊（拉出來方便後台列表與搜尋）
    name            VARCHAR(60)  NOT NULL,
    phone           VARCHAR(40)  NOT NULL,
    email           VARCHAR(254),
    line_id         VARCHAR(100),
    instagram       VARCHAR(100),

    -- 完整逐題答案：{ "題目": ["選項A","選項B"], "開放題": "文字" }
    answers         JSONB        NOT NULL DEFAULT '{}'::JSONB,
    -- 人類可讀摘要（信件內容與後台詳情共用，含換行）
    summary         TEXT         NOT NULL DEFAULT '',

    -- 跟進狀態，供教練標記處理進度
    status          VARCHAR(32)  NOT NULL DEFAULT 'new',
    coach_note      TEXT,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT lp_leads_status_chk
        CHECK (status IN ('new', 'contacted', 'booked', 'closed', 'spam'))
);

COMMENT ON TABLE  lp_leads IS 'Landing Page 表單報名（不自動過期，需人工處理）';
COMMENT ON COLUMN lp_leads.answers IS '完整逐題答案 JSON，key 為題目文字';
COMMENT ON COLUMN lp_leads.summary IS '逐行摘要，教練端直接閱讀用';

CREATE INDEX IF NOT EXISTS idx_lp_leads_created  ON lp_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_leads_project  ON lp_leads (project_id);
CREATE INDEX IF NOT EXISTS idx_lp_leads_status   ON lp_leads (status);

-- updated_at 自動更新（沿用既有 trigger function；沒有就略過）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_lp_leads_updated_at ON lp_leads;
    CREATE TRIGGER trg_lp_leads_updated_at
      BEFORE UPDATE ON lp_leads
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ── RLS：與 whispers 相同，只有 service_role（後端）能寫，管理員可讀 ──
ALTER TABLE lp_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_leads_service_all" ON lp_leads;
CREATE POLICY "lp_leads_service_all" ON lp_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "lp_leads_admin_read" ON lp_leads;
CREATE POLICY "lp_leads_admin_read" ON lp_leads
  FOR SELECT TO authenticated USING (public.is_admin());
