-- ============================================================
-- Supabase 資料庫修正與課程資料匯入
-- 請在 Supabase Dashboard > SQL Editor 中依序執行
-- ============================================================

-- ============================================================
-- STEP 1: 修正 course_description 欄位長度
-- (目前實際為 VARCHAR(50)，需擴展為 VARCHAR(1000))
-- ============================================================
ALTER TABLE courses ALTER COLUMN course_description TYPE VARCHAR(1000);

-- ============================================================
-- STEP 2: 清空所有舊課程資料
-- ============================================================
DELETE FROM courses;

-- 重置序列（讓 course_id 從 1 開始）
ALTER SEQUENCE courses_course_id_seq RESTART WITH 1;

-- ============================================================
-- STEP 3: 插入 9 門真實課程
-- ============================================================

-- 1. 變現陪跑（三個月方案）
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '變現陪跑（三個月方案）',
  'monetization-coaching-3m',
  '專為私人教練設計的商業實戰培訓系統。三個月業績衝刺期，包含 1 對 1 培訓 12 次，從銷售成交、客戶經營到自媒體品牌，帶你從教練蛻變成經營者。',
  '<h2>課程介紹</h2><p>還在靠專業硬撐，卻不知道怎麼把技術變成收入？「變現陪跑」是一套專為私人教練設計的商業實戰培訓系統，從銷售成交、客戶經營到自媒體品牌，帶你從教練蛻變成經營者。</p><h3>這堂課適合誰？</h3><ul><li>有專業能力，但業績不穩定的教練</li><li>不擅長銷售破冰、總是被拒絕的教練</li><li>想建立長期客源、不再每月從零開始的教練</li><li>想經營個人品牌、打造自媒體影響力的教練</li></ul><h3>第一階段（0–3 個月）：業績衝刺期</h3><p><strong>目標：建立穩定的新客成交流程</strong></p><ul><li>體驗課成交系統——從破冰到簽約的完整 SOP</li><li>現場開發實戰——學會主動出擊、有效邀約</li><li>成交進度追蹤——用數據管理你的業績</li><li>每週視訊會議——即時覆盤、調整策略</li></ul><h3>陪跑制度</h3><ul><li>每週一次視訊會議，進度檢核與行動指導</li><li>指標追蹤：邀約數、成交數、續約率</li><li>即時訊息 24 小時回覆</li><li>每季成果檢核與策略調整</li></ul><h3>方案內容</h3><p>三個月方案：1 對 1 培訓 12 次</p><p>額外附贈總值 NT$ 41,420 的線上課程</p><h3>你將學到</h3><ul><li>建立一套可複製的成交系統</li><li>學會讀懂客戶心理，提高成交率</li><li>打造穩定的續約與轉介紹流程</li><li>掌握自媒體經營的核心能力</li><li>從教練思維轉換為經營者思維</li><li>用數據驅動業績成長</li></ul>',
  '變現,陪跑,私人教練,業績,銷售,成交,商業培訓,三個月',
  '主方案',
  'beginner',
  12, 32800.00, 'TWD', 90, 'published'
);

