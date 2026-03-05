-- ============================================================
-- 社交帳號登入 - 資料庫 Schema 變更
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- 建議搭配 001_fix_and_import_courses.sql 一起執行
-- ============================================================

-- ============================================================
-- STEP 1: 修改 users 資料表，新增認證相關欄位
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';

-- auth_provider 可能的值:
--   'local'    = 傳統 email/password 註冊
--   'google'   = 透過 Google OAuth 首次登入
--   'line'     = 透過 LINE Login 首次登入
--   'multiple' = 已綁定多個登入方式

-- ============================================================
-- STEP 2: 建立社交帳號綁定表（含詳細個人資料）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_social_accounts (
  social_account_id SERIAL PRIMARY KEY,

  -- 關聯使用者
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,

  -- 第三方平台基本資訊
  provider VARCHAR(20) NOT NULL,                -- 'google' | 'line'
  provider_user_id VARCHAR(255) NOT NULL,       -- 第三方平台的使用者 ID

  -- 共用個人資料欄位
  provider_email VARCHAR(255),                  -- 第三方平台的 Email
  provider_display_name VARCHAR(255),           -- 第三方平台的顯示名稱
  provider_avatar_url TEXT,                     -- 第三方平台的大頭照 URL

  -- Google 專用欄位
  google_given_name VARCHAR(100),               -- Google 名字
  google_family_name VARCHAR(100),              -- Google 姓氏
  google_locale VARCHAR(10),                    -- Google 語系 (e.g. 'zh-TW')
  google_email_verified BOOLEAN,                -- Google Email 是否已驗證
  google_hd VARCHAR(255),                       -- Google Workspace 網域 (e.g. 'company.com')

  -- LINE 專用欄位
  line_status_message TEXT,                     -- LINE 個人狀態訊息
  line_picture_url TEXT,                        -- LINE 大頭照 URL (大圖)

  -- OAuth Token（加密儲存）
  access_token TEXT,                            -- OAuth access token
  refresh_token TEXT,                           -- OAuth refresh token
  token_expires_at TIMESTAMP,                   -- Token 過期時間
  id_token TEXT,                                -- Google ID Token / LINE ID Token

  -- 完整原始回應（供除錯或未來擴充）
  raw_profile JSONB,                            -- 完整的第三方 API 回應（JSON）

  -- 時間戳記
  last_login_at TIMESTAMP,                      -- 最後使用此社交帳號登入的時間
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 約束
  UNIQUE(provider, provider_user_id),           -- 同平台同使用者 ID 唯一
  UNIQUE(user_id, provider)                     -- 一個使用者只能綁定一個同平台帳號
);

-- ============================================================
-- STEP 3: 建立索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id
  ON public.user_social_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_provider
  ON public.user_social_accounts(provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_email
  ON public.user_social_accounts(provider_email);

CREATE INDEX IF NOT EXISTS idx_users_auth_provider
  ON public.users(auth_provider);

-- ============================================================
-- STEP 4: 觸發器 - 自動更新 updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON public.user_social_accounts;
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.user_social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STEP 5: RLS 政策
-- ============================================================
ALTER TABLE public.user_social_accounts ENABLE ROW LEVEL SECURITY;

-- 使用者只能查看自己的社交帳號綁定
DROP POLICY IF EXISTS "Users can view own social accounts" ON public.user_social_accounts;
CREATE POLICY "Users can view own social accounts" ON public.user_social_accounts
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- ============================================================
-- STEP 6: 驗證
-- ============================================================
-- 檢查 users 表是否新增了 auth_provider 欄位
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'auth_provider';

-- 檢查 user_social_accounts 表是否建立成功
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_social_accounts'
ORDER BY ordinal_position;
