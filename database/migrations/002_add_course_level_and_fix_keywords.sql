-- =====================================================
-- Migration: 新增課程難度和課堂數欄位，修正 keywords 型態
-- 日期: 2026-02-06
-- 說明: 
-- 1. 新增 course_level 欄位 (難度等級)
-- 2. 新增 lessons_count 欄位 (課堂數)
-- 3. 將 course_keywords 和 article_keywords 從 TEXT[] 改為 TEXT
-- 4. 將 course_category 和 article_category 從 VARCHAR 改為 TEXT
-- =====================================================

-- 1. 新增課程相關欄位
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS course_level VARCHAR(50) DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 0;

-- 2. 修正 courses 表的 keywords 和 category 型態
-- 先將現有 TEXT[] 資料轉換為 TEXT（逗號分隔）
DO $$ 
BEGIN
  -- 檢查欄位型態並轉換
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'course_keywords' 
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.courses 
      ALTER COLUMN course_keywords TYPE TEXT 
      USING array_to_string(course_keywords, ',');
  END IF;
END $$;

-- 修正 category 欄位
ALTER TABLE public.courses 
  ALTER COLUMN course_category TYPE TEXT;

-- 3. 修正 articles 表的 keywords 和 category 型態
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' 
    AND column_name = 'article_keywords' 
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.articles 
      ALTER COLUMN article_keywords TYPE TEXT 
      USING array_to_string(article_keywords, ',');
  END IF;
END $$;

-- 修正 article_category 欄位
ALTER TABLE public.articles 
  ALTER COLUMN article_category TYPE TEXT;

-- 4. 新增註解
COMMENT ON COLUMN public.courses.course_level IS '課程難度: beginner, intermediate, advanced';
COMMENT ON COLUMN public.courses.lessons_count IS '課程包含的課堂數';
COMMENT ON COLUMN public.courses.course_keywords IS '課程關鍵字，逗號分隔';
COMMENT ON COLUMN public.courses.course_category IS '課程分類，逗號分隔';
COMMENT ON COLUMN public.articles.article_keywords IS '文章關鍵字，逗號分隔';
COMMENT ON COLUMN public.articles.article_category IS '文章分類，逗號分隔';
