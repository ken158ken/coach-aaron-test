-- =====================================================
-- Coach Aaron 資料庫結構
-- Supabase PostgreSQL Schema
-- =====================================================

-- 1. 使用者表 (users) - 擴展 Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
  user_id SERIAL PRIMARY KEY,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt 加密後的密碼
  phone_number VARCHAR(20) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  sex BOOLEAN DEFAULT FALSE, -- true 才能看到「阿倫私密淫照」頁面
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 2. 管理員白名單表 (admin_whitelist)
CREATE TABLE IF NOT EXISTS public.admin_whitelist (
  whitelist_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  added_by INTEGER REFERENCES public.users(user_id),
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

-- 插入預設管理員白名單
INSERT INTO public.admin_whitelist (email, note) 
VALUES ('ken158ken@gmail.com', '系統預設管理員')
ON CONFLICT (email) DO NOTHING;

-- 3. 使用者認證 Token 表 (user_auth_tokens)
CREATE TABLE IF NOT EXISTS public.user_auth_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token_type VARCHAR(50) NOT NULL,
  token_value TEXT NOT NULL,
  provider VARCHAR(50),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

-- 4. 課程表 (courses)
CREATE TABLE IF NOT EXISTS public.courses (
  course_id SERIAL PRIMARY KEY,
  course_title VARCHAR(255) NOT NULL,
  course_slug VARCHAR(255) UNIQUE,
  course_description VARCHAR(50),
  course_content TEXT,
  course_video_url TEXT,
  course_thumbnail_url TEXT,
  course_keywords TEXT[],
  course_category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
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

-- 5. 訂單表 (orders)
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

-- 6. 使用者課程關聯表 (user_courses)
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

-- 7. 訂單項目表 (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(order_id),
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id),
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL
);

-- 8. 付款記錄表 (payments)
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

-- 9. 課程評論表 (course_reviews)
CREATE TABLE IF NOT EXISTS public.course_reviews (
  review_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id),
  user_course_id INTEGER NOT NULL REFERENCES public.user_courses(user_course_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- 10. 短影音表 (videos) - 保留原有功能
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

-- =====================================================
-- 索引建立
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_tokens_user_id ON public.user_auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(course_slug);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON public.user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_email ON public.admin_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_phone ON public.admin_whitelist(phone_number);

-- =====================================================
-- Row Level Security (RLS) 政策
-- =====================================================

-- 啟用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Users 政策
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Courses 政策 - 公開課程任何人可看
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Videos 政策 - 公開影片任何人可看
CREATE POLICY "Anyone can view visible videos" ON public.videos
  FOR SELECT USING (is_visible = TRUE);

-- User Courses 政策
CREATE POLICY "Users can view own courses" ON public.user_courses
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Orders 政策
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Course Reviews 政策
CREATE POLICY "Anyone can view visible reviews" ON public.course_reviews
  FOR SELECT USING (is_visible = TRUE AND deleted_at IS NULL);

CREATE POLICY "Users can create own reviews" ON public.course_reviews
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Admin Whitelist 政策 - 只有管理員可操作（透過 service_role）
CREATE POLICY "Service role can manage whitelist" ON public.admin_whitelist
  FOR ALL USING (true);

-- =====================================================
-- 輔助函數
-- =====================================================

-- 檢查是否為管理員
CREATE OR REPLACE FUNCTION public.is_admin(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_whitelist 
    WHERE email = check_email AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 套用觸發器到所有表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_whitelist_updated_at BEFORE UPDATE ON public.admin_whitelist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
