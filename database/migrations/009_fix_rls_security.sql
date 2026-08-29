-- ============================================================
-- Migration 009: 修復 RLS 安全性問題
-- 建立時間: 2026-03-18
-- 說明:
--   修復 Supabase Security Advisor 回報的 5 個 RLS 錯誤。
--   為以下資料表啟用 RLS 並建立存取政策：
--     1. user_auth_tokens
--     2. site_content
--     3. site_popups
--     4. content_templates
--     5. homepage_banners
-- ============================================================


-- ========================================
-- 共用工具：判斷目前登入者是否為管理員
-- 透過 admin_whitelist 表比對 auth.email()
-- SECURITY DEFINER = 以函數擁有者身份執行，可繞過 admin_whitelist 的 RLS
-- SET search_path = public = 防止 search_path 注入攻擊（同時消除 warning）
-- ========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE email = auth.email()
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ========================================
-- 1. user_auth_tokens（密碼重設 / Refresh Token）
-- 使用者只能讀取自己的 token
-- INSERT / UPDATE / DELETE 不建立 policy
--   → anon 與 authenticated 均無法寫入
--   → 後端使用 service_role key，自動繞過 RLS
-- ========================================
ALTER TABLE public.user_auth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_auth_tokens;
CREATE POLICY "Users can view own tokens"
  ON public.user_auth_tokens
  FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
  );


-- ========================================
-- 2. site_content（網站靜態文案）
-- 所有人可讀取 is_active = true 的內容
-- 管理員可完整管理（含讀取未啟用的項目）
-- ========================================
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site_content" ON public.site_content;
CREATE POLICY "Public can read site_content"
  ON public.site_content
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage site_content" ON public.site_content;
CREATE POLICY "Admin can manage site_content"
  ON public.site_content
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ========================================
-- 3. site_popups（首頁彈窗）
-- 訪客只能讀取 is_active = true 的彈窗
-- 管理員可完整管理
-- ========================================
ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active popups" ON public.site_popups;
CREATE POLICY "Public can read active popups"
  ON public.site_popups
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage site_popups" ON public.site_popups;
CREATE POLICY "Admin can manage site_popups"
  ON public.site_popups
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ========================================
-- 4. content_templates（管理員文案範本）
-- 前端 fallback 需要讀取，對所有人開放讀取
-- 管理員可完整管理
-- ========================================
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read templates" ON public.content_templates;
CREATE POLICY "Public can read templates"
  ON public.content_templates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage templates" ON public.content_templates;
CREATE POLICY "Admin can manage templates"
  ON public.content_templates
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ========================================
-- 5. homepage_banners（首頁 Banner）
-- 所有人可讀取，管理員可完整管理
-- ========================================
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read banners" ON public.homepage_banners;
CREATE POLICY "Public can read banners"
  ON public.homepage_banners
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage banners" ON public.homepage_banners;
CREATE POLICY "Admin can manage banners"
  ON public.homepage_banners
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 完成
-- 執行後請至 Supabase → Security Advisor 重新掃描確認錯誤已消除
-- ============================================================
