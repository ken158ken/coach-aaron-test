-- =====================================================
-- 強制插入資料（刪除舊資料後重新插入）
-- =====================================================

-- 清空現有資料（保留表結構）
TRUNCATE TABLE public.course_reviews CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.user_courses CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.videos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;

-- 重新插入管理員白名單（先刪除再插入）
DELETE FROM public.admin_whitelist WHERE email = 'ken158ken@gmail.com';
INSERT INTO public.admin_whitelist (email, note, is_active) 
VALUES ('ken158ken@gmail.com', '系統預設管理員', true);

-- 插入課程
INSERT INTO public.courses (course_title, course_slug, course_description, course_content, course_thumbnail_url, price, status) VALUES
('初學者全身燃脂', 'beginner-fat-burn', '適合所有人的基礎燃脂課程', '<p>不需要器材，在家就能完成的全身燃脂訓練。</p>', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800', 999, 'published'),
('高強度間歇訓練 (HIIT)', 'hiit-training', '30分鐘極速燃脂挑戰', '<p>挑戰你的極限，高效燃脂訓練課程。</p>', 'https://images.unsplash.com/photo-1517963879466-cd115eb9244b?auto=format&fit=crop&q=80&w=800', 1299, 'published'),
('居家腹肌訓練', 'home-abs-workout', '每天15分鐘打造腹肌', '<p>打造完美腹肌線條的居家訓練課程。</p>', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800', 799, 'published');

-- 插入短影音
INSERT INTO public.videos (title, url, type, sort_order, is_visible) VALUES
('💪 教練日常訓練', 'https://www.instagram.com/reel/DFC4v9oS_Wd/', 'instagram', 1, true),
('🧠 健身心理學分享', 'https://www.instagram.com/reel/DE8G3bdyFVJ/', 'instagram', 2, true),
('📚 訓練技巧教學', 'https://www.instagram.com/reel/DE4gHBNSUuX/', 'instagram', 3, true),
('🏋️ 健身動作示範', 'https://www.instagram.com/reel/DEz5BXWSsRN/', 'instagram', 4, true),
('💡 運動知識分享', 'https://www.instagram.com/reel/DEu6GleSaAS/', 'instagram', 5, true),
('🔥 肌力訓練要點', 'https://www.instagram.com/reel/DEp0WwVy_Q0/', 'instagram', 6, true),
('🎯 健身房實錄', 'https://www.instagram.com/reel/DEnr3TKyR1y/', 'instagram', 7, true),
('⏰ 教練的一天', 'https://www.instagram.com/reel/DEiNAqRS0wQ/', 'instagram', 8, true),
('📈 增肌減脂技巧', 'https://www.instagram.com/reel/DEdhH2wyFGl/', 'instagram', 9, true),
('🎤 訓練動機分享', 'https://www.instagram.com/reel/DEYf-mySLGH/', 'instagram', 10, true),
('✅ 正確姿勢指導', 'https://www.instagram.com/reel/DET2_0mS0a3/', 'instagram', 11, true),
('🥗 營養補充建議', 'https://www.instagram.com/reel/DEOt1Xmy1G6/', 'instagram', 12, true),
('🌟 學員成果分享', 'https://www.instagram.com/reel/DEJnZQoyP9s/', 'instagram', 13, true),
('💬 健身Q&A', 'https://www.instagram.com/reel/DEEe8vqSCJB/', 'instagram', 14, true),
('🏃 有氧訓練心得', 'https://www.instagram.com/reel/DD_2c0xyHxy/', 'instagram', 15, true),
('🎬 幕後花絮', 'https://www.instagram.com/reel/DD6pJdGy0mT/', 'instagram', 16, true),
('💭 心態調整技巧', 'https://www.instagram.com/reel/DD1j8UBSxk5/', 'instagram', 17, true),
('🏆 挑戰自我極限', 'https://www.instagram.com/reel/DDwbgmrSQ0z/', 'instagram', 18, true);

-- 驗證插入結果
SELECT '管理員白名單' as table_name, COUNT(*) as count FROM public.admin_whitelist
UNION ALL
SELECT '課程', COUNT(*) FROM public.courses
UNION ALL
SELECT '影片', COUNT(*) FROM public.videos
UNION ALL
SELECT '使用者', COUNT(*) FROM public.users;
