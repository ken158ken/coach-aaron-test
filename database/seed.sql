-- =====================================================
-- 初始資料 Seed Data
-- =====================================================

-- 插入預設課程
INSERT INTO public.courses (course_title, course_slug, course_description, course_content, course_thumbnail_url, price, status) VALUES
('初學者全身燃脂', 'beginner-fat-burn', '適合所有人的基礎燃脂課程', '<p>不需要器材，在家就能完成的全身燃脂訓練。</p>', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800', 999, 'published'),
('高強度間歇訓練 (HIIT)', 'hiit-training', '30分鐘極速燃脂挑戰', '<p>挑戰你的極限，高效燃脂訓練課程。</p>', 'https://images.unsplash.com/photo-1517963879466-cd115eb9244b?auto=format&fit=crop&q=80&w=800', 1299, 'published'),
('居家腹肌訓練', 'home-abs-workout', '每天15分鐘打造腹肌', '<p>打造完美腹肌線條的居家訓練課程。</p>', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800', 799, 'published')
ON CONFLICT DO NOTHING;

-- 插入預設短影音
INSERT INTO public.videos (title, url, type, sort_order) VALUES
('💪 教練日常訓練', 'https://www.instagram.com/reel/DFC4v9oS_Wd/', 'instagram', 1),
('🧠 健身心理學分享', 'https://www.instagram.com/reel/DE8G3bdyFVJ/', 'instagram', 2),
('📚 訓練技巧教學', 'https://www.instagram.com/reel/DE4gHBNSUuX/', 'instagram', 3),
('🏋️ 健身動作示範', 'https://www.instagram.com/reel/DEz5BXWSsRN/', 'instagram', 4),
('💡 運動知識分享', 'https://www.instagram.com/reel/DEu6GleSaAS/', 'instagram', 5),
('🔥 肌力訓練要點', 'https://www.instagram.com/reel/DEp0WwVy_Q0/', 'instagram', 6),
('🎯 健身房實錄', 'https://www.instagram.com/reel/DEnr3TKyR1y/', 'instagram', 7),
('⏰ 教練的一天', 'https://www.instagram.com/reel/DEiNAqRS0wQ/', 'instagram', 8),
('📈 增肌減脂技巧', 'https://www.instagram.com/reel/DEdhH2wyFGl/', 'instagram', 9),
('🎤 訓練動機分享', 'https://www.instagram.com/reel/DEYf-mySLGH/', 'instagram', 10),
('✅ 正確姿勢指導', 'https://www.instagram.com/reel/DET2_0mS0a3/', 'instagram', 11),
('🥗 營養補充建議', 'https://www.instagram.com/reel/DEOt1Xmy1G6/', 'instagram', 12),
('🌟 學員成果分享', 'https://www.instagram.com/reel/DEJnZQoyP9s/', 'instagram', 13),
('💬 健身Q&A', 'https://www.instagram.com/reel/DEEe8vqSCJB/', 'instagram', 14),
('🏃 有氧訓練心得', 'https://www.instagram.com/reel/DD_2c0xyHxy/', 'instagram', 15),
('🎬 幕後花絮', 'https://www.instagram.com/reel/DD6pJdGy0mT/', 'instagram', 16),
('💭 心態調整技巧', 'https://www.instagram.com/reel/DD1j8UBSxk5/', 'instagram', 17),
('🏆 挑戰自我極限', 'https://www.instagram.com/reel/DDwbgmrSQ0z/', 'instagram', 18)
ON CONFLICT DO NOTHING;
