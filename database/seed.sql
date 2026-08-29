-- =====================================================
-- Coach Aaron 種子資料
-- Supabase PostgreSQL Seed Data
-- 使用 ON CONFLICT 確保不會覆蓋現有資料
-- 最後更新: 2026-01-27
-- =====================================================
-- 注意: users, admin_whitelist 表已有資料，不需重新插入

-- =====================================================
-- 1. 測試課程
-- =====================================================

INSERT INTO public.courses (course_title, course_slug, course_description, course_content, price, status, course_category)
VALUES
  ('健身入門課程', 'fitness-beginner', '適合健身新手的入門課程，從基礎動作開始學習', '# 健身入門\n\n完整的健身基礎知識，包含熱身、基礎動作、收操等內容。', 1990, 'published', '基礎訓練'),
  ('進階重訓課程', 'advanced-weight-training', '進階重訓技巧，適合有一定基礎的學員', '# 進階重訓\n\n學習更專業的重訓方法，包含週期化訓練、漸進式超負荷等概念。', 2990, 'published', '重量訓練'),
  ('HIIT 高強度間歇訓練', 'hiit-training', '燃脂效率最高的訓練方式', '# HIIT 訓練\n\n高效燃脂訓練課程，適合想要快速減脂的學員。', 1590, 'published', '有氧訓練'),
  ('核心訓練專攻', 'core-training', '強化核心肌群的專項課程', '# 核心訓練\n\n打造穩定的核心，提升運動表現與日常生活品質。', 1790, 'draft', '核心訓練'),
  ('增肌飲食計畫', 'muscle-building-diet', '搭配重訓的增肌飲食指南', '# 增肌飲食\n\n學習如何計算熱量、蛋白質攝取，打造最佳增肌效果。', 990, 'published', '營養指導')
ON CONFLICT (course_slug) DO UPDATE SET
  course_title = EXCLUDED.course_title,
  course_description = EXCLUDED.course_description,
  price = EXCLUDED.price,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 2. 測試影片
-- =====================================================

INSERT INTO public.videos (title, url, type, is_visible, sort_order)
VALUES
  ('胸肌訓練教學', 'https://www.instagram.com/reel/example1', 'instagram', TRUE, 1),
  ('背肌訓練教學', 'https://www.instagram.com/reel/example2', 'instagram', TRUE, 2),
  ('腿部訓練教學', 'https://www.instagram.com/reel/example3', 'instagram', TRUE, 3),
  ('肩膀訓練教學', 'https://www.youtube.com/shorts/example4', 'youtube', TRUE, 4),
  ('手臂訓練教學', 'https://www.instagram.com/reel/example5', 'instagram', TRUE, 5),
  ('核心訓練教學', 'https://www.youtube.com/shorts/example6', 'youtube', TRUE, 6)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. 測試文章
-- =====================================================

-- 先取得管理員 user_id (從現有資料)
DO $$
DECLARE
  admin_user_id INTEGER;
BEGIN
  SELECT user_id INTO admin_user_id FROM public.users WHERE email = 'ken158ken@gmail.com' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.articles (
      author_id, article_title, article_slug, article_description, 
      article_content, article_category, status, is_featured, published_at
    )
    VALUES
      (
        admin_user_id, 
        '新手健身必看：5個常見錯誤', 
        'beginner-fitness-mistakes', 
        '剛開始健身的你，是否也犯了這些錯誤？本文帶你避開新手常見的健身地雷。',
        '# 新手健身必看：5個常見錯誤\n\n## 1. 不做熱身\n熱身是每次訓練的必備環節...\n\n## 2. 訓練過度\n休息和訓練一樣重要...',
        '健身知識',
        'published',
        TRUE,
        CURRENT_TIMESTAMP
      ),
      (
        admin_user_id,
        '增肌飲食完整指南',
        'muscle-building-diet-guide',
        '想要增肌？除了訓練，飲食更是關鍵！本文詳細解析增肌期的飲食策略。',
        '# 增肌飲食完整指南\n\n## 熱量計算\n增肌期需要熱量盈餘...\n\n## 蛋白質攝取\n每公斤體重建議攝取1.6-2.2克蛋白質...',
        '營養知識',
        'published',
        FALSE,
        CURRENT_TIMESTAMP
      ),
      (
        admin_user_id,
        '居家徒手訓練計畫',
        'home-workout-plan',
        '沒有器材也能練！完整的居家徒手訓練計畫，讓你在家也能維持體態。',
        '# 居家徒手訓練計畫\n\n## 週一：上半身\n- 伏地挺身 3組12下\n- 鑽石伏地挺身 3組10下...',
        '訓練計畫',
        'published',
        FALSE,
        CURRENT_TIMESTAMP
      ),
      (
        admin_user_id,
        '減脂期如何保留肌肉',
        'fat-loss-muscle-retention',
        '減脂不等於減肌！學習如何在減脂期間最大程度保留你的肌肉量。',
        '# 減脂期如何保留肌肉\n\n## 控制熱量赤字\n不要過度節食...\n\n## 維持訓練強度\n減脂期也要持續重訓...',
        '健身知識',
        'draft',
        FALSE,
        NULL
      )
    ON CONFLICT (article_slug) DO UPDATE SET
      article_title = EXCLUDED.article_title,
      article_description = EXCLUDED.article_description,
      updated_at = CURRENT_TIMESTAMP;
  END IF;
END $$;

-- =====================================================
-- 完成提示
-- =====================================================
-- 種子資料插入完成！
-- 測試帳號:
--   Email: ken158ken@gmail.com / Password: password123 (管理員)
--   Email: test@example.com / Password: password123 (一般用戶)
--   Email: vip@example.com / Password: password123 (VIP用戶，可看私密相簿)
