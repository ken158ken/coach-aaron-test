-- ============================================================
-- 課程售價顯示控制 – 使用者 × 課程 關聯表
-- 每個 user 對每堂 course 有獨立的 show_price 開關
-- 預設值: false (不顯示售價)
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- ============================================================

-- STEP 1: 建立關聯表
CREATE TABLE IF NOT EXISTS public.user_course_price_visibility (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
  show_price BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- STEP 2: 建立索引
CREATE INDEX IF NOT EXISTS idx_price_visibility_user
  ON public.user_course_price_visibility(user_id);

CREATE INDEX IF NOT EXISTS idx_price_visibility_course
  ON public.user_course_price_visibility(course_id);

CREATE INDEX IF NOT EXISTS idx_price_visibility_show
  ON public.user_course_price_visibility(user_id, show_price);

-- STEP 3: 自動更新 updated_at 觸發器
DROP TRIGGER IF EXISTS update_price_visibility_updated_at ON public.user_course_price_visibility;
CREATE TRIGGER update_price_visibility_updated_at
  BEFORE UPDATE ON public.user_course_price_visibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 4: RLS 政策
ALTER TABLE public.user_course_price_visibility ENABLE ROW LEVEL SECURITY;

-- 使用者只能查看自己的售價顯示設定
DROP POLICY IF EXISTS "Users can view own price visibility" ON public.user_course_price_visibility;
CREATE POLICY "Users can view own price visibility" ON public.user_course_price_visibility
  FOR SELECT USING (
    user_id IN (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
  );

-- STEP 5: 為現有的 user × course 組合填入初始資料（全部預設 false）
INSERT INTO public.user_course_price_visibility (user_id, course_id, show_price)
SELECT u.user_id, c.course_id, FALSE
FROM public.users u
CROSS JOIN public.courses c
WHERE u.deleted_at IS NULL
  AND c.deleted_at IS NULL
ON CONFLICT (user_id, course_id) DO NOTHING;

-- STEP 6: 驗證
SELECT COUNT(*) AS total_rows FROM public.user_course_price_visibility;
