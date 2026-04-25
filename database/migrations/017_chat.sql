-- =============================================
-- Migration 017: 聊天系統（1v1 DM + 群組） + 在線狀態 + admin display_name
-- 建立時間: 2026-04-25
--
-- 範圍：
--   1. admin_whitelist 加 display_name（顯示給客戶看的 admin 名稱）
--   2. chat_conversations    — 對話實體（DM / 群組）
--   3. chat_participants     — 參與者
--   4. chat_messages         — 訊息（含 7 天 expires_at）
--   5. user_presence         — 在線心跳
--   6. Storage bucket chat-images（可選圖片，5MB，7 天清理）
-- =============================================

-- =====================================================
-- 0. admin_whitelist 顯示名稱
-- =====================================================
ALTER TABLE admin_whitelist
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(50) DEFAULT '';
COMMENT ON COLUMN admin_whitelist.display_name
  IS '客戶面顯示名稱（如：Aaron 教練、小恩・網站管理員）';

-- =====================================================
-- 1. chat_conversations — UUID 是因為要當 Supabase Realtime channel 名稱
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(10)  NOT NULL CHECK (type IN ('dm','group')),
  title           VARCHAR(200) NOT NULL DEFAULT '',
  created_by      INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_last_msg
  ON chat_conversations(last_message_at DESC);

-- =====================================================
-- 2. chat_participants
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_participants (
  id              SERIAL       PRIMARY KEY,
  conversation_id UUID         NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id         INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role            VARCHAR(10)  NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  joined_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_read_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_part_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_part_conv ON chat_participants(conversation_id);

-- =====================================================
-- 3. chat_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id              SERIAL       PRIMARY KEY,
  conversation_id UUID         NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content         TEXT                  DEFAULT '',
  image_url       TEXT,                                   -- public URL
  image_path      TEXT,                                   -- bucket 內路徑（清理用）
  expires_at      TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CHECK (content <> '' OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_msg_conv_created
  ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_expires ON chat_messages(expires_at);

-- 訊息插入時自動更新對話的 last_message_at
CREATE OR REPLACE FUNCTION public.touch_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_msg_touch_conv ON chat_messages;
CREATE TRIGGER trg_msg_touch_conv
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_last_message();

-- =====================================================
-- 4. user_presence — 心跳
-- =====================================================
CREATE TABLE IF NOT EXISTS user_presence (
  user_id      INTEGER     PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       VARCHAR(15) NOT NULL DEFAULT 'offline' CHECK (status IN ('online','away','offline'))
);

-- =====================================================
-- 5. Row Level Security
-- =====================================================
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence      ENABLE ROW LEVEL SECURITY;

-- 所有讀寫都經 backend service_role；anon 一律擋。
DROP POLICY IF EXISTS "chat_conv_admin_all"   ON chat_conversations;
CREATE POLICY "chat_conv_admin_all"   ON chat_conversations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "chat_part_admin_all"   ON chat_participants;
CREATE POLICY "chat_part_admin_all"   ON chat_participants FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "chat_msg_admin_all"    ON chat_messages;
CREATE POLICY "chat_msg_admin_all"    ON chat_messages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "presence_public_select" ON user_presence;
CREATE POLICY "presence_public_select" ON user_presence FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "presence_admin_all"     ON user_presence;
CREATE POLICY "presence_admin_all"     ON user_presence FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- 6. Storage bucket: chat-images
--    （若 Supabase Dashboard 已手動建好可省略；INSERT ... ON CONFLICT 冪等）
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,                                     -- 公開讀（path 含 random，不會被掃）
  5242880,                                  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 公開讀取 storage policy
DROP POLICY IF EXISTS "chat_images_public_read" ON storage.objects;
CREATE POLICY "chat_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'chat-images');

-- 上傳 / 刪除一律由 service_role 處理（後端代為）— 不開 anon/authenticated 權限
-- =====================================================
-- 完成
-- =====================================================
