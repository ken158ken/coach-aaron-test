-- =====================================================
-- 040: notebooks 加排序欄位（後台樹：同會員底下筆記本可拖曳交換順序）
-- 請貼到 Supabase Dashboard SQL Editor 執行（冪等，可重跑）
-- =====================================================
-- 未貼之前：列表退回 updated_at 排序、拖曳排序功能回明確 503，不影響其他功能。

ALTER TABLE notebooks
  ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 既有列以 id 當初始順序（新建列由後端寫入時間戳）
UPDATE notebooks SET sort_order = id WHERE sort_order = 0;
