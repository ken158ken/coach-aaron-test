-- =============================================
-- Migration 019: 通用通知系統 + Web Push 訂閱
-- 建立時間: 2026-04-26
--
-- 1. notifications        — 統一通知記錄（聊天、預約、群組等）
-- 2. push_subscriptions   — 瀏覽器 Web Push 訂閱（離線推播用）
--
-- 過期清理：通知 7 天後自動過期，由 Vercel Cron 觸發 /api/cron/cleanup-notifications
-- =============================================

-- =====================================================
-- 1. notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type        VARCHAR(40)  NOT NULL,
                                   -- 'chat_message' | 'chat_added_to_group'
                                   -- 'chat_removed_from_group'
                                   -- 'booking_pending' | 'booking_approved'
                                   -- 'booking_rejected' | 'booking_cancelled'
  title       VARCHAR(200) NOT NULL,
  body        TEXT                  DEFAULT '',
  link        VARCHAR(500),         -- 點擊跳轉
  icon_url    TEXT,                 -- 自訂圖示（avatar / 課程縮圖）
  metadata    JSONB,                -- type-specific 結構化資料
  is_read     BOOLEAN      NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread
  ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_expires ON notifications(expires_at);

-- =====================================================
-- 2. push_subscriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            SERIAL      PRIMARY KEY,
  user_id       INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  endpoint      TEXT        UNIQUE NOT NULL,
  p256dh        TEXT        NOT NULL,
  auth          TEXT        NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- =====================================================
-- 3. RLS — 所有讀寫經 backend service_role
-- =====================================================
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_admin_all" ON notifications;
CREATE POLICY "notif_admin_all" ON notifications FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "push_admin_all" ON push_subscriptions;
CREATE POLICY "push_admin_all" ON push_subscriptions FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- 完成
-- =====================================================
