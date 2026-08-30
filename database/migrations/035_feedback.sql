-- 035: 意見反饋（照抄歐捷 ERP feedback，改為 學員↔教練 兩角色）
-- 結構：反饋串 → 訊息（一來一往）→ 圖片（螢幕截圖原檔不壓縮）
-- 冪等：IF NOT EXISTS，可重複執行。貼到 Supabase Dashboard SQL Editor 執行。
-- 圖片存 Supabase Storage 私有 bucket `feedback-images`（由程式以 REST 建立），
-- 經後端 /api/feedback/images/:id/file 驗證身分後串流，不做任何壓縮/裁切。

CREATE TABLE IF NOT EXISTS feedback_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  -- waiting_member 等待學員回應 / waiting_coach 等待教練回應 / in_progress 處理中 / resolved 已完成
  status text NOT NULL DEFAULT 'waiting_coach'
    CHECK (status IN ('waiting_member', 'waiting_coach', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES feedback_threads(id) ON DELETE CASCADE,
  -- member 學員 / coach 教練
  author_role text NOT NULL CHECK (author_role IN ('member', 'coach')),
  author_user_id integer REFERENCES users(user_id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES feedback_messages(id) ON DELETE CASCADE,
  -- bucket 內路徑：{thread_id}/{ts}_{原檔名}
  file_path text NOT NULL,
  original_name text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT '',
  size integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_threads_user ON feedback_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_threads_status ON feedback_threads(status);
CREATE INDEX IF NOT EXISTS idx_feedback_threads_updated ON feedback_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_thread ON feedback_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_images_message ON feedback_images(message_id);

-- RLS：全部走後端 service role，前端不直連
ALTER TABLE feedback_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_images ENABLE ROW LEVEL SECURITY;
