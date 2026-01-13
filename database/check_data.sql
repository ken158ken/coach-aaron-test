-- =====================================================
-- 資料庫檢查查詢
-- 在 Supabase SQL Editor 執行此檔案來檢查資料
-- =====================================================

-- 1. 檢查所有表是否存在
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 檢查 users 表結構（包含 password_hash 欄位）
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 檢查 admin_whitelist（應該有 ken158ken@gmail.com）
SELECT * FROM public.admin_whitelist;

-- 4. 檢查課程數量
SELECT COUNT(*) as course_count FROM public.courses;

-- 5. 檢查課程詳細資料
SELECT 
  course_id, 
  course_title, 
  price, 
  status,
  created_at
FROM public.courses
ORDER BY course_id;

-- 6. 檢查影片數量
SELECT COUNT(*) as video_count FROM public.videos;

-- 7. 檢查影片詳細資料
SELECT 
  video_id,
  title,
  url,
  type,
  sort_order,
  is_visible
FROM public.videos
ORDER BY sort_order
LIMIT 10;

-- 8. 檢查使用者數量
SELECT COUNT(*) as user_count FROM public.users;

-- 9. 檢查 RLS 政策
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