-- 2. 變現陪跑（六個月方案）
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '變現陪跑（六個月方案）',
  'monetization-coaching-6m',
  '專為私人教練設計的商業實戰培訓系統。六個月完整培訓，包含 1 對 1 培訓 24 次，涵蓋業績衝刺與長期收入建立兩大階段。',
  '<h2>課程介紹</h2><p>還在靠專業硬撐，卻不知道怎麼把技術變成收入？「變現陪跑」是一套專為私人教練設計的商業實戰培訓系統，從銷售成交、客戶經營到自媒體品牌，帶你從教練蛻變成經營者。</p><h3>這堂課適合誰？</h3><ul><li>有專業能力，但業績不穩定的教練</li><li>不擅長銷售破冰、總是被拒絕的教練</li><li>想建立長期客源、不再每月從零開始的教練</li><li>想經營個人品牌、打造自媒體影響力的教練</li></ul><h3>第一階段（0–3 個月）：業績衝刺期</h3><p><strong>目標：建立穩定的新客成交流程</strong></p><ul><li>體驗課成交系統——從破冰到簽約的完整 SOP</li><li>現場開發實戰——學會主動出擊、有效邀約</li><li>成交進度追蹤——用數據管理你的業績</li><li>每週視訊會議——即時覆盤、調整策略</li></ul><h3>第二階段（3–6 個月）：建立長期收入</h3><p><strong>目標：提升續約率與轉介紹</strong></p><ul><li>會員關係心理學——讀懂客戶的真實需求</li><li>續約情緒時機——抓住續約的黃金節點</li><li>轉介紹流程——讓舊客戶幫你帶新客戶</li><li>客戶管理表單——系統化你的客戶資料庫</li></ul><h3>陪跑制度</h3><ul><li>每週一次視訊會議，進度檢核與行動指導</li><li>指標追蹤：邀約數、成交數、續約率</li><li>即時訊息 24 小時回覆</li><li>每季成果檢核與策略調整</li></ul><h3>方案內容</h3><p>六個月方案：1 對 1 培訓 24 次</p><p>額外附贈總值 NT$ 41,420 的線上課程</p><h3>你將學到</h3><ul><li>建立一套可複製的成交系統</li><li>學會讀懂客戶心理，提高成交率</li><li>打造穩定的續約與轉介紹流程</li><li>掌握自媒體經營的核心能力</li><li>從教練思維轉換為經營者思維</li><li>用數據驅動業績成長</li></ul>',
  '變現,陪跑,私人教練,業績,銷售,成交,續約,轉介紹,六個月',
  '主方案',
  'beginner',
  24, 59800.00, 'TWD', 180, 'published'
);

-- 3. 變現陪跑（一年方案）
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '變現陪跑（一年方案）',
  'monetization-coaching-1y',
  '專為私人教練設計的完整商業實戰培訓系統。一年期全方位培訓，包含 1 對 1 培訓 48 次，從業績衝刺、長期收入到個人品牌與自媒體三大階段完整涵蓋。',
  '<h2>課程介紹</h2><p>還在靠專業硬撐，卻不知道怎麼把技術變成收入？「變現陪跑」是一套專為私人教練設計的商業實戰培訓系統，從銷售成交、客戶經營到自媒體品牌，帶你從教練蛻變成經營者。</p><h3>這堂課適合誰？</h3><ul><li>有專業能力，但業績不穩定的教練</li><li>不擅長銷售破冰、總是被拒絕的教練</li><li>想建立長期客源、不再每月從零開始的教練</li><li>想經營個人品牌、打造自媒體影響力的教練</li></ul><h3>第一階段（0–3 個月）：業績衝刺期</h3><ul><li>體驗課成交系統——從破冰到簽約的完整 SOP</li><li>現場開發實戰——學會主動出擊、有效邀約</li><li>成交進度追蹤——用數據管理你的業績</li><li>每週視訊會議——即時覆盤、調整策略</li></ul><h3>第二階段（3–6 個月）：建立長期收入</h3><ul><li>會員關係心理學——讀懂客戶的真實需求</li><li>續約情緒時機——抓住續約的黃金節點</li><li>轉介紹流程——讓舊客戶幫你帶新客戶</li><li>客戶管理表單——系統化你的客戶資料庫</li></ul><h3>第三階段（6–12 個月）：個人品牌與自媒體</h3><ul><li>自媒體定位——找到你的專屬風格與受眾</li><li>口播腳本產出——輕鬆產出有價值的內容</li><li>鏡頭表現力訓練——從害羞到自信面對鏡頭</li><li>打造個人商業模式——讓品牌為你帶來客戶</li></ul><h3>陪跑制度</h3><ul><li>每週一次視訊會議，進度檢核與行動指導</li><li>指標追蹤：邀約數、成交數、續約率</li><li>即時訊息 24 小時回覆</li><li>每季成果檢核與策略調整</li></ul><h3>方案內容</h3><p>一年方案：1 對 1 培訓 48 次（最完整方案）</p><p>額外附贈總值 NT$ 41,420 的線上課程</p>',
  '變現,陪跑,私人教練,業績,銷售,成交,自媒體,品牌,一年',
  '主方案',
  'advanced',
  48, 118000.00, 'TWD', 365, 'published'
);

