-- =============================================
-- Migration 020: push_subscriptions 加 FCM 支援
-- 建立時間: 2026-04-27
--
-- 背景：Android app（webview / native）的 service worker 不能像瀏覽器
-- 那樣常駐收推播，所以走 Firebase Cloud Messaging (FCM)。
-- 網頁版繼續用 Web Push（VAPID）。
--
-- 改動：
--   1. 加 provider 欄位（'web' | 'fcm'）
--   2. p256dh / auth 改可空（FCM 不需要這兩個 key）
--   3. 加 provider 上的 index 方便 createNotification 分流時 query
-- =============================================

-- 1. 新增 provider 欄位（既有 row 都當作 web）
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'web';

-- 2. 加 check constraint（避免亂塞值）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'push_subscriptions_provider_check'
  ) THEN
    ALTER TABLE push_subscriptions
      ADD CONSTRAINT push_subscriptions_provider_check
      CHECK (provider IN ('web', 'fcm'));
  END IF;
END $$;

-- 3. p256dh / auth 對 FCM 用不到，放寬成可空
ALTER TABLE push_subscriptions ALTER COLUMN p256dh DROP NOT NULL;
ALTER TABLE push_subscriptions ALTER COLUMN auth   DROP NOT NULL;

-- 4. provider 上的 index（query 量少，但便宜）
CREATE INDEX IF NOT EXISTS idx_push_provider ON push_subscriptions(provider);

-- =============================================
-- 完成
-- =============================================
