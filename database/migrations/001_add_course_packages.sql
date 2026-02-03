-- =====================================================
-- Migration: 新增課程組合方案相關表格
-- 日期: 2026-02-01
-- 描述: 支援「教練變現實戰力」陪跑系統的課程組合方案
-- =====================================================

-- 1. 課程組合方案表 (course_packages)
-- 用於儲存如「三個月陪跑」「六個月陪跑」「一年陪跑」等方案
CREATE TABLE IF NOT EXISTS public.course_packages (
  package_id SERIAL PRIMARY KEY,
  package_title VARCHAR(255) NOT NULL,
  package_slug VARCHAR(255) UNIQUE,
  package_description TEXT,
  package_content TEXT,
  package_thumbnail_url TEXT,
  package_keywords TEXT[],
  
  -- 方案價格
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2),  -- 原價（用於顯示折扣）
  currency VARCHAR(3) DEFAULT 'TWD',
  
  -- 方案內容
  duration_months INTEGER,        -- 方案時長（月）
  sessions_count INTEGER,         -- 培訓次數
  included_course_ids INTEGER[],  -- 包含的單堂課程 ID 陣列
  
  -- SEO 欄位
  seo_title VARCHAR(255),
  seo_description VARCHAR(500),
  seo_keywords TEXT[],
  
  -- 狀態與排序
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- 統計
  total_enrolled INTEGER DEFAULT 0,
  
  -- 時間戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 2. 課程組合方案與單堂課程關聯表 (package_courses)
-- 用於儲存方案包含哪些單堂課程（多對多關係）
CREATE TABLE IF NOT EXISTS public.package_courses (
  package_course_id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL REFERENCES public.course_packages(package_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
  is_bonus BOOLEAN DEFAULT FALSE,  -- 是否為附贈課程
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(package_id, course_id)
);

-- 3. 更新訂單項目表，支援課程組合方案
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS package_id INTEGER REFERENCES public.course_packages(package_id),
  ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'course' CHECK (item_type IN ('course', 'package'));

-- 4. 使用者課程組合方案關聯表 (user_packages)
CREATE TABLE IF NOT EXISTS public.user_packages (
  user_package_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id),
  package_id INTEGER NOT NULL REFERENCES public.course_packages(package_id),
  order_id INTEGER REFERENCES public.orders(order_id),
  access_granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  sessions_used INTEGER DEFAULT 0,      -- 已使用的培訓次數
  sessions_remaining INTEGER,           -- 剩餘培訓次數
  last_session_at TIMESTAMP,
  notes TEXT,
  UNIQUE(user_id, package_id)
);

-- =====================================================
-- 索引建立
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_course_packages_status ON public.course_packages(status);
CREATE INDEX IF NOT EXISTS idx_course_packages_slug ON public.course_packages(package_slug);
CREATE INDEX IF NOT EXISTS idx_course_packages_featured ON public.course_packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_package_courses_package_id ON public.package_courses(package_id);
CREATE INDEX IF NOT EXISTS idx_package_courses_course_id ON public.package_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON public.user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_package_id ON public.user_packages(package_id);

-- =====================================================
-- 觸發器
-- =====================================================

DROP TRIGGER IF EXISTS update_course_packages_updated_at ON public.course_packages;
CREATE TRIGGER update_course_packages_updated_at 
  BEFORE UPDATE ON public.course_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS 政策
-- =====================================================

ALTER TABLE IF EXISTS public.course_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.package_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_packages ENABLE ROW LEVEL SECURITY;

-- Course Packages 政策
DROP POLICY IF EXISTS "Anyone can view published packages" ON public.course_packages;
CREATE POLICY "Anyone can view published packages" ON public.course_packages
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Package Courses 政策
DROP POLICY IF EXISTS "Anyone can view package courses" ON public.package_courses;
CREATE POLICY "Anyone can view package courses" ON public.package_courses
  FOR SELECT USING (true);

-- User Packages 政策
DROP POLICY IF EXISTS "Users can view own packages" ON public.user_packages;
CREATE POLICY "Users can view own packages" ON public.user_packages
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- 初始資料：插入陪跑方案
-- =====================================================

-- 先插入單堂課程
INSERT INTO public.courses (course_title, course_slug, course_description, price, status, course_category)
VALUES 
  ('表達力心理學', 'expression-psychology', '提升溝通表達能力，建立專業形象', 980, 'published', '附贈課程'),
  ('反對問題成交話術', 'objection-handling', '掌握常見反對問題的應對技巧', 480, 'published', '附贈課程'),
  ('體驗課成交全流程', 'trial-to-close', '從體驗課到成交的完整系統', 1980, 'published', '附贈課程'),
  ('私人教練續約必修課', 'renewal-masterclass', '提高會員續約率的關鍵技巧', 1980, 'published', '附贈課程'),
  ('一對一陪跑訓練', 'one-on-one-coaching', '個人化指導，加速成長', 18000, 'published', '陪跑課程'),
  ('心理韌性與職涯定位', 'mindset-career', '建立正確心態，規劃長期職涯', 18000, 'published', '陪跑課程')
ON CONFLICT (course_slug) DO NOTHING;

-- 插入陪跑方案
INSERT INTO public.course_packages (package_title, package_slug, package_description, price, original_price, duration_months, sessions_count, status, is_featured, sort_order)
VALUES 
  ('三個月陪跑方案', '3-months-coaching', '業績衝刺期：體驗課成交系統、現場開發實戰、成交進度追蹤、每週會議討論', 32800, 74220, 3, 12, 'published', FALSE, 1),
  ('六個月陪跑方案', '6-months-coaching', '完整培訓：包含業績衝刺期與建立長期收入兩階段', 59800, 74220, 6, 24, 'published', TRUE, 2),
  ('一年陪跑方案', '1-year-coaching', '全方位培訓：三階段完整系統，從銷售到自媒體', 118000, 74220, 12, 48, 'published', FALSE, 3)
ON CONFLICT (package_slug) DO NOTHING;

-- =====================================================
-- 完成提示
-- =====================================================
-- Migration 完成！
-- 新增表格：course_packages, package_courses, user_packages
-- 修改表格：order_items (新增 package_id, item_type 欄位)
