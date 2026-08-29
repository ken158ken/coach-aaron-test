-- ============================================================
-- Rollback: 移除 Facebook (Meta) 社交登入欄位
-- 僅刪除 006_facebook_social_accounts.sql 新增的 4 個欄位
-- 不影響任何現有資料或其他欄位
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- ============================================================

-- STEP 1: 移除 Facebook 專用欄位
ALTER TABLE public.user_social_accounts
  DROP COLUMN IF EXISTS facebook_first_name,
  DROP COLUMN IF EXISTS facebook_last_name,
  DROP COLUMN IF EXISTS facebook_locale,
  DROP COLUMN IF EXISTS facebook_link;

-- STEP 2: 驗證欄位已移除
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_social_accounts'
ORDER BY ordinal_position;
