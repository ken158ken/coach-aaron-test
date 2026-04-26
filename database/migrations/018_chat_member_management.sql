-- =============================================
-- Migration 018: 群組成員管理（軟刪除 + 系統訊息）
-- 建立時間: 2026-04-26
--
-- 1. chat_participants.left_at — 被踢/離開時設為當下時間（不真的刪 row）
-- 2. chat_messages.message_type — 'user' 一般訊息 / 'system' 群組事件
--
-- 行為：
--   - 被踢的人：left_at 被設定 → API 端只能讀 created_at <= left_at 的訊息
--     送訊息會 403；對方仍保留在對話清單但顯示「已離開」
--   - 重新加入：upsert 會把 left_at 設回 null
--   - 系統訊息（XXX 加入群組 / XXX 被移除）插入後跟一般訊息一樣廣播
-- =============================================

-- 1. participant 軟刪除欄位
ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_part_left_at
  ON chat_participants(conversation_id, user_id, left_at);

-- 2. 訊息類型
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(20)
    NOT NULL DEFAULT 'user'
    CHECK (message_type IN ('user', 'system'));

-- 系統訊息也要有 content（描述事件），所以原本的 content/image_url
-- check constraint 仍然成立，不需修改

-- =====================================================
-- 完成
-- =====================================================
