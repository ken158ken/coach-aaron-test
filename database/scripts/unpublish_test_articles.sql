-- =====================================================
-- 下架 4 篇 test-* 測試文（2026-10-06，SEO 內容整理）
-- 貼到 Supabase Dashboard → SQL Editor 執行；冪等，可重跑
-- =====================================================
-- 做法：status 改 'draft'（不刪資料、不動 deleted_at），後台「文章管理」仍看得到、可隨時重新發布。
-- 生效：/api/articles 立即不再列出；/articles/<slug> 的 SSR 邊緣快取最多 10 分鐘後轉 404+noindex；
--       sitemap.xml 快取 1 小時後移除這四筆（含它們帶出的單篇中文分類主題頁）。
-- 注意：mindset-02（【體驗課表單架構】）是先前稽核提到的空殼文，刻意「不」在本批——
--       它屬於正式分類 mindset，是否下架請教練決定；要一起下架就把最後那行註解拿掉。

-- 先看會動到哪幾筆（預期 4 列：article_id 6、7、8、9）
SELECT article_id, article_slug, article_title, status, article_category
FROM articles
WHERE article_slug LIKE 'test-%'
  AND deleted_at IS NULL;

-- 下架
UPDATE articles
SET status = 'draft',
    updated_at = NOW()
WHERE article_slug LIKE 'test-%'
  AND deleted_at IS NULL
  AND status = 'published';

-- （選用）連空殼文 mindset-02 一起下架：
-- UPDATE articles SET status = 'draft', updated_at = NOW() WHERE article_slug = 'mindset-02' AND status = 'published';

-- 確認：應回 0 列
SELECT article_id, article_slug FROM articles
WHERE article_slug LIKE 'test-%' AND status = 'published' AND deleted_at IS NULL;
