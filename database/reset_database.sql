-- =====================================================
-- 清理並重建資料庫
-- ⚠️ 警告：這會刪除所有現有資料！
-- 請在執行前確認是否要清空資料庫
-- =====================================================

-- 步驟 1: 停用 RLS（避免權限問題）
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_whitelist DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_auth_tokens DISABLE ROW LEVEL SECURITY;

-- 步驟 2: 刪除所有 RLS 政策
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view visible videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view own courses" ON public.user_courses;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Service role can manage whitelist" ON public.admin_whitelist;

-- 步驟 3: 刪除觸發器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_course_reviews_updated_at ON public.course_reviews;
DROP TRIGGER IF EXISTS update_admin_whitelist_updated_at ON public.admin_whitelist;
DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;

-- 步驟 4: 刪除函數
DROP FUNCTION IF EXISTS public.is_admin(TEXT);
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- 步驟 5: 刪除所有表（按照依賴順序）
DROP TABLE IF EXISTS public.course_reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.user_courses CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.user_auth_tokens CASCADE;
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 完成！現在可以執行 schema.sql 和 seed.sql
