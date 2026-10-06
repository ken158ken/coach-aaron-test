-- =====================================================
-- 文章署名改成阿倫教官（2026-10-06）
-- 貼到 Supabase Dashboard → SQL Editor 執行；冪等，可重跑
-- =====================================================
-- 現況：23 篇文章的 author_id 都是 user_id=1（維護者帳號，display_name「恩123」），
--       文章頁署名與留言頭像都顯示「恩123」。
-- 做法：① 文章作者改掛阿倫本人的帳號 user_id=2（username Coachluen）
--       ② 阿倫帳號的顯示名由「阿倫」改成品牌名「阿倫教官」（與 JSON-LD Person 一致）
-- 不動 user_id=1 的顯示名（那是維護者自己的帳號）。
-- 生效：API 立即；文章頁 SSR 邊緣快取最多 10 分鐘後換新署名。

-- 先看現況（預期：user 1 = 恩123、user 2 = 阿倫；author_id=1 共 23 篇）
SELECT user_id, username, display_name FROM users WHERE user_id IN (1, 2);
SELECT author_id, COUNT(*) FROM articles WHERE deleted_at IS NULL GROUP BY author_id;

-- ① 文章改掛阿倫帳號
UPDATE articles
SET author_id = 2
WHERE author_id = 1;

-- ② 阿倫帳號顯示名改品牌名
UPDATE users
SET display_name = '阿倫教官'
WHERE user_id = 2
  AND username = 'Coachluen';

-- 確認：第一句應回 0 列；第二句應回「阿倫教官」
SELECT article_id FROM articles WHERE author_id = 1;
SELECT user_id, display_name FROM users WHERE user_id = 2;
