-- =====================================================
-- Coach Aaron 資料庫結構
-- Supabase PostgreSQL Schema
-- 使用 IF NOT EXISTS 確保不會覆蓋現有資料
-- 最後更新: 2026-01-27
-- =====================================================
-- 注意: users, admin_whitelist, user_auth_tokens 表已存在，不需重建

-- =====================================================
-- 1. 資料表建立 (使用 IF NOT EXISTS)
-- =====================================================

-- 1.1 課程表 (courses)
CREATE TABLE IF NOT EXISTS public.courses (
  course_id SERIAL PRIMARY KEY,
  course_title VARCHAR(255) NOT NULL,
  course_slug VARCHAR(255) UNIQUE,
  course_description VARCHAR(500),
  course_content TEXT,
  course_video_url TEXT,
  course_thumbnail_url TEXT,
  course_keywords TEXT,
  course_category TEXT,
  course_level VARCHAR(50) DEFAULT 'beginner',
  lessons_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'TWD',
  access_duration_days INTEGER,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  total_enrolled INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 1.2 訂單表 (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  order_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TWD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 使用者課程關聯表 (user_courses)
CREATE TABLE IF NOT EXISTS public.user_courses (
  user_course_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id),
  order_id INTEGER REFERENCES public.orders(order_id),
  access_granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- 1.4 訂單項目表 (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(order_id),
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id),
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL
);

-- 1.5 付款記錄表 (payments)
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(order_id),
  payment_provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TWD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  paid_at TIMESTAMP,
  failed_reason TEXT,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10,2),
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.6 課程評論表 (course_reviews)
CREATE TABLE IF NOT EXISTS public.course_reviews (
  review_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id),
  user_course_id INTEGER REFERENCES public.user_courses(user_course_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- 1.7 短影音表 (videos)
CREATE TABLE IF NOT EXISTS public.videos (
  video_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'instagram',
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.8 文章表 (articles)
CREATE TABLE IF NOT EXISTS public.articles (
  article_id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES public.users(user_id),
  article_title VARCHAR(255) NOT NULL,
  article_slug VARCHAR(255) UNIQUE,
  article_description VARCHAR(500),
  article_content TEXT,
  article_thumbnail_url TEXT,
  article_keywords TEXT,
  article_category TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 1.9 文章評分表 (article_ratings)
CREATE TABLE IF NOT EXISTS public.article_ratings (
  rating_id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, user_id)
);

-- 1.10 文章留言表 (article_comments)
CREATE TABLE IF NOT EXISTS public.article_comments (
  comment_id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  parent_comment_id INTEGER REFERENCES public.article_comments(comment_id),
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- =====================================================
-- 2. 索引建立 (使用 IF NOT EXISTS)
-- =====================================================

-- 課程索引
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(course_slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(course_category);

-- 使用者課程索引
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON public.user_courses(course_id);

-- 訂單索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- 訂單項目與付款索引
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);

-- 影片索引
CREATE INDEX IF NOT EXISTS idx_videos_is_visible ON public.videos(is_visible);
CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON public.videos(sort_order);

-- 文章索引
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(article_slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(article_category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON public.articles(is_featured);

-- 文章評分與留言索引
CREATE INDEX IF NOT EXISTS idx_article_ratings_article_id ON public.article_ratings(article_id);
CREATE INDEX IF NOT EXISTS idx_article_ratings_user_id ON public.article_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON public.article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id ON public.article_comments(parent_comment_id);

-- =====================================================
-- 3. 輔助函數
-- =====================================================

-- 更新 updated_at 觸發器函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. 觸發器 (先刪除再建立，避免重複)
-- =====================================================

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_reviews_updated_at ON public.course_reviews;
CREATE TRIGGER update_course_reviews_updated_at 
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at 
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_article_ratings_updated_at ON public.article_ratings;
CREATE TRIGGER update_article_ratings_updated_at 
  BEFORE UPDATE ON public.article_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_article_comments_updated_at ON public.article_comments;
CREATE TRIGGER update_article_comments_updated_at 
  BEFORE UPDATE ON public.article_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. Row Level Security (RLS) 政策
-- =====================================================

-- 啟用 RLS
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.article_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.article_comments ENABLE ROW LEVEL SECURITY;

-- Courses 政策
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Videos 政策
DROP POLICY IF EXISTS "Anyone can view visible videos" ON public.videos;
CREATE POLICY "Anyone can view visible videos" ON public.videos
  FOR SELECT USING (is_visible = TRUE);

-- User Courses 政策
DROP POLICY IF EXISTS "Users can view own courses" ON public.user_courses;
CREATE POLICY "Users can view own courses" ON public.user_courses
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Orders 政策
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Course Reviews 政策
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.course_reviews;
CREATE POLICY "Anyone can view visible reviews" ON public.course_reviews
  FOR SELECT USING (is_visible = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can create own reviews" ON public.course_reviews;
CREATE POLICY "Users can create own reviews" ON public.course_reviews
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Articles 政策
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
CREATE POLICY "Anyone can view published articles" ON public.articles
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Article Ratings 政策
DROP POLICY IF EXISTS "Anyone can view article ratings" ON public.article_ratings;
CREATE POLICY "Anyone can view article ratings" ON public.article_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own ratings" ON public.article_ratings;
CREATE POLICY "Users can create own ratings" ON public.article_ratings
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own ratings" ON public.article_ratings;
CREATE POLICY "Users can update own ratings" ON public.article_ratings
  FOR UPDATE USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Article Comments 政策
DROP POLICY IF EXISTS "Anyone can view visible comments" ON public.article_comments;
CREATE POLICY "Anyone can view visible comments" ON public.article_comments
  FOR SELECT USING (is_visible = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can create comments" ON public.article_comments;
CREATE POLICY "Users can create comments" ON public.article_comments
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own comments" ON public.article_comments;
CREATE POLICY "Users can update own comments" ON public.article_comments
  FOR UPDATE USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- 完成提示
-- =====================================================
-- Schema 建立完成！
-- 已排除: users, admin_whitelist, user_auth_tokens (保留現有資料)
-- 如需插入測試資料，請執行 seed.sql
