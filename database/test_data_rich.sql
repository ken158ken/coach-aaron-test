-- =====================================================
-- 豐富的測試資料 - 文章與課程
-- 日期: 2026-02-06
-- 說明: 包含完整的文章和課程內容，搭配圖片和影片
-- =====================================================

-- =====================================================
-- 1. 課程測試資料（使用 YouTube 影片）
-- =====================================================

-- 先取得管理員 user_id
DO $$
DECLARE
  admin_user_id INTEGER;
BEGIN
  SELECT user_id INTO admin_user_id FROM public.users WHERE email = 'ken158ken@gmail.com' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    -- 如果沒有管理員，使用第一個使用者
    SELECT user_id INTO admin_user_id FROM public.users LIMIT 1;
  END IF;

  -- 刪除現有測試資料（可選）
  -- DELETE FROM public.courses WHERE course_slug LIKE 'test-%';
  -- DELETE FROM public.articles WHERE article_slug LIKE 'test-%';

  -- ===== 插入課程 =====
  
  -- 課程 1: 完整健身入門訓練營
  INSERT INTO public.courses (
    course_title, course_slug, course_description, course_content,
    course_video_url, course_thumbnail_url, course_level, lessons_count,
    course_category, course_keywords, price, status
  ) VALUES (
    '完整健身入門訓練營',
    'test-complete-beginner-bootcamp',
    '從零開始學習健身的完整課程！包含基礎動作教學、訓練計畫設計、營養攝取指南，讓你3個月打造理想體態。',
    '<h1>完整健身入門訓練營</h1>

<h2>課程簡介</h2>
<p>這是一個專為健身新手設計的完整訓練課程。無論你是完全沒有運動經驗，還是想要重新建立正確的訓練基礎，這門課程都能幫助你達成目標。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467353/photo-1595500381966-eee2034aae48_vdqwoh.avif" alt="健身訓練" width="600" />

<h2>課程內容</h2>

<h3>第一週：建立基礎</h3>
<ul>
  <li>認識肌肉群與基本解剖學</li>
  <li>正確的熱身與伸展技巧</li>
  <li>基礎動作模式訓練（深蹲、硬舉、推、拉）</li>
  <li>訓練前後的營養補充</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467350/photo-1580870069867-74c57ee1bb07_dmyfqc.avif" alt="基礎訓練" width="400" />

<h3>第二週：上半身訓練</h3>
<ul>
  <li>胸肌訓練：臥推、啞鈴飛鳥</li>
  <li>背肌訓練：引體向上、划船</li>
  <li>肩膀訓練：肩推、側平舉</li>
  <li>手臂訓練：二頭彎舉、三頭下壓</li>
</ul>

<youtube url="https://www.youtube.com/watch?v=B6VxFOC8Gfw" width="560"></youtube>

<h3>第三週：下半身訓練</h3>
<p>下半身訓練是增肌減脂最重要的環節，因為腿部肌群占全身肌肉量的60%以上。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467348/photo-1519821172144-4f87d85de2a1_vegpzu.avif" alt="下半身訓練" width="500" />

<ul>
  <li>深蹲變化式：槓鈴深蹲、腿推、保加利亞分腿蹲</li>
  <li>硬舉技巧：傳統硬舉、羅馬尼亞硬舉</li>
  <li>小腿訓練：站姿提踵、坐姿提踵</li>
</ul>

<h3>第四週：核心與功能性訓練</h3>
<ul>
  <li>核心穩定訓練：棒式、側棒式、死蟲</li>
  <li>旋轉力訓練：俄羅斯轉體、伐木</li>
  <li>功能性動作：農夫走路、土耳其起立</li>
</ul>

<youtube url="https://www.youtube.com/watch?v=SIfJnmyNO-g" width="560"></youtube>

<h2>營養指導</h2>
<p>訓練只是成功的一半，飲食更是關鍵！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467346/photo-1513836279014-a89f7a76ae86_zgrnqe.avif" alt="健康飲食" width="450" />

<h3>增肌期飲食建議</h3>
<ul>
  <li><strong>熱量</strong>: 每日TDEE + 300-500大卡</li>
  <li><strong>蛋白質</strong>: 每公斤體重2克（例如70kg需要140g蛋白質）</li>
  <li><strong>碳水化合物</strong>: 訓練日增加攝取，休息日減少</li>
  <li><strong>脂肪</strong>: 佔總熱量的20-30%</li>
</ul>

<h2>課程特色</h2>
<ul>
  <li>✅ 12週完整訓練計畫</li>
  <li>✅ 每週3-5次訓練課表</li>
  <li>✅ 高清動作示範影片</li>
  <li>✅ 個人化營養建議</li>
  <li>✅ 線上社群支持</li>
  <li>✅ 終身觀看權限</li>
</ul>

<p><strong>立即開始你的健身旅程！</strong></p>',
    'https://www.youtube.com/watch?v=B6VxFOC8Gfw',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467353/photo-1595500381966-eee2034aae48_vdqwoh.avif',
    'beginner',
    24,
    '基礎訓練,全身訓練',
    '健身入門,新手健身,訓練計畫,營養指導',
    2990,
    'published'
  ) ON CONFLICT (course_slug) DO UPDATE SET
    course_title = EXCLUDED.course_title,
    course_description = EXCLUDED.course_description,
    course_content = EXCLUDED.course_content,
    updated_at = CURRENT_TIMESTAMP;

  -- 課程 2: HIIT 高效燃脂課程
  INSERT INTO public.courses (
    course_title, course_slug, course_description, course_content,
    course_video_url, course_thumbnail_url, course_level, lessons_count,
    course_category, course_keywords, price, status
  ) VALUES (
    'HIIT 高效燃脂訓練課程',
    'test-hiit-fat-burning',
    '30天快速減脂計畫！每天只需20-30分鐘，在家就能完成高強度間歇訓練，有效燃燒脂肪並保留肌肉量。',
    '<h1>HIIT 高效燃脂訓練課程</h1>

<p>想要快速減脂但時間有限？HIIT（高強度間歇訓練）是你的最佳選擇！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467339/premium_photo-1667121496100-ca96e50fbb29_mt5gkz.avif" alt="HIIT訓練" width="650" />

<h2>什麼是 HIIT？</h2>
<p>HIIT 是一種結合高強度運動與短暫休息的訓練方式。研究顯示，HIIT 能在較短時間內達到與傳統有氧運動相同甚至更好的減脂效果。</p>

<h3>HIIT 的優勢</h3>
<ul>
  <li>⏰ <strong>省時高效</strong>: 每次訓練只需20-30分鐘</li>
  <li>🔥 <strong>燃脂效果佳</strong>: 訓練後持續燃燒熱量（後燃效應）</li>
  <li>💪 <strong>保留肌肉</strong>: 不像長時間有氧會流失肌肉</li>
  <li>🏠 <strong>居家可做</strong>: 不需要任何器材</li>
</ul>

<youtube url="https://www.youtube.com/watch?v=bVLRxsjM-jQ" width="560"></youtube>

<h2>課程結構</h2>

<h3>第一週：適應期（強度60%）</h3>
<p>讓身體逐漸適應高強度訓練，學習正確的動作模式。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467342/photo-1554475900-0a0350e3fc7b_orcwu4.avif" alt="訓練動作" width="400" />

<ul>
  <li>開合跳 30秒 / 休息30秒</li>
  <li>深蹲 30秒 / 休息30秒</li>
  <li>登山者式 30秒 / 休息30秒</li>
  <li>波比跳（簡易版）30秒 / 休息30秒</li>
</ul>

<h3>第二週：進階期（強度75%）</h3>
<ul>
  <li>波比跳 40秒 / 休息20秒</li>
  <li>高抬腿 40秒 / 休息20秒</li>
  <li>跳躍深蹲 40秒 / 休息20秒</li>
  <li>棒式撐體 40秒 / 休息20秒</li>
</ul>

<h3>第三週：挑戰期（強度90%）</h3>
<p>進入高強度挑戰，最大化燃脂效果！</p>

<youtube url="https://www.youtube.com/watch?v=vZfdHaPjfzY" width="560"></youtube>

<h3>第四週：極限週（強度100%）</h3>
<ul>
  <li>Tabata 訓練：20秒全力 / 10秒休息，共8輪</li>
  <li>混合式 HIIT：結合多種動作的循環訓練</li>
  <li>挑戰賽：測試你的進步程度</li>
</ul>

<h2>飲食建議</h2>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467333/photo-1718347478724-d13189138aa2_v0ygin.avif" alt="健康飲食" width="500" />

<p>減脂期建議：</p>
<ul>
  <li>熱量赤字：TDEE - 300-500大卡</li>
  <li>高蛋白飲食：每公斤體重1.8-2.2克</li>
  <li>訓練前補充碳水：香蕉、燕麥等</li>
  <li>訓練後補充蛋白質：雞胸肉、蛋白粉</li>
</ul>

<h2>注意事項</h2>
<ol>
  <li>訓練前務必充分熱身5-10分鐘</li>
  <li>依照自己的體能狀況調整強度</li>
  <li>保持正確的動作姿勢，避免受傷</li>
  <li>每週至少休息1-2天讓身體恢復</li>
  <li>補充足夠水分</li>
</ol>

<p><strong>準備好挑戰自己了嗎？立即開始！</strong></p>',
    'https://www.youtube.com/watch?v=bVLRxsjM-jQ',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467339/premium_photo-1667121496100-ca96e50fbb29_mt5gkz.avif',
    'intermediate',
    16,
    '有氧訓練,減脂',
    'HIIT,高強度間歇訓練,減脂,燃脂,居家訓練',
    1990,
    'published'
  ) ON CONFLICT (course_slug) DO UPDATE SET
    course_title = EXCLUDED.course_title,
    course_description = EXCLUDED.course_description,
    course_content = EXCLUDED.course_content,
    updated_at = CURRENT_TIMESTAMP;

  -- 課程 3: 進階肌力訓練
  INSERT INTO public.courses (
    course_title, course_slug, course_description, course_content,
    course_video_url, course_thumbnail_url, course_level, lessons_count,
    course_category, course_keywords, price, status
  ) VALUES (
    '進階肌力訓練專業課程',
    'test-advanced-strength-training',
    '突破訓練瓶頸！學習週期化訓練、漸進式超負荷、高級訓練技巧，帶你的肌力提升到下一個層次。',
    '<h1>進階肌力訓練專業課程</h1>

<p>已經訓練一段時間但遇到瓶頸？這門課程將帶你進入專業肌力訓練的領域。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1707135719544-ce905e45f2ec_eq9ejf.avif" alt="進階訓練" width="700" />

<h2>課程目標</h2>
<ul>
  <li>🎯 突破力量平台期</li>
  <li>📈 學習科學化訓練方法</li>
  <li>💡 掌握進階訓練技巧</li>
  <li>🏆 設定並達成力量目標</li>
</ul>

<h2>週期化訓練理論</h2>

<h3>宏觀週期（Macrocycle）</h3>
<p>長期訓練計畫，通常為6-12個月。</p>

<h3>中觀週期（Mesocycle）</h3>
<p>每個階段4-6週，focus 在特定訓練目標：</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/photo-1748261347768-a32434751a9a_u85qf0.avif" alt="訓練計畫" width="450" />

<ul>
  <li><strong>肌肥大期</strong>: 8-12RM，每組力竭</li>
  <li><strong>肌力期</strong>: 3-6RM，重量優先</li>
  <li><strong>爆發力期</strong>: 1-3RM，動作速度</li>
  <li><strong>減量期</strong>: 降低訓練量，讓身體恢復</li>
</ul>

<youtube url="https://www.youtube.com/watch?v=qf23qPoZ82E" width="560"></youtube>

<h3>微觀週期（Microcycle）</h3>
<p>每週的訓練安排，包含訓練日與休息日的規劃。</p>

<h2>三大項訓練技巧</h2>

<h3>1. 深蹲 (Squat)</h3>
<p>腿部訓練之王，全身性複合動作。</p>

<ul>
  <li>高槓深蹲 vs 低槓深蹲</li>
  <li>前蹲舉技巧</li>
  <li>輔助訓練：箱上深蹲、暫停深蹲</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/premium_photo-1661371836399-737ebcbef80e_b8vsdj.avif" alt="深蹲訓練" width="500" />

<h3>2. 臥推 (Bench Press)</h3>
<p>上半身推力之王，打造強壯胸肌。</p>

<ul>
  <li>握距調整對肌群的影響</li>
  <li>拱背技巧（powerlifting style）</li>
  <li>輔助訓練：地板臥推、板凳臥推</li>
</ul>

<h3>3. 硬舉 (Deadlift)</h3>
<p>全身性力量動作，發展後鏈肌群。</p>

<youtube url="https://www.youtube.com/watch?v=jFahacgiamI" width="560"></youtube>

<ul>
  <li>傳統硬舉 vs 相撲硬舉</li>
  <li>六角槓硬舉的優勢</li>
  <li>輔助訓練：架上拉、deficit pull</li>
</ul>

<h2>進階訓練方法</h2>

<h3>1. 漸進式超負荷</h3>
<p>持續給予肌肉更大的刺激。</p>
<ul>
  <li>增加重量</li>
  <li>增加次數</li>
  <li>增加組數</li>
  <li>縮短組間休息</li>
  <li>提升動作品質</li>
</ul>

<h3>2. 變化訓練</h3>
<ul>
  <li>金字塔訓練</li>
  <li>波浪負荷</li>
  <li>集群組訓練</li>
  <li>超級組、巨大組</li>
</ul>

<h3>3. 弱點強化</h3>
<p>找出並針對性訓練你的弱點部位。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1692607038292-cb94a95a9719_upn4ua.avif" alt="專項訓練" width="480" />

<h2>營養與恢復</h2>

<h3>增肌期營養</h3>
<ul>
  <li>熱量盈餘：TDEE + 300-500大卡</li>
  <li>蛋白質：每公斤2-2.5克</li>
  <li>碳水化合物：訓練日6-8g/kg</li>
  <li>補充品：肌酸、BCAA、麩醯胺酸</li>
</ul>

<h3>恢復策略</h3>
<ul>
  <li>充足睡眠（7-9小時）</li>
  <li>主動恢復（輕度有氧、伸展）</li>
  <li>按摩、滾筒放鬆</li>
  <li>適時減量訓練</li>
</ul>

<h2>課程包含</h2>
<ul>
  <li>✅ 16週進階訓練計畫</li>
  <li>✅ 專業動作示範與講解</li>
  <li>✅ 個人化週期規劃</li>
  <li>✅ 營養與補充品建議</li>
  <li>✅ 線上教練指導</li>
</ul>

<p><strong>準備好突破極限了嗎？</strong></p>',
    'https://www.youtube.com/watch?v=qf23qPoZ82E',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1707135719544-ce905e45f2ec_eq9ejf.avif',
    'advanced',
    20,
    '重量訓練,肌力訓練',
    '進階訓練,週期化訓練,肌力,力量訓練,三大項',
    3990,
    'published'
  ) ON CONFLICT (course_slug) DO UPDATE SET
    course_title = EXCLUDED.course_title,
    course_description = EXCLUDED.course_description,
    course_content = EXCLUDED.course_content,
    updated_at = CURRENT_TIMESTAMP;

  -- 課程 4: 核心訓練專攻（草稿）
  INSERT INTO public.courses (
    course_title, course_slug, course_description, course_content,
    course_video_url, course_thumbnail_url, course_level, lessons_count,
    course_category, course_keywords, price, status
  ) VALUES (
    '核心訓練專攻 - 打造鋼鐵腹肌',
    'test-core-training-mastery',
    '全方位核心訓練課程，不只是腹肌！學習如何建立強大的核心穩定性，提升運動表現並預防運動傷害。',
    '<h1>核心訓練專攻</h1>

<p>核心不只是六塊腹肌！真正強大的核心能提升你的運動表現、改善姿勢，並預防下背痛。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467350/photo-1580870069867-74c57ee1bb07_dmyfqc.avif" alt="核心訓練" width="600" />

<h2>什麼是核心？</h2>
<p>核心肌群包含：</p>
<ul>
  <li>腹直肌（六塊肌）</li>
  <li>腹內外斜肌</li>
  <li>腹橫肌</li>
  <li>豎脊肌</li>
  <li>多裂肌</li>
  <li>骨盆底肌</li>
</ul>

<h2>訓練內容</h2>

<h3>抗伸展訓練</h3>
<ul>
  <li>棒式變化式</li>
  <li>腹肌滾輪</li>
  <li>懸吊訓練</li>
</ul>

<h3>抗側屈訓練</h3>
<ul>
  <li>側棒式</li>
  <li>農夫走路</li>
  <li>單臂負重訓練</li>
</ul>

<h3>抗旋轉訓練</h3>
<ul>
  <li>Pallof Press</li>
  <li>鳥狗式</li>
  <li>死蟲式</li>
</ul>

<p>（課程內容開發中...）</p>',
    NULL,
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467350/photo-1580870069867-74c57ee1bb07_dmyfqc.avif',
    'intermediate',
    12,
    '核心訓練,功能性訓練',
    '核心,腹肌,穩定性訓練,功能性',
    1790,
    'draft'
  ) ON CONFLICT (course_slug) DO UPDATE SET
    course_title = EXCLUDED.course_title,
    updated_at = CURRENT_TIMESTAMP;

  -- ===== 插入文章 =====
  
  -- 文章 1: 健身新手必看指南
  INSERT INTO public.articles (
    author_id, article_title, article_slug, article_description,
    article_content, article_thumbnail_url, article_category,
    article_keywords, status, is_featured, published_at
  ) VALUES (
    admin_user_id,
    '健身新手必看：避開這10個常見錯誤',
    'test-beginner-10-mistakes',
    '剛開始健身的你，一定要避開這些錯誤！本文整理了新手最常犯的10個健身地雷，幫助你更有效率地達成目標。',
    '<h1>健身新手必看：避開這10個常見錯誤</h1>

<p>開始健身是一個很棒的決定！但是很多新手因為缺乏正確的知識，常常走了不少冤枉路。今天就來分享10個最常見的錯誤，讓你少走彎路！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467353/photo-1595500381966-eee2034aae48_vdqwoh.avif" alt="健身訓練" width="700" />

<h2>錯誤 1：不做熱身就開始訓練</h2>

<p>很多人為了節省時間，一進健身房就直接開始重訓。這是非常危險的行為！</p>

<h3>為什麼熱身很重要？</h3>
<ul>
  <li>提升肌肉溫度，增加延展性</li>
  <li>增加關節活動度</li>
  <li>預防運動傷害</li>
  <li>提升訓練表現</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467342/photo-1554475900-0a0350e3fc7b_orcwu4.avif" alt="熱身運動" width="500" />

<h3>正確的熱身流程</h3>
<ol>
  <li><strong>全身性熱身</strong> (5-10分鐘)：輕度有氧，如快走、飛輪</li>
  <li><strong>動態伸展</strong> (5分鐘)：腿部擺盪、手臂繞環、軀幹旋轉</li>
  <li><strong>專項熱身</strong> (2-3組)：用輕重量做當天要訓練的動作</li>
</ol>

<h2>錯誤 2：訓練過度，不給身體休息時間</h2>

<p>「休息是訓練的一部分」這句話非常重要！肌肉是在休息時生長的，不是在訓練時。</p>

<blockquote>
<p>「More is not always better. Better is better.」 - 訓練不是越多越好，而是要有品質。</p>
</blockquote>

<h3>適當的休息頻率</h3>
<ul>
  <li>每個肌群訓練後至少休息48小時</li>
  <li>每週至少1-2天完全休息</li>
  <li>注意身體發出的信號：持續疲勞、訓練表現下降、失眠</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467346/photo-1513836279014-a89f7a76ae86_zgrnqe.avif" alt="休息恢復" width="550" />

<h2>錯誤 3：忽略飲食的重要性</h2>

<p>有句話說：「三分練，七分吃」。再怎麼努力訓練，如果飲食不正確，效果都會大打折扣。</p>

<h3>增肌飲食重點</h3>
<ul>
  <li><strong>熱量盈餘</strong>：每日攝取略高於消耗的熱量</li>
  <li><strong>蛋白質</strong>：每公斤體重1.6-2.2克</li>
  <li><strong>碳水化合物</strong>：訓練前後補充，提供能量</li>
  <li><strong>健康脂肪</strong>：堅果、酪梨、橄欖油</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467333/photo-1718347478724-d13189138aa2_v0ygin.avif" alt="健康飲食" width="600" />

<h3>減脂飲食重點</h3>
<ul>
  <li><strong>熱量赤字</strong>：但不要太激進（建議-300至-500大卡）</li>
  <li><strong>高蛋白</strong>：幫助保留肌肉</li>
  <li><strong>充足水分</strong>：每天至少2000-3000ml</li>
</ul>

<h2>錯誤 4：動作姿勢不正確</h2>

<p>很多人急於增加重量，卻犧牲了動作品質。這不僅無法有效刺激目標肌群，還可能導致受傷。</p>

<youtube url="https://www.youtube.com/watch?v=B6VxFOC8Gfw" width="560"></youtube>

<h3>如何確保動作正確？</h3>
<ol>
  <li>從輕重量開始，先學會正確動作</li>
  <li>請教練或有經驗的朋友指導</li>
  <li>錄影自己的動作，對照標準動作</li>
  <li>使用鏡子觀察姿勢</li>
  <li>感受目標肌群的收縮</li>
</ol>

<h2>錯誤 5：只練喜歡的部位</h2>

<p>很多男生只練上半身（尤其是胸肌和手臂），女生只練下半身和臀部。這樣會造成身材不均衡。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467348/photo-1519821172144-4f87d85de2a1_vegpzu.avif" alt="全身訓練" width="580" />

<h3>平衡訓練的重要性</h3>
<ul>
  <li>避免肌力不平衡造成的運動傷害</li>
  <li>改善體態，讓身材更協調</li>
  <li>提升整體運動表現</li>
</ul>

<h2>錯誤 6：忽略複合動作</h2>

<p>新手常常只做單關節的孤立動作（如二頭彎舉），而忽略了多關節的複合動作（如深蹲、硬舉、臥推）。</p>

<h3>複合動作的優勢</h3>
<ul>
  <li>一次訓練多個肌群，更有效率</li>
  <li>能使用更大重量，刺激肌肉生長</li>
  <li>提升功能性肌力</li>
  <li>促進更多生長激素分泌</li>
</ul>

<h2>錯誤 7：重量選擇不當</h2>

<p>太輕沒有效果，太重容易受傷。</p>

<h3>如何選擇適合的重量？</h3>
<ul>
  <li><strong>增肌</strong>：選擇8-12次力竭的重量</li>
  <li><strong>肌力</strong>：選擇3-6次力竭的重量</li>
  <li><strong>肌耐力</strong>：選擇15-20次力竭的重量</li>
</ul>

<p>如果最後2-3次沒有感到困難，代表重量太輕；如果姿勢開始跑掉，代表重量太重。</p>

<h2>錯誤 8：組間休息時間不當</h2>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467350/photo-1580870069867-74c57ee1bb07_dmyfqc.avif" alt="訓練休息" width="480" />

<h3>休息時間建議</h3>
<ul>
  <li><strong>肌力訓練</strong>：3-5分鐘</li>
  <li><strong>肌肥大</strong>：60-90秒</li>
  <li><strong>肌耐力</strong>：30-60秒</li>
</ul>

<h2>錯誤 9：沒有設定明確目標</h2>

<p>「想變壯」、「想瘦」這樣的目標太模糊。你需要具體、可衡量的目標。</p>

<h3>SMART 目標設定</h3>
<ul>
  <li><strong>S</strong>pecific（具體的）：例如「增加3公斤肌肉」</li>
  <li><strong>M</strong>easurable（可衡量的）：能用數字量化</li>
  <li><strong>A</strong>chievable（可達成的）：符合實際</li>
  <li><strong>R</strong>elevant（相關的）：與你的需求相關</li>
  <li><strong>T</strong>ime-bound（有時限的）：例如「3個月內」</li>
</ul>

<h2>錯誤 10：缺乏耐心，期待立即見效</h2>

<p>健身是一場馬拉松，不是短跑。身體的改變需要時間累積。</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467339/premium_photo-1667121496100-ca96e50fbb29_mt5gkz.avif" alt="堅持訓練" width="620" />

<h3>合理的進步時程</h3>
<ul>
  <li><strong>4-6週</strong>：神經適應，力量提升</li>
  <li><strong>8-12週</strong>：開始看到肌肉增長或體脂下降</li>
  <li><strong>6個月</strong>：明顯的體態改變</li>
  <li><strong>1年以上</strong>：顯著的轉變</li>
</ul>

<h2>總結</h2>

<p>避開這些常見錯誤，你的健身之路會更順利！記住：</p>

<ol>
  <li>✅ 做好熱身</li>
  <li>✅ 給身體足夠休息</li>
  <li>✅ 注重飲食</li>
  <li>✅ 保持正確姿勢</li>
  <li>✅ 均衡訓練</li>
  <li>✅ 重視複合動作</li>
  <li>✅ 選擇適當重量</li>
  <li>✅ 控制休息時間</li>
  <li>✅ 設定明確目標</li>
  <li>✅ 保持耐心與毅力</li>
</ol>

<p><strong>健身是一輩子的事，慢慢來，比較快！💪</strong></p>',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467353/photo-1595500381966-eee2034aae48_vdqwoh.avif',
    '健身知識,新手教學',
    '新手健身,健身錯誤,健身指南,訓練技巧,健身建議',
    'published',
    TRUE,
    CURRENT_TIMESTAMP
  ) ON CONFLICT (article_slug) DO UPDATE SET
    article_title = EXCLUDED.article_title,
    updated_at = CURRENT_TIMESTAMP;

  -- 文章 2: 增肌飲食完整攻略
  INSERT INTO public.articles (
    author_id, article_title, article_slug, article_description,
    article_content, article_thumbnail_url, article_category,
    article_keywords, status, is_featured, published_at
  ) VALUES (
    admin_user_id,
    '增肌飲食完整攻略：從熱量計算到meal prep',
    'test-muscle-building-diet-guide',
    '想要增肌卻不知道怎麼吃？本文從熱量計算、營養素比例到實際meal prep，手把手教你打造完美增肌飲食計畫。',
    '<h1>增肌飲食完整攻略</h1>

<p>常聽人說「三分練，七分吃」，這句話一點都不誇張。即使訓練再刻苦，如果飲食跟不上，增肌效果也會大打折扣。今天就來分享完整的增肌飲食攻略！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467333/photo-1718347478724-d13189138aa2_v0ygin.avif" alt="增肌飲食" width="700" />

<h2>第一步：計算你的 TDEE</h2>

<p>TDEE（Total Daily Energy Expenditure）是你每天消耗的總熱量，包含：</p>

<ul>
  <li><strong>BMR</strong>（基礎代謝率）：維持生命所需的最低熱量</li>
  <li><strong>NEAT</strong>（非運動性活動）：日常活動消耗</li>
  <li><strong>EAT</strong>（運動消耗）：訓練和運動</li>
  <li><strong>TEF</strong>（食物熱效應）：消化食物消耗的熱量</li>
</ul>

<h3>簡易 TDEE 計算公式</h3>

<ol>
  <li>計算 BMR：
    <ul>
      <li>男性：10 × 體重(kg) + 6.25 × 身高(cm) - 5 × 年齡 + 5</li>
      <li>女性：10 × 體重(kg) + 6.25 × 身高(cm) - 5 × 年齡 - 161</li>
    </ul>
  </li>
  <li>乘以活動係數：
    <ul>
      <li>久坐不動：BMR × 1.2</li>
      <li>輕度活動（每週1-3次）：BMR × 1.375</li>
      <li>中度活動（每週3-5次）：BMR × 1.55</li>
      <li>高度活動（每週6-7次）：BMR × 1.725</li>
      <li>極高活動（每天訓練+體力工作）：BMR × 1.9</li>
    </ul>
  </li>
</ol>

<h2>第二步：設定熱量目標</h2>

<p>增肌需要熱量盈餘，但不是越多越好！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467346/photo-1513836279014-a89f7a76ae86_zgrnqe.avif" alt="營養計算" width="600" />

<h3>建議的熱量盈餘</h3>

<ul>
  <li><strong>新手（訓練<6個月）</strong>：TDEE + 400-500大卡</li>
  <li><strong>中階（訓練6個月-2年）</strong>：TDEE + 300-400大卡</li>
  <li><strong>進階（訓練>2年）</strong>：TDEE + 200-300大卡</li>
</ul>

<blockquote>
<p>💡 <strong>重點</strong>：熱量盈餘太大會增加過多脂肪，太小則增肌效果不佳。建議每週體重增加0.25-0.5%。</p>
</blockquote>

<h2>第三步：設定營養素比例</h2>

<h3>蛋白質 (Protein)</h3>

<p>肌肉生長的關鍵！</p>

<ul>
  <li><strong>建議攝取量</strong>：每公斤體重1.6-2.2克</li>
  <li><strong>70kg的人</strong>：112-154克/天</li>
  <li><strong>優質來源</strong>：
    <ul>
      <li>動物性：雞胸肉、牛肉、魚肉、雞蛋、牛奶</li>
      <li>植物性：豆腐、豆漿、扁豆、藜麥</li>
    </ul>
  </li>
</ul>

<youtube url="https://www.youtube.com/watch?v=SIfJnmyNO-g" width="560"></youtube>

<h3>碳水化合物 (Carbohydrates)</h3>

<p>提供訓練能量和幫助恢復。</p>

<ul>
  <li><strong>建議攝取量</strong>：每公斤體重4-7克</li>
  <li><strong>70kg的人</strong>：280-490克/天</li>
  <li><strong>優質來源</strong>：
    <ul>
      <li>複合碳水：糙米、燕麥、地瓜、全麥麵包</li>
      <li>簡單碳水（訓練前後）：香蕉、白米、運動飲料</li>
    </ul>
  </li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/premium_photo-1661371836399-737ebcbef80e_b8vsdj.avif" alt="健康碳水" width="550" />

<h3>脂肪 (Fat)</h3>

<p>調節激素、保護器官。</p>

<ul>
  <li><strong>建議攝取量</strong>：總熱量的20-30%</li>
  <li><strong>優質來源</strong>：
    <ul>
      <li>堅果、酪梨、橄欖油、深海魚油、亞麻籽</li>
    </ul>
  </li>
</ul>

<h2>第四步：營養時機 (Nutrient Timing)</h2>

<h3>訓練前（1-2小時）</h3>

<ul>
  <li>碳水化合物：提供能量</li>
  <li>適量蛋白質：防止肌肉分解</li>
  <li>低脂肪：避免消化不良</li>
  <li><strong>範例</strong>：香蕉 + 蛋白粉 or 地瓜 + 雞胸肉</li>
</ul>

<h3>訓練後（30-60分鐘內）</h3>

<p>黃金補充時間！</p>

<ul>
  <li>快速吸收的蛋白質：乳清蛋白</li>
  <li>高GI碳水：促進胰島素分泌，幫助營養吸收</li>
  <li><strong>範例</strong>：乳清蛋白 + 香蕉 or 白飯 + 雞胸肉</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1692607038292-cb94a95a9719_upn4ua.avif" alt="訓練後補充" width="500" />

<h3>睡前</h3>

<ul>
  <li>緩慢吸收的蛋白質：酪蛋白</li>
  <li>低碳水：避免脂肪囤積</li>
  <li><strong>範例</strong>：希臘優格 or 酪蛋白粉</li>
</ul>

<h2>第五步：Meal Prep 實作</h2>

<p>準備好一週的餐點，省時又能確保營養攝取！</p>

<h3>Meal Prep 步驟</h3>

<ol>
  <li><strong>計劃菜單</strong>：列出一週要吃的食物</li>
  <li><strong>採購食材</strong>：週末一次買齊</li>
  <li><strong>批量烹調</strong>：一次準備3-5天份</li>
  <li><strong>分裝保存</strong>：用保鮮盒分好份量</li>
</ol>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467348/photo-1519821172144-4f87d85de2a1_vegpzu.avif" alt="Meal Prep" width="600" />

<h3>範例菜單（70kg男性，TDEE 2500大卡）</h3>

<table>
  <tr>
    <th>餐次</th>
    <th>食物</th>
    <th>熱量</th>
    <th>蛋白質</th>
  </tr>
  <tr>
    <td>早餐</td>
    <td>燕麥100g + 香蕉1根 + 雞蛋3顆</td>
    <td>650</td>
    <td>30g</td>
  </tr>
  <tr>
    <td>午餐</td>
    <td>糙米200g + 雞胸肉200g + 青菜</td>
    <td>700</td>
    <td>50g</td>
  </tr>
  <tr>
    <td>訓練前</td>
    <td>地瓜150g + 乳清蛋白30g</td>
    <td>350</td>
    <td>35g</td>
  </tr>
  <tr>
    <td>訓練後</td>
    <td>白飯150g + 雞胸肉150g + 香蕉</td>
    <td>550</td>
    <td>40g</td>
  </tr>
  <tr>
    <td>晚餐</td>
    <td>地瓜150g + 鮭魚200g + 青菜</td>
    <td>600</td>
    <td>45g</td>
  </tr>
  <tr>
    <td>睡前</td>
    <td>希臘優格200g + 堅果30g</td>
    <td>350</td>
    <td>25g</td>
  </tr>
  <tr>
    <td><strong>總計</strong></td>
    <td></td>
    <td><strong>3200</strong></td>
    <td><strong>225g</strong></td>
  </tr>
</table>

<h2>第六步：補充品建議</h2>

<p>補充品不是必須，但可以讓飲食更方便。</p>

<h3>推薦補充品</h3>

<ol>
  <li><strong>乳清蛋白</strong>：訓練後快速補充</li>
  <li><strong>肌酸</strong>：提升肌力表現（每天5g）</li>
  <li><strong>綜合維他命</strong>：補足微量營養素</li>
  <li><strong>魚油</strong>：Omega-3，抗發炎</li>
  <li><strong>BCAA</strong>：訓練中補充（可選）</li>
</ol>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/photo-1748261347768-a32434751a9a_u85qf0.avif" alt="補充品" width="480" />

<h2>常見問題 Q&A</h2>

<h3>Q1: 一定要吃那麼多蛋白質嗎？</h3>
<p>A: 研究顯示，每公斤1.6-2.2克是最佳增肌範圍。超過這個範圍並不會帶來更多好處。</p>

<h3>Q2: 可以只靠蛋白粉增肌嗎？</h3>
<p>A: 不建議。天然食物提供更完整的營養素。蛋白粉只是「補充」，不是主食。</p>

<h3>Q3: 增肌一定會變胖嗎？</h3>
<p>A: 適度的熱量盈餘+正確訓練，可以讓肌肉增長多於脂肪囤積。通常增肌期會增加一些體脂，這是正常的。</p>

<h3>Q4: 需要計算得那麼精準嗎？</h3>
<p>A: 初期建議精準計算，了解食物的熱量。熟悉後可以憑經驗估算。</p>

<h2>總結</h2>

<p>增肌飲食的核心原則：</p>

<ul>
  <li>✅ 適度熱量盈餘（TDEE + 200-500大卡）</li>
  <li>✅ 充足蛋白質（每公斤1.6-2.2克）</li>
  <li>✅ 足夠碳水（訓練日多吃，休息日減少）</li>
  <li>✅ 健康脂肪（總熱量的20-30%）</li>
  <li>✅ 注意營養時機（訓練前後特別重要）</li>
  <li>✅ Meal prep 讓執行更容易</li>
  <li>✅ 補充品輔助，但非必須</li>
</ul>

<p><strong>記住：飲食要能長期執行才有意義。找到適合自己的方式，堅持下去！💪</strong></p>',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467333/photo-1718347478724-d13189138aa2_v0ygin.avif',
    '營養知識,飲食計畫',
    '增肌飲食,營養計算,TDEE,蛋白質,meal prep,增肌',
    'published',
    TRUE,
    CURRENT_TIMESTAMP
  ) ON CONFLICT (article_slug) DO UPDATE SET
    article_title = EXCLUDED.article_title,
    updated_at = CURRENT_TIMESTAMP;

  -- 文章 3: 居家徒手訓練計畫
  INSERT INTO public.articles (
    author_id, article_title, article_slug, article_description,
    article_content, article_thumbnail_url, article_category,
    article_keywords, status, is_featured, published_at
  ) VALUES (
    admin_user_id,
    '30天居家徒手訓練挑戰：不用器材也能練出好身材',
    'test-30-day-home-workout',
    '沒時間去健身房？沒關係！這個30天居家訓練計畫，讓你只用自己的體重就能達到顯著效果。',
    '<h1>30天居家徒手訓練挑戰</h1>

<p>疫情期間無法去健身房？還是工作太忙沒時間？別擔心！徒手訓練一樣可以達到很好的效果。今天分享一個完整的30天居家訓練計畫！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467342/photo-1554475900-0a0350e3fc7b_orcwu4.avif" alt="居家訓練" width="700" />

<h2>為什麼徒手訓練很棒？</h2>

<ul>
  <li>🏠 <strong>隨時隨地</strong>：不受時間地點限制</li>
  <li>💰 <strong>零成本</strong>：不需要任何器材</li>
  <li>🎯 <strong>功能性強</strong>：訓練多個肌群協同作用</li>
  <li>⚖️ <strong>體重管理</strong>：學習控制自己的身體</li>
  <li>🔰 <strong>適合新手</strong>：從基礎動作開始</li>
</ul>

<h2>訓練前須知</h2>

<h3>你需要準備</h3>
<ul>
  <li>瑜珈墊或毛巾</li>
  <li>舒適的運動服</li>
  <li>水瓶</li>
  <li>20-30分鐘的時間</li>
  <li>願意挑戰自己的心</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467350/photo-1580870069867-74c57ee1bb07_dmyfqc.avif" alt="準備運動" width="550" />

<h3>安全提醒</h3>
<ul>
  <li>⚠️ 訓練前一定要熱身5-10分鐘</li>
  <li>⚠️ 動作品質優先於次數</li>
  <li>⚠️ 感到關節疼痛要立即停止</li>
  <li>⚠️ 依照自己的能力調整強度</li>
</ul>

<h2>30天訓練計畫</h2>

<h3>第一週：建立基礎（強度50%）</h3>

<p><strong>Day 1, 3, 5 - 全身訓練</strong></p>

<ol>
  <li>開合跳 × 30秒</li>
  <li>深蹲 × 15次 × 3組</li>
  <li>伏地挺身（跪姿可）× 10次 × 3組</li>
  <li>登山者式 × 20次 × 3組</li>
  <li>棒式 × 30秒 × 3組</li>
</ol>

<youtube url="https://www.youtube.com/watch?v=B6VxFOC8Gfw" width="560"></youtube>

<p><strong>Day 2, 4, 6 - 核心與伸展</strong></p>

<ol>
  <li>捲腹 × 20次 × 3組</li>
  <li>側棒式 × 20秒/邊 × 3組</li>
  <li>超人式 × 15次 × 3組</li>
  <li>貓牛式 × 10次</li>
  <li>嬰兒式放鬆 × 1分鐘</li>
</ol>

<p><strong>Day 7 - 休息日</strong></p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467339/premium_photo-1667121496100-ca96e50fbb29_mt5gkz.avif" alt="休息恢復" width="500" />

<h3>第二週：提升強度（強度65%）</h3>

<p><strong>Day 8, 10, 12 - 上半身強化</strong></p>

<ol>
  <li>標準伏地挺身 × 12次 × 4組</li>
  <li>鑽石伏地挺身 × 8次 × 3組</li>
  <li>Pike Push-up × 10次 × 3組</li>
  <li>三頭撐體（用椅子）× 12次 × 3組</li>
  <li>超人式 × 20次 × 3組</li>
</ol>

<p><strong>Day 9, 11, 13 - 下半身強化</strong></p>

<ol>
  <li>深蹲 × 20次 × 4組</li>
  <li>弓箭步 × 15次/腿 × 3組</li>
  <li>保加利亞分腿蹲 × 12次/腿 × 3組</li>
  <li>臀橋 × 20次 × 4組</li>
  <li>小腿提踵 × 25次 × 3組</li>
</ol>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467348/photo-1519821172144-4f87d85de2a1_vegpzu.avif" alt="下半身訓練" width="600" />

<p><strong>Day 14 - 休息日或輕度瑜珈</strong></p>

<h3>第三週：加入變化（強度80%）</h3>

<p><strong>Day 15, 17, 19, 21 - 循環訓練</strong></p>

<p>以下動作連續做，不休息，完成一輪後休息2分鐘，共做4輪：</p>

<ol>
  <li>波比跳 × 10次</li>
  <li>深蹲跳 × 15次</li>
  <li>伏地挺身 × 15次</li>
  <li>登山者式 × 30次</li>
  <li>棒式 × 45秒</li>
</ol>

<youtube url="https://www.youtube.com/watch?v=bVLRxsjM-jQ" width="560"></youtube>

<p><strong>Day 16, 18, 20 - 核心專項</strong></p>

<ol>
  <li>捲腹 × 25次 × 4組</li>
  <li>俄羅斯轉體 × 30次 × 3組</li>
  <li>腳踏車捲腹 × 40次 × 3組</li>
  <li>側棒式 × 40秒/邊 × 3組</li>
  <li>死蟲式 × 20次 × 3組</li>
  <li>棒式 × 60秒 × 3組</li>
</ol>

<p><strong>Day 22 - 休息日</strong></p>

<h3>第四週：極限挑戰（強度100%）</h3>

<p><strong>Day 23, 25, 27 - HIIT 訓練</strong></p>

<p>每個動作40秒全力，休息20秒，共做5輪：</p>

<ol>
  <li>波比跳</li>
  <li>高抬腿</li>
  <li>深蹲跳</li>
  <li>伏地挺身</li>
  <li>登山者式</li>
</ol>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1707135719544-ce905e45f2ec_eq9ejf.avif" alt="HIIT訓練" width="580" />

<p><strong>Day 24, 26, 28 - 全身耐力</strong></p>

<ol>
  <li>深蹲 × 50次</li>
  <li>伏地挺身 × 30次</li>
  <li>弓箭步 × 40次（20/腿）</li>
  <li>棒式 × 90秒</li>
  <li>波比跳 × 20次</li>
</ol>

<p><strong>Day 29 - 輕度恢復訓練</strong></p>

<p><strong>Day 30 - 挑戰賽！</strong></p>

<p>完成以下挑戰，記錄你的時間：</p>

<ul>
  <li>100個深蹲</li>
  <li>50個伏地挺身</li>
  <li>50個仰臥起坐</li>
  <li>2分鐘棒式</li>
  <li>30個波比跳</li>
</ul>

<h2>進階變化動作</h2>

<h3>伏地挺身系列</h3>
<ul>
  <li>📈 <strong>進階</strong>：單手伏地挺身、拍手伏地挺身</li>
  <li>📉 <strong>簡化</strong>：上斜伏地挺身（手撐高處）</li>
</ul>

<h3>深蹲系列</h3>
<ul>
  <li>📈 <strong>進階</strong>：單腳深蹲（手槍式）、跳躍深蹲</li>
  <li>📉 <strong>簡化</strong>：半蹲、扶牆深蹲</li>
</ul>

<h3>棒式系列</h3>
<ul>
  <li>📈 <strong>進階</strong>：單手棒式、抬腳棒式、移動棒式</li>
  <li>📉 <strong>簡化</strong>：膝蓋著地棒式、縮短時間</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/premium_photo-1661371836399-737ebcbef80e_b8vsdj.avif" alt="變化動作" width="520" />

<h2>飲食建議</h2>

<p>訓練只是一半，飲食同樣重要！</p>

<h3>增肌者</h3>
<ul>
  <li>熱量：TDEE + 300-400大卡</li>
  <li>蛋白質：每公斤1.8-2.2克</li>
  <li>多餐：3正餐 + 2-3點心</li>
</ul>

<h3>減脂者</h3>
<ul>
  <li>熱量：TDEE - 300-500大卡</li>
  <li>蛋白質：每公斤2-2.5克（保留肌肉）</li>
  <li>碳水：訓練日多吃，休息日少吃</li>
</ul>

<h2>追蹤進度</h2>

<p>建議每週記錄：</p>

<ul>
  <li>📏 體重與體脂率</li>
  <li>📐 身體圍度（胸、腰、臂、腿）</li>
  <li>📸 進度照片（同樣光線、角度）</li>
  <li>💪 最大次數記錄</li>
  <li>✍️ 訓練日誌與心得</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1692607038292-cb94a95a9719_upn4ua.avif" alt="進度追蹤" width="500" />

<h2>常見問題</h2>

<h3>Q: 徒手訓練能增肌嗎？</h3>
<p>A: 可以！尤其是新手，徒手訓練就能帶來顯著效果。進階後可以增加難度（單手、單腳變化）或增加次數。</p>

<h3>Q: 一定要連續30天嗎？</h3>
<p>A: 不一定。重點是養成習慣。如果需要多休息一天也沒關係，不要有罪惡感。</p>

<h3>Q: 沒時間完成整套怎麼辦？</h3>
<p>A: 優先做複合動作（深蹲、伏地挺身、波比跳），即使只有10分鐘也能有效果。</p>

<h3>Q: 30天後該怎麼辦？</h3>
<p>A: 可以：
  <ul>
    <li>重複挑戰，挑戰更高次數</li>
    <li>嘗試更難的變化動作</li>
    <li>加入器材訓練（啞鈴、彈力帶）</li>
    <li>去健身房進行重量訓練</li>
  </ul>
</p>

<h2>成功秘訣</h2>

<ul>
  <li>✅ <strong>設定提醒</strong>：每天固定時間訓練</li>
  <li>✅ <strong>找夥伴</strong>：互相督促、分享進度</li>
  <li>✅ <strong>記錄過程</strong>：拍照、寫日記</li>
  <li>✅ <strong>慶祝小勝利</strong>：完成一週就獎勵自己</li>
  <li>✅ <strong>享受過程</strong>：放音樂、找樂趣</li>
</ul>

<h2>總結</h2>

<p>30天可以改變很多事！關鍵是：</p>

<ol>
  <li>💯 <strong>全力以赴</strong>：每次訓練都認真對待</li>
  <li>🎯 <strong>專注動作品質</strong>：慢慢做，感受肌肉</li>
  <li>🍎 <strong>搭配正確飲食</strong>：7分吃3分練</li>
  <li>😴 <strong>充足休息</strong>：讓肌肉恢復生長</li>
  <li>📈 <strong>持續進步</strong>：每週挑戰自己一點點</li>
</ol>

<p><strong>準備好開始你的30天挑戰了嗎？Let''s do this! 💪🔥</strong></p>',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467342/photo-1554475900-0a0350e3fc7b_orcwu4.avif',
    '訓練計畫,居家訓練',
    '居家訓練,徒手訓練,30天挑戰,健身計畫,無器材訓練',
    'published',
    FALSE,
    CURRENT_TIMESTAMP
  ) ON CONFLICT (article_slug) DO UPDATE SET
    article_title = EXCLUDED.article_title,
    updated_at = CURRENT_TIMESTAMP;

  -- 文章 4: 減脂不減肌
  INSERT INTO public.articles (
    author_id, article_title, article_slug, article_description,
    article_content, article_thumbnail_url, article_category,
    article_keywords, status, is_featured, published_at
  ) VALUES (
    admin_user_id,
    '減脂不減肌：科學化減脂完整指南',
    'test-fat-loss-guide',
    '減脂期最怕肌肉流失？本文教你如何透過正確的飲食、訓練和休息策略，在減脂的同時最大程度保留肌肉量。',
    '<h1>減脂不減肌：科學化減脂完整指南</h1>

<p>很多人減脂都遇到同樣的問題：體重下降了，但肌肉也跟著流失，最後變成「泡芙人」。今天就來分享如何科學化減脂，同時保留辛苦練出來的肌肉！</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1707135719544-ce905e45f2ec_eq9ejf.avif" alt="減脂訓練" width="700" />

<h2>減脂的基本原理</h2>

<p>減脂的核心公式很簡單：</p>

<blockquote>
<p><strong>熱量赤字 = 消耗熱量 > 攝取熱量</strong></p>
</blockquote>

<p>但是，<strong>如何製造熱量赤字</strong>才是關鍵！</p>

<h3>錯誤的減脂方法</h3>
<ul>
  <li>❌ 節食過度（熱量赤字太大）</li>
  <li>❌ 只做有氧，不做重訓</li>
  <li>❌ 蛋白質攝取不足</li>
  <li>❌ 減脂速度太快</li>
  <li>❌ 忽略休息與恢復</li>
</ul>

<h3>正確的減脂方法</h3>
<ul>
  <li>✅ 適度熱量赤字（-300至-500大卡）</li>
  <li>✅ 維持重量訓練</li>
  <li>✅ 高蛋白飲食</li>
  <li>✅ 循序漸進（每週減0.5-1%體重）</li>
  <li>✅ 充足睡眠與恢復</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467339/premium_photo-1667121496100-ca96e50fbb29_mt5gkz.avif" alt="科學減脂" width="600" />

<h2>飲食策略</h2>

<h3>1. 計算你的維持熱量（TDEE）</h3>

<p>使用前面提到的公式計算，或觀察2週的體重變化來估算。</p>

<h3>2. 設定合理的熱量赤字</h3>

<table>
  <tr>
    <th>目標</th>
    <th>熱量赤字</th>
    <th>預期減重速度</th>
  </tr>
  <tr>
    <td>溫和減脂</td>
    <td>-300大卡</td>
    <td>每週0.3-0.5kg</td>
  </tr>
  <tr>
    <td>標準減脂</td>
    <td>-500大卡</td>
    <td>每週0.5-0.7kg</td>
  </tr>
  <tr>
    <td>積極減脂</td>
    <td>-700大卡</td>
    <td>每週0.7-1kg</td>
  </tr>
</table>

<blockquote>
<p>💡 <strong>建議</strong>：越接近目標體重，赤字應該越小，以保留更多肌肉。</p>
</blockquote>

<h3>3. 提高蛋白質攝取</h3>

<p>減脂期的蛋白質需求<strong>更高</strong>！</p>

<ul>
  <li><strong>建議攝取量</strong>：每公斤體重2-2.5克</li>
  <li><strong>原因</strong>：
    <ul>
      <li>保護肌肉不被分解</li>
      <li>增加飽足感</li>
      <li>提高食物熱效應（TEF）</li>
    </ul>
  </li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467346/photo-1513836279014-a89f7a76ae86_zgrnqe.avif" alt="高蛋白飲食" width="550" />

<h3>4. 循環碳水策略</h3>

<p>不是每天都要低碳！</p>

<ul>
  <li><strong>訓練日</strong>：高碳（每公斤4-6克）</li>
  <li><strong>休息日</strong>：低碳（每公斤1-2克）</li>
  <li><strong>好處</strong>：
    <ul>
      <li>訓練日有足夠能量</li>
      <li>休息日促進脂肪燃燒</li>
      <li>維持代謝不下降</li>
    </ul>
  </li>
</ul>

<youtube url="https://www.youtube.com/watch?v=vZfdHaPjfzY" width="560"></youtube>

<h3>5. 健康脂肪</h3>

<p>不要怕脂肪！健康脂肪有助於：</p>

<ul>
  <li>維持激素平衡（睪固酮、生長激素）</li>
  <li>增加飽足感</li>
  <li>幫助脂溶性維生素吸收</li>
</ul>

<p><strong>建議攝取量</strong>：總熱量的20-30%</p>

<h2>訓練策略</h2>

<h3>1. 維持重量訓練強度</h3>

<p><strong>這是最重要的一點！</strong></p>

<ul>
  <li>不要因為減脂就降低訓練重量</li>
  <li>保持訓練強度，告訴身體「我還需要這些肌肉」</li>
  <li>可以減少訓練量（組數），但不要減少強度（重量）</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/premium_photo-1661371836399-737ebcbef80e_b8vsdj.avif" alt="重量訓練" width="580" />

<h3>2. 重訓 vs 有氧</h3>

<table>
  <tr>
    <th>訓練類型</th>
    <th>優先度</th>
    <th>頻率</th>
  </tr>
  <tr>
    <td>重量訓練</td>
    <td>⭐⭐⭐⭐⭐</td>
    <td>每週3-5次</td>
  </tr>
  <tr>
    <td>HIIT</td>
    <td>⭐⭐⭐⭐</td>
    <td>每週2-3次</td>
  </tr>
  <tr>
    <td>低強度有氧</td>
    <td>⭐⭐⭐</td>
    <td>每天可做（不影響恢復）</td>
  </tr>
</table>

<h3>3. 訓練分配建議</h3>

<p><strong>每週訓練計畫範例</strong></p>

<ul>
  <li><strong>週一</strong>：上半身推（胸、肩、三頭）</li>
  <li><strong>週二</strong>：下半身（腿、臀）</li>
  <li><strong>週三</strong>：HIIT 20分鐘</li>
  <li><strong>週四</strong>：上半身拉（背、二頭）</li>
  <li><strong>週五</strong>：下半身 + 核心</li>
  <li><strong>週六</strong>：輕度有氧或主動恢復</li>
  <li><strong>週日</strong>：完全休息</li>
</ul>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467348/photo-1519821172144-4f87d85de2a1_vegpzu.avif" alt="訓練計畫" width="600" />

<h3>4. 有氧訓練技巧</h3>

<p><strong>HIIT 的優勢</strong></p>

<ul>
  <li>時間短（15-20分鐘）</li>
  <li>後燃效應高（訓練後持續燃燒熱量）</li>
  <li>較能保留肌肉</li>
</ul>

<p><strong>LISS 的優勢</strong></p>

<ul>
  <li>不影響重訓恢復</li>
  <li>可每天進行</li>
  <li>適合低體能或受傷者</li>
  <li>燃燒脂肪比例較高</li>
</ul>

<h2>補充品建議</h2>

<h3>有幫助的補充品</h3>

<ol>
  <li><strong>乳清蛋白</strong>：方便達到蛋白質需求</li>
  <li><strong>肌酸</strong>：維持訓練表現</li>
  <li><strong>咖啡因</strong>：提升訓練能量（訓練前攝取）</li>
  <li><strong>BCAA/EAA</strong>：訓練中補充，減少肌肉分解</li>
  <li><strong>魚油</strong>：抗發炎，幫助恢復</li>
  <li><strong>綜合維他命</strong>：補足微量營養素</li>
</ol>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467332/photo-1748261347768-a32434751a9a_u85qf0.avif" alt="補充品" width="500" />

<h3>不推薦的補充品</h3>

<ul>
  <li>❌ 減脂藥：風險高，效果短暫</li>
  <li>❌ 代餐：不如吃真正的食物</li>
  <li>❌ 排毒產品：身體自己會排毒</li>
</ul>

<h2>恢復與睡眠</h2>

<h3>睡眠的重要性</h3>

<p>睡眠不足會：</p>

<ul>
  <li>📉 降低瘦體素（增加食慾）</li>
  <li>📈 提高可體松（促進脂肪儲存、分解肌肉）</li>
  <li>😴 降低訓練表現</li>
  <li>🍔 增加對高熱量食物的渴望</li>
</ul>

<p><strong>建議睡眠時間</strong>：7-9小時</p>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467350/photo-1580870069867-74c57ee1bb07_dmyfqc.avif" alt="休息恢復" width="550" />

<h3>提升睡眠品質</h3>

<ul>
  <li>固定作息時間</li>
  <li>睡前2小時避免藍光</li>
  <li>保持房間涼爽、黑暗</li>
  <li>避免睡前大餐</li>
  <li>適度運動（但不要太晚）</li>
</ul>

<h2>監測進度</h2>

<h3>不要只看體重！</h3>

<p>減脂期應該追蹤：</p>

<ol>
  <li><strong>體重</strong>：每週測量1-2次（同樣條件）</li>
  <li><strong>體脂率</strong>：每2週測量</li>
  <li><strong>圍度</strong>：腰圍、大腿圍等</li>
  <li><strong>進度照片</strong>：每2週同樣光線、角度拍攝</li>
  <li><strong>訓練表現</strong>：力量有維持嗎？</li>
  <li><strong>感覺</strong>：精神、食慾、恢復狀況</li>
</ol>

<img src="https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1692607038292-cb94a95a9719_upn4ua.avif" alt="進度追蹤" width="520" />

<h2>常見問題</h2>

<h3>Q: 減脂一定會掉肌肉嗎？</h3>
<p>A: 不一定！遵循本文的策略，可以最大程度保留肌肉。新手甚至可能同時增肌減脂。</p>

<h3>Q: 減脂速度越快越好？</h3>
<p>A: 不是！太快的減脂（>每週1%體重）會增加肌肉流失風險。慢慢來，比較好。</p>

<h3>Q: 可以只靠飲食減脂，不運動嗎？</h3>
<p>A: 可以瘦，但會流失大量肌肉，降低代謝率，容易復胖。</p>

<h3>Q: 遇到減脂平台期怎麼辦？</h3>
<p>A: 
  <ul>
    <li>重新計算TDEE（體重下降後會降低）</li>
    <li>增加NEAT（日常活動量）</li>
    <li>調整碳水循環</li>
    <li>偶爾安排高熱量日（refeed）</li>
  </ul>
</p>

<h2>總結：減脂不減肌的7大關鍵</h2>

<ol>
  <li>✅ <strong>適度熱量赤字</strong>：-300至-500大卡，不要太激進</li>
  <li>✅ <strong>高蛋白飲食</strong>：每公斤2-2.5克</li>
  <li>✅ <strong>循環碳水</strong>：訓練日多吃，休息日少吃</li>
  <li>✅ <strong>維持訓練強度</strong>：重量不降，告訴身體需要肌肉</li>
  <li>✅ <strong>適量有氧</strong>：HIIT > LISS，但不過度</li>
  <li>✅ <strong>充足睡眠</strong>：7-9小時，品質要好</li>
  <li>✅ <strong>有耐心</strong>：每週減0.5-1%體重，循序漸進</li>
</ol>

<p><strong>記住：減脂是馬拉松，不是短跑。慢慢來，保留肌肉，才能有健康、持久的好身材！💪</strong></p>',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1758467331/photo-1707135719544-ce905e45f2ec_eq9ejf.avif',
    '減脂知識,營養知識',
    '減脂,保留肌肉,科學減脂,熱量赤字,高蛋白飲食',
    'published',
    FALSE,
    CURRENT_TIMESTAMP
  ) ON CONFLICT (article_slug) DO UPDATE SET
    article_title = EXCLUDED.article_title,
    updated_at = CURRENT_TIMESTAMP;

  RAISE NOTICE '✅ 測試資料插入完成！';
  RAISE NOTICE '📊 課程數量: 4 (3 published, 1 draft)';
  RAISE NOTICE '📝 文章數量: 4 (4 published)';

END $$;
