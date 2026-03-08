-- ============================================================
-- Facebook (Meta) 社交登入 – 資料表欄位擴充
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- ============================================================

-- STEP 1: user_social_accounts 新增 Facebook 專用欄位
ALTER TABLE public.user_social_accounts
  ADD COLUMN IF NOT EXISTS facebook_first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook_last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook_locale VARCHAR(10),
  ADD COLUMN IF NOT EXISTS facebook_link TEXT;

-- STEP 2: 更新 auth_provider 欄位說明
-- auth_provider 可能的值:
--   'local'    = 傳統 email/password 註冊
--   'google'   = 透過 Google OAuth 首次登入
--   'line'     = 透過 LINE Login 首次登入
--   'facebook' = 透過 Facebook Login 首次登入
--   'multiple' = 已綁定多個登入方式

-- STEP 3: 驗證
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_social_accounts'
  AND column_name LIKE 'facebook_%';
