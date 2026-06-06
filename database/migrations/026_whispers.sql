-- Migration 026: 說悄悄話功能
-- 非登入訪客可留下簡短私訊（100字以內），30天後自動過期
-- 白名單管理員可在後台唯讀查看

CREATE TABLE IF NOT EXISTS whispers (
  whisper_id  serial PRIMARY KEY,
  name        varchar(50)  NOT NULL,
  contact     varchar(100) NOT NULL,   -- email 或台灣手機（前端/後端雙重驗證）
  message     varchar(100) NOT NULL,
  ip_hash     text,                    -- SHA-256(IP)，不儲存原始 IP
  created_at  timestamptz  NOT NULL DEFAULT now(),
  expires_at  timestamptz  NOT NULL DEFAULT (now() + interval '30 days')
);

-- 每日 cron 清除過期悄悄話（在 chatCron.ts 一併處理）
CREATE INDEX IF NOT EXISTS idx_whispers_expires_at ON whispers(expires_at);

-- RLS：只讓後端 service-role 存取（前端透過 API，不直接查）
ALTER TABLE whispers ENABLE ROW LEVEL SECURITY;
-- service_role 可讀寫（後端使用）
CREATE POLICY "service_role_all" ON whispers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