-- 4. 表達力心理學
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '表達力心理學',
  'communication-psychology',
  '說服力不是天生的，是可以學的。運用心理學原理提升溝通表達力，在諮詢、銷售、日常對話中更有影響力。',
  '<h2>課程介紹</h2><p>說服力不是天生的，是可以學的。這堂課教你運用心理學原理提升溝通表達力，讓你在諮詢、銷售、日常對話中更有影響力。不管是面對客戶的疑慮還是團隊的溝通，學會用對方式說話，效果完全不同。</p><h3>你將學到</h3><ul><li>掌握影響他人決策的心理學原則</li><li>提升語言組織與說服架構</li><li>學會在壓力下保持清晰表達</li><li>運用非語言溝通強化信任感</li></ul>',
  '表達力,心理學,溝通,說服,銷售技巧,影響力',
  '線上課程',
  'beginner',
  0, 980.00, 'TWD', NULL, 'published'
);

-- 5. 反對問題成交話術
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '反對問題成交話術',
  'objection-handling-scripts',
  '整理出教練最常遇到的反對問題，提供實戰話術模板，讓你從容應對每一個拒絕，把「再想想」變成「我要報名」。',
  '<h2>課程介紹</h2><p>客戶說「太貴了」「我再考慮」「我問問家人」——這些話你聽了多少次？這堂課整理出教練最常遇到的反對問題，並提供實戰話術模板，讓你從容應對每一個拒絕，把「再想想」變成「我要報名」。</p><h3>你將學到</h3><ul><li>拆解客戶常見拒絕背後的真正原因</li><li>針對價格、時間、猶豫等問題的回應話術</li><li>建立不帶壓力的引導式成交流程</li><li>從被動等回覆，變成主動推進成交</li></ul>',
  '反對問題,成交話術,銷售,拒絕處理,話術模板',
  '線上課程',
  'beginner',
  0, 480.00, 'TWD', NULL, 'published'
);

-- 6. 體驗課成交全流程
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '體驗課成交全流程',
  'trial-session-closing',
  '從課前準備、課中引導到課後跟進，完整拆解一堂高轉換率體驗課的每一個環節，讓你的體驗課不再只是免費勞動。',
  '<h2>課程介紹</h2><p>體驗課是教練最重要的成交戰場，但多數教練只會「教動作」，卻不會「賣課程」。這堂課從課前準備、課中引導到課後跟進，完整拆解一堂高轉換率體驗課的每一個環節，讓你的體驗課不再只是免費勞動。</p><h3>課前準備</h3><ul><li>客戶背景分析與需求預判</li><li>體驗課流程設計與時間分配</li></ul><h3>課中引導</h3><ul><li>破冰與信任建立技巧</li><li>痛點挖掘與需求放大</li><li>專業展現與價值傳遞</li></ul><h3>課後成交</h3><ul><li>報價時機與話術</li><li>跟進節奏與訊息模板</li><li>未成交客戶的二次觸達</li></ul><h3>你將學到</h3><ul><li>設計一堂「為成交而生」的體驗課流程</li><li>掌握課中自然過渡到銷售的話術</li><li>建立課後跟進的標準作業流程</li><li>提升體驗課的整體成交轉換率</li></ul>',
  '體驗課,成交,轉換率,銷售流程,破冰,跟進',
  '線上課程',
  'intermediate',
  0, 1980.00, 'TWD', NULL, 'published'
);

