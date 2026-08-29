-- ============================================================
-- 033_image_buckets.sql
-- 圖片系統改造：統一所有圖片 bucket 的建立與權限
--
-- 新增：
--   article-images   — 文章封面 / banner / 內文插圖
--   content-images   — 學員見證 / 相片輪播 / 網站內容圖
--
-- 補齊（原本靠 Supabase Dashboard 手動建立，這裡補上冪等 SQL）：
--   thumbnails        — IG 影片縮圖（videos.ts）
--   course-images     — 課程封面 / banner
--   lesson-thumbnails — 教學影片縮圖
--
-- 權限模型：
--   讀 → 公開（anon + authenticated），圖片本來就要能直接掛在 <img>
--   寫 → 只有 service_role（後端 supabaseAdmin），前端一律走 /api/uploads
--        service_role 會 bypass RLS，所以「不建立任何 INSERT/UPDATE/DELETE policy」
--        本身就是正確的收斂寫法，不是漏寫。
--
-- 冪等：可重複執行。
--   INSERT ... ON CONFLICT DO UPDATE 會把既有 bucket 的設定校正成一致值。
--   policy 用 DROP IF EXISTS + CREATE。
--
-- ⚠️ storage.buckets / storage.objects 的寫入需要足夠權限：
--    請用 Supabase Dashboard 的 SQL Editor 執行（那裡是 postgres 角色）。
--    若仍被擋，改在 Dashboard → Storage → New bucket 手動建立同名 bucket
--    （Public: true、File size limit: 5MB），再單獨跑下半段 policy。
-- ============================================================

-- ── 一、bucket ───────────────────────────────────────────────
-- 5 MB 上限與後端 multer limits 一致；
-- mime 白名單與 backend/utils/imageStorage.ts 的 ALLOWED_UPLOAD_MIME 一致。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('article-images',    'article-images',    true, 5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('content-images',    'content-images',    true, 5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('course-images',     'course-images',     true, 5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('lesson-thumbnails', 'lesson-thumbnails', true, 5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('thumbnails',        'thumbnails',        true, 5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ── 二、Storage RLS policy（掛在 storage.objects） ────────────
-- 公開讀取：五個 bucket 各一條，命名沿用既有 `{bucket}_public_read` 風格。

DROP POLICY IF EXISTS "article_images_public_read" ON storage.objects;
CREATE POLICY "article_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "content_images_public_read" ON storage.objects;
CREATE POLICY "content_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'content-images');

DROP POLICY IF EXISTS "course_images_public_read" ON storage.objects;
CREATE POLICY "course_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "lesson_thumbnails_public_read" ON storage.objects;
CREATE POLICY "lesson_thumbnails_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'lesson-thumbnails');

DROP POLICY IF EXISTS "video_thumbnails_public_read" ON storage.objects;
CREATE POLICY "video_thumbnails_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'thumbnails');

-- 上傳 / 更新 / 刪除：不開放給 anon 或 authenticated。
-- 全部由後端 supabaseAdmin（service_role，bypass RLS）代為執行。


-- ── 三、驗收 ─────────────────────────────────────────────────
-- 執行後可用以下語句確認：
--
--   SELECT id, public, file_size_limit, allowed_mime_types
--     FROM storage.buckets
--    WHERE id IN ('article-images','content-images','course-images',
--                 'lesson-thumbnails','thumbnails','lp-images','chat-images')
--    ORDER BY id;
--
--   SELECT policyname, cmd, roles
--     FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--    ORDER BY policyname;
-- ============================================================