-- 7. 私人教練續約必修課
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '私人教練續約必修課',
  'personal-trainer-renewal',
  '專注在「讓買過的人再買」，教你識別續約信號、掌握溝通時機、設計續約方案，建立穩定的長期收入。',
  '<h2>課程介紹</h2><p>開發新客戶的成本是維護舊客戶的五倍。這堂課專注在「讓買過的人再買」，教你識別續約信號、掌握溝通時機、設計續約方案，讓你不再每個月從零開始衝業績，而是建立穩定的長期收入。</p><h3>續約心理學</h3><ul><li>客戶購買週期與決策模式</li><li>影響續約意願的關鍵因素</li></ul><h3>時機與話術</h3><ul><li>最佳續約溝通時機判斷</li><li>不同情境的續約話術模板</li></ul><h3>方案設計</h3><ul><li>如何設計讓客戶「想續」的方案</li><li>階梯式課程規劃與升級路徑</li></ul><h3>客戶關係管理</h3><ul><li>日常互動維護的頻率與方式</li><li>轉介紹流程設計</li></ul><h3>你將學到</h3><ul><li>辨識客戶的續約信號與最佳時機</li><li>設計具吸引力的續約方案與價格策略</li><li>建立系統化的客戶關係管理流程</li><li>將舊客戶轉化為轉介紹來源</li></ul>',
  '續約,私人教練,客戶關係,轉介紹,長期收入',
  '線上課程',
  'intermediate',
  0, 1980.00, 'TWD', NULL, 'published'
);

-- 8. 一對一陪跑訓練
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '一對一陪跑訓練',
  'one-on-one-coaching',
  '針對你個人狀況量身打造的實戰指導，從你目前的業績瓶頸出發，制定專屬的行動計畫。不是聽課，是真的陪你打仗。',
  '<h2>課程介紹</h2><p>最有效的學習就是有人盯著你做。一對一陪跑訓練是針對你個人狀況量身打造的實戰指導，從你目前的業績瓶頸出發，制定專屬的行動計畫，並在執行過程中即時調整。不是聽課，是真的陪你打仗。</p><h3>課程內容</h3><ul><li>個人業績現況診斷與目標設定</li><li>量身定制的銷售策略與行動計畫</li><li>定期視訊覆盤，追蹤執行成果</li><li>即時訊息支援，遇到問題隨時討論</li><li>話術演練與模擬實戰</li><li>根據進度動態調整策略</li></ul><h3>你將學到</h3><ul><li>找到自己業績停滯的核心問題</li><li>獲得針對個人弱點的改善方案</li><li>在實戰中驗證並優化銷售能力</li><li>建立可持續的業績成長模式</li></ul>',
  '一對一,陪跑訓練,個人指導,業績提升,實戰,銷售策略',
  '一對一服務',
  'intermediate',
  0, 18000.00, 'TWD', 30, 'published'
);

-- 9. 心理韌性與職涯定位
INSERT INTO courses (
  course_title, course_slug, course_description, course_content,
  course_keywords, course_category, course_level,
  lessons_count, price, currency, access_duration_days, status
) VALUES (
  '心理韌性與職涯定位',
  'mental-resilience-career',
  '結合心理學與職涯規劃，幫你釐清內心的方向、強化面對挫折的能力，找到屬於自己的教練職涯定位。',
  '<h2>課程介紹</h2><p>教練這條路，技術只是入場券，真正決定你能走多遠的是心態。這堂課結合心理學與職涯規劃，幫你釐清內心的方向、強化面對挫折的能力，找到屬於自己的教練職涯定位，不再迷茫地消耗熱情。</p><h3>課程內容</h3><ul><li>自我認知與優勢探索</li><li>心理韌性訓練——從容面對拒絕與低潮</li><li>職涯方向定位——找到你想成為的教練樣貌</li><li>目標拆解與行動規劃</li><li>Life Coaching 引導式對話</li><li>建立長期職涯發展藍圖</li></ul><h3>你將學到</h3><ul><li>認識自己的核心優勢與發展方向</li><li>建立面對壓力與挫折的心理調適能力</li><li>制定清晰的短中長期職涯目標</li><li>找到持續前進的內在動力</li></ul>',
  '心理韌性,職涯定位,心理學,Life Coaching,自我認知,目標規劃',
  '一對一服務',
  'beginner',
  0, 18000.00, 'TWD', 30, 'published'
);

-- ============================================================
-- STEP 4: 驗證結果
-- ============================================================
SELECT course_id, course_title, price, currency, status, course_category
FROM courses
ORDER BY course_id;
