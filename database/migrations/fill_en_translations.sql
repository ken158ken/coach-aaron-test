-- =============================================================================
-- English Translation Fill Script
-- Coach Aaron (阿倫教官) Fitness Website
-- Generated: 2026-03-15
-- =============================================================================
-- This script fills all _en translation columns with English translations.
-- Run in Supabase SQL editor.
-- =============================================================================


-- =============================================================================
-- ARTICLES
-- =============================================================================

-- article_id = 1: 新手健身必看：5個常見錯誤
UPDATE public.articles SET
  article_title_en = 'Beginner''s Guide: 5 Common Fitness Mistakes',
  article_description_en = 'Just starting your fitness journey? Find out if you''re making these common beginner mistakes. This article helps you avoid the most frequent fitness pitfalls.',
  article_category_en = 'Fitness Knowledge'
WHERE article_id = 1;

-- article_id = 2: 增肌飲食完整指南
UPDATE public.articles SET
  article_title_en = 'Complete Guide to Muscle-Building Nutrition',
  article_description_en = 'Want to build muscle? Beyond training, nutrition is the key! This article breaks down the complete dietary strategy for the muscle-gain phase.',
  article_category_en = 'Nutrition Knowledge'
WHERE article_id = 2;

-- article_id = 3: 居家徒手訓練計畫
UPDATE public.articles SET
  article_title_en = 'Home Bodyweight Training Program',
  article_description_en = 'No equipment? No problem! A complete home bodyweight training program to keep you in shape without setting foot in a gym.',
  article_category_en = 'Training Plans'
WHERE article_id = 3;

-- article_id = 5: test (skip — test data, content is English "test")
-- article_id = 10: test (skip — test data, content is English "test")

-- article_id = 6: 健身新手必看：避開這10個常見錯誤
UPDATE public.articles SET
  article_title_en = 'Fitness Beginner''s Must-Read: Avoid These 10 Common Mistakes',
  article_description_en = 'Just starting to work out? Make sure to avoid these mistakes! This article covers the 10 most common beginner fitness errors to help you reach your goals more efficiently.',
  article_keywords_en = 'beginner fitness, fitness mistakes, fitness guide, training tips, workout advice',
  article_category_en = 'Fitness Knowledge, Beginner Tutorials'
WHERE article_id = 6;

-- article_id = 7: 增肌飲食完整攻略：從熱量計算到meal prep
UPDATE public.articles SET
  article_title_en = 'Complete Muscle-Building Nutrition Guide: From Calorie Calculation to Meal Prep',
  article_description_en = 'Not sure how to eat for muscle gain? This article walks you through calorie calculation, macronutrient ratios, and practical meal prep — everything you need to build the perfect muscle-building diet.',
  article_keywords_en = 'muscle building diet, nutrition calculation, TDEE, protein, meal prep, muscle gain',
  article_category_en = 'Nutrition Knowledge, Diet Plans'
WHERE article_id = 7;

-- article_id = 8: 30天居家徒手訓練挑戰：不用器材也能練出好身材
UPDATE public.articles SET
  article_title_en = '30-Day Home Bodyweight Training Challenge: Build a Great Physique Without Equipment',
  article_description_en = 'No time to hit the gym? No problem! This 30-day home workout plan lets you achieve significant results using only your bodyweight.',
  article_keywords_en = 'home training, bodyweight training, 30-day challenge, fitness plan, no equipment workout',
  article_category_en = 'Training Plans, Home Workouts'
WHERE article_id = 8;

-- article_id = 9: 減脂不減肌：科學化減脂完整指南
UPDATE public.articles SET
  article_title_en = 'Lose Fat, Not Muscle: The Complete Science-Based Fat Loss Guide',
  article_description_en = 'Worried about losing muscle during a cut? This article teaches you how to use correct nutrition, training, and recovery strategies to maximize muscle retention while losing fat.',
  article_keywords_en = 'fat loss, muscle retention, science-based fat loss, caloric deficit, high-protein diet',
  article_category_en = 'Fat Loss Knowledge, Nutrition Knowledge'
WHERE article_id = 9;


-- =============================================================================
-- COURSES
-- =============================================================================

-- course_id = 1: 變現陪跑（三個月方案）
UPDATE public.courses SET
  course_title_en = 'Revenue Coaching Program (3-Month Plan)',
  course_description_en = 'A business-focused training system designed specifically for personal trainers. A 3-month performance sprint including 12 one-on-one sessions — covering sales closing, client management, and personal branding to transform you from coach to entrepreneur.',
  course_content_en = '<h2>Course Overview</h2><p>Still relying solely on expertise but unsure how to turn your skills into income? The "Revenue Coaching Program" is a business training system designed specifically for personal trainers — covering sales closing, client management, and personal branding to help you evolve from coach to entrepreneur.</p><h3>Who Is This For?</h3><ul><li>Coaches with solid skills but inconsistent revenue</li><li>Coaches who struggle with sales conversations and face frequent rejections</li><li>Coaches who want to build a long-term client base instead of starting from zero each month</li><li>Coaches who want to develop a personal brand and social media presence</li></ul><h3>Phase 1 (Months 0–3): Revenue Sprint</h3><p><strong>Goal: Build a stable new-client closing process</strong></p><ul><li>Trial session closing system — complete SOP from icebreaker to contract signing</li><li>On-site prospecting — learn to proactively reach out and invite effectively</li><li>Closing progress tracking — manage your performance with data</li><li>Weekly video check-ins — real-time review and strategy adjustment</li></ul><h3>Coaching Structure</h3><ul><li>Weekly video meeting for progress review and action guidance</li><li>KPI tracking: invitations, closings, renewal rate</li><li>24/7 instant message support</li><li>Quarterly performance review and strategy adjustment</li></ul><h3>Plan Details</h3><p>3-Month Plan: 12 one-on-one training sessions</p><p>Bonus: Online courses valued at NT$ 41,420</p><h3>What You Will Learn</h3><ul><li>Build a replicable sales closing system</li><li>Learn to read client psychology and increase closing rates</li><li>Create a stable renewal and referral process</li><li>Master the core skills of social media business building</li><li>Shift from a coach mindset to an entrepreneur mindset</li><li>Use data to drive revenue growth</li></ul>',
  course_keywords_en = 'revenue coaching, personal trainer, performance, sales, closing, business training, three months',
  course_category_en = 'Main Plans'
WHERE course_id = 1;

-- course_id = 2: 變現陪跑（六個月方案）
UPDATE public.courses SET
  course_title_en = 'Revenue Coaching Program (6-Month Plan)',
  course_description_en = 'A business training system designed specifically for personal trainers. A comprehensive 6-month program with 24 one-on-one sessions, covering both a revenue sprint phase and a long-term income building phase.',
  course_content_en = '<h2>Course Overview</h2><p>Still relying solely on expertise but unsure how to turn your skills into income? The "Revenue Coaching Program" is a business training system designed specifically for personal trainers — covering sales closing, client management, and personal branding to help you evolve from coach to entrepreneur.</p><h3>Who Is This For?</h3><ul><li>Coaches with solid skills but inconsistent revenue</li><li>Coaches who struggle with sales conversations and face frequent rejections</li><li>Coaches who want to build a long-term client base instead of starting from zero each month</li><li>Coaches who want to develop a personal brand and social media presence</li></ul><h3>Phase 1 (Months 0–3): Revenue Sprint</h3><p><strong>Goal: Build a stable new-client closing process</strong></p><ul><li>Trial session closing system — complete SOP from icebreaker to contract signing</li><li>On-site prospecting — learn to proactively reach out and invite effectively</li><li>Closing progress tracking — manage your performance with data</li><li>Weekly video check-ins — real-time review and strategy adjustment</li></ul><h3>Phase 2 (Months 3–6): Building Long-Term Income</h3><p><strong>Goal: Improve renewal rate and referrals</strong></p><ul><li>Member relationship psychology — understand your clients'' real needs</li><li>Renewal timing and emotional cues — identify the golden window for renewals</li><li>Referral process — let existing clients bring in new ones</li><li>Client management templates — systematize your client database</li></ul><h3>Coaching Structure</h3><ul><li>Weekly video meeting for progress review and action guidance</li><li>KPI tracking: invitations, closings, renewal rate</li><li>24/7 instant message support</li><li>Quarterly performance review and strategy adjustment</li></ul><h3>Plan Details</h3><p>6-Month Plan: 24 one-on-one training sessions</p><p>Bonus: Online courses valued at NT$ 41,420</p><h3>What You Will Learn</h3><ul><li>Build a replicable sales closing system</li><li>Learn to read client psychology and increase closing rates</li><li>Create a stable renewal and referral process</li><li>Master the core skills of social media business building</li><li>Shift from a coach mindset to an entrepreneur mindset</li><li>Use data to drive revenue growth</li></ul>',
  course_keywords_en = 'revenue coaching, personal trainer, performance, sales, closing, renewal, referral, six months',
  course_category_en = 'Main Plans'
WHERE course_id = 2;

-- course_id = 3: 變現陪跑（一年方案）
UPDATE public.courses SET
  course_title_en = 'Revenue Coaching Program (1-Year Plan)',
  course_description_en = 'A complete business training system designed specifically for personal trainers. A comprehensive 1-year full program with 48 one-on-one sessions, covering all three phases: revenue sprint, long-term income building, and personal brand and social media.',
  course_content_en = '<h2>Course Overview</h2><p>Still relying solely on expertise but unsure how to turn your skills into income? The "Revenue Coaching Program" is a business training system designed specifically for personal trainers — covering sales closing, client management, and personal branding to help you evolve from coach to entrepreneur.</p><h3>Who Is This For?</h3><ul><li>Coaches with solid skills but inconsistent revenue</li><li>Coaches who struggle with sales conversations and face frequent rejections</li><li>Coaches who want to build a long-term client base instead of starting from zero each month</li><li>Coaches who want to develop a personal brand and social media presence</li></ul><h3>Phase 1 (Months 0–3): Revenue Sprint</h3><ul><li>Trial session closing system — complete SOP from icebreaker to contract signing</li><li>On-site prospecting — learn to proactively reach out and invite effectively</li><li>Closing progress tracking — manage your performance with data</li><li>Weekly video check-ins — real-time review and strategy adjustment</li></ul><h3>Phase 2 (Months 3–6): Building Long-Term Income</h3><ul><li>Member relationship psychology — understand your clients'' real needs</li><li>Renewal timing and emotional cues — identify the golden window for renewals</li><li>Referral process — let existing clients bring in new ones</li><li>Client management templates — systematize your client database</li></ul><h3>Phase 3 (Months 6–12): Personal Brand and Social Media</h3><ul><li>Social media positioning — find your unique style and target audience</li><li>Scripted content creation — easily produce valuable content</li><li>On-camera confidence training — go from shy to confident in front of the lens</li><li>Build your personal business model — let your brand attract clients for you</li></ul><h3>Coaching Structure</h3><ul><li>Weekly video meeting for progress review and action guidance</li><li>KPI tracking: invitations, closings, renewal rate</li><li>24/7 instant message support</li><li>Quarterly performance review and strategy adjustment</li></ul><h3>Plan Details</h3><p>1-Year Plan: 48 one-on-one training sessions (most comprehensive plan)</p><p>Bonus: Online courses valued at NT$ 41,420</p>',
  course_keywords_en = 'revenue coaching, personal trainer, performance, sales, closing, social media, branding, one year',
  course_category_en = 'Main Plans'
WHERE course_id = 3;

-- course_id = 4: 表達力心理學
UPDATE public.courses SET
  course_title_en = 'Psychology of Communication and Persuasion',
  course_description_en = 'Persuasion is a skill, not a talent — and it can be learned. Use psychology principles to enhance your communication and expression, becoming more influential in consultations, sales, and everyday conversations.',
  course_content_en = '<h2>Course Overview</h2><p>Persuasion is a skill, not a talent — and it can be learned. This course teaches you to apply psychology principles to improve your communication and expression, making you more influential in consultations, sales, and everyday conversations. Whether facing client objections or navigating team dynamics, the right way to speak makes all the difference.</p><h3>What You Will Learn</h3><ul><li>Master the psychological principles that influence others'' decisions</li><li>Improve verbal organization and persuasive structure</li><li>Learn to communicate clearly under pressure</li><li>Use non-verbal communication to strengthen trust</li></ul>',
  course_keywords_en = 'communication, psychology, expression, persuasion, sales skills, influence',
  course_category_en = 'Online Courses'
WHERE course_id = 4;

-- course_id = 5: 反對問題成交話術
UPDATE public.courses SET
  course_title_en = 'Handling Objections: Closing Scripts for Personal Trainers',
  course_description_en = 'A curated collection of the most common objections coaches face, with proven response scripts to help you confidently handle every rejection and turn "I''ll think about it" into "I''m ready to sign up."',
  course_content_en = '<h2>Course Overview</h2><p>Clients saying "It''s too expensive," "Let me think about it," or "I need to ask my family" — how many times have you heard these? This course compiles the most common objections trainers face and provides real-world response script templates, so you can confidently handle every rejection and turn "I''ll think about it" into "I''m ready to sign up."</p><h3>What You Will Learn</h3><ul><li>Unpack the true reasons behind common client objections</li><li>Response scripts for price, time, and hesitation objections</li><li>Build a pressure-free, guided closing process</li><li>Go from passively waiting for replies to proactively driving the close</li></ul>',
  course_keywords_en = 'objection handling, closing scripts, sales, rejection handling, script templates',
  course_category_en = 'Online Courses'
WHERE course_id = 5;

-- course_id = 6: 體驗課成交全流程
UPDATE public.courses SET
  course_title_en = 'Trial Session Full Closing Process',
  course_description_en = 'From pre-session preparation to in-session guidance and post-session follow-up — a complete breakdown of every step of a high-conversion trial session, so your trial sessions are never just free labor.',
  course_content_en = '<h2>Course Overview</h2><p>The trial session is a trainer''s most important sales battlefield, but most coaches only know how to "teach movements" rather than "sell programs." This course breaks down every step — from pre-session preparation and in-session guidance to post-session follow-up — of a high-conversion trial session, so your trial sessions are never just free labor.</p><h3>Pre-Session Preparation</h3><ul><li>Client background analysis and needs anticipation</li><li>Trial session flow design and time allocation</li></ul><h3>In-Session Guidance</h3><ul><li>Icebreaking and trust-building techniques</li><li>Pain point identification and needs amplification</li><li>Demonstrating expertise and communicating value</li></ul><h3>Post-Session Closing</h3><ul><li>Pricing timing and scripts</li><li>Follow-up cadence and message templates</li><li>Re-engagement strategy for unconverted prospects</li></ul><h3>What You Will Learn</h3><ul><li>Design a trial session flow built for closing</li><li>Master the scripts for naturally transitioning to sales mid-session</li><li>Build a standard operating procedure for post-session follow-up</li><li>Improve overall trial session conversion rates</li></ul>',
  course_keywords_en = 'trial session, closing, conversion rate, sales process, icebreaking, follow-up',
  course_category_en = 'Online Courses'
WHERE course_id = 6;

-- course_id = 7: 私人教練續約必修課
UPDATE public.courses SET
  course_title_en = 'Essential Course on Client Renewal for Personal Trainers',
  course_description_en = 'Focused on "getting clients to buy again" — learn to identify renewal signals, master the right communication timing, and design renewal packages to build stable long-term income.',
  course_content_en = '<h2>Course Overview</h2><p>Acquiring a new client costs five times more than retaining an existing one. This course focuses on "getting clients to buy again" — teaching you to identify renewal signals, master the right communication timing, and design renewal packages so you''re no longer starting from zero each month, but instead building stable long-term income.</p><h3>Renewal Psychology</h3><ul><li>Client purchase cycles and decision-making patterns</li><li>Key factors that influence renewal intent</li></ul><h3>Timing and Scripts</h3><ul><li>How to identify the optimal renewal communication window</li><li>Renewal script templates for different situations</li></ul><h3>Package Design</h3><ul><li>How to design packages that make clients want to renew</li><li>Tiered course planning and upgrade pathways</li></ul><h3>Client Relationship Management</h3><ul><li>Frequency and methods for ongoing client engagement</li><li>Referral process design</li></ul><h3>What You Will Learn</h3><ul><li>Recognize client renewal signals and optimal timing</li><li>Design attractive renewal packages and pricing strategies</li><li>Build a systematic client relationship management process</li><li>Convert existing clients into referral sources</li></ul>',
  course_keywords_en = 'renewal, personal trainer, client relationships, referrals, long-term income',
  course_category_en = 'Online Courses'
WHERE course_id = 7;

-- course_id = 8: 一對一陪跑訓練
UPDATE public.courses SET
  course_title_en = 'One-on-One Coaching Program',
  course_description_en = 'Hands-on guidance tailored to your individual situation — starting from your current performance bottlenecks, we build a custom action plan together. This isn''t just a course. It''s real side-by-side coaching.',
  course_content_en = '<h2>Course Overview</h2><p>The most effective learning happens when someone is there to guide you every step of the way. The One-on-One Coaching Program is hands-on guidance tailored to your individual situation — starting from your current performance bottlenecks, we build a custom action plan and make real-time adjustments throughout execution. This isn''t just a course. It''s real side-by-side coaching.</p><h3>Program Content</h3><ul><li>Personal performance diagnosis and goal setting</li><li>Customized sales strategy and action plan</li><li>Regular video review sessions to track execution results</li><li>Instant message support — discuss issues as they arise</li><li>Script practice and simulated real-world scenarios</li><li>Dynamic strategy adjustment based on progress</li></ul><h3>What You Will Learn</h3><ul><li>Identify the core issue behind your stalled performance</li><li>Receive a tailored improvement plan targeting your specific weaknesses</li><li>Validate and refine your sales skills through real-world application</li><li>Establish a sustainable model for ongoing revenue growth</li></ul>',
  course_keywords_en = 'one-on-one, coaching program, personal guidance, performance improvement, real-world practice, sales strategy',
  course_category_en = 'One-on-One Services'
WHERE course_id = 8;

-- course_id = 9: 心理韌性與職涯定位
UPDATE public.courses SET
  course_title_en = 'Mental Resilience and Career Positioning',
  course_description_en = 'Combining psychology and career planning, this course helps you clarify your inner direction, strengthen your resilience against setbacks, and find your unique positioning as a coach — so you stop drifting and start moving with purpose.',
  course_content_en = '<h2>Course Overview</h2><p>On the path of coaching, technical skills are just the entry ticket. What truly determines how far you can go is your mindset. This course combines psychology and career planning to help you clarify your inner direction, strengthen your resilience against setbacks, and find your unique positioning as a coach — so you stop consuming your passion aimlessly and start moving with purpose.</p><h3>Program Content</h3><ul><li>Self-awareness and strengths exploration</li><li>Mental resilience training — face rejection and low points with composure</li><li>Career direction positioning — find the kind of coach you want to become</li><li>Goal breakdown and action planning</li><li>Life Coaching guided dialogue sessions</li><li>Build a long-term career development roadmap</li></ul><h3>What You Will Learn</h3><ul><li>Discover your core strengths and development direction</li><li>Build psychological coping skills for pressure and setbacks</li><li>Set clear short-, mid-, and long-term career goals</li><li>Find your intrinsic motivation to keep moving forward</li></ul>',
  course_keywords_en = 'mental resilience, career positioning, psychology, life coaching, self-awareness, goal planning',
  course_category_en = 'One-on-One Services'
WHERE course_id = 9;


-- =============================================================================
-- VIDEOS
-- =============================================================================

UPDATE public.videos SET title_en = 'Coach''s Daily Training' WHERE video_id = 1;
UPDATE public.videos SET title_en = 'Fitness Psychology Insights' WHERE video_id = 2;
UPDATE public.videos SET title_en = 'Training Technique Tutorials' WHERE video_id = 3;
UPDATE public.videos SET title_en = 'Exercise Form Demonstrations' WHERE video_id = 4;
UPDATE public.videos SET title_en = 'Sports Science Knowledge' WHERE video_id = 5;
UPDATE public.videos SET title_en = 'Strength Training Essentials' WHERE video_id = 6;
UPDATE public.videos SET title_en = 'Gym Session Live' WHERE video_id = 7;
UPDATE public.videos SET title_en = 'A Day in the Life of a Coach' WHERE video_id = 8;
UPDATE public.videos SET title_en = 'Muscle Gain & Fat Loss Tips' WHERE video_id = 9;
UPDATE public.videos SET title_en = 'Training Motivation & Mindset' WHERE video_id = 10;
UPDATE public.videos SET title_en = 'Correct Form & Posture Guide' WHERE video_id = 11;
UPDATE public.videos SET title_en = 'Nutrition Supplementation Tips' WHERE video_id = 12;
UPDATE public.videos SET title_en = 'Client Results & Transformations' WHERE video_id = 13;
UPDATE public.videos SET title_en = 'Fitness Q&A' WHERE video_id = 14;
UPDATE public.videos SET title_en = 'Cardio Training Insights' WHERE video_id = 15;
UPDATE public.videos SET title_en = 'Behind the Scenes' WHERE video_id = 16;
UPDATE public.videos SET title_en = 'Mindset Adjustment Techniques' WHERE video_id = 17;
UPDATE public.videos SET title_en = 'Push Your Limits' WHERE video_id = 18;
UPDATE public.videos SET title_en = 'Chest Training Tutorial' WHERE video_id = 19;
UPDATE public.videos SET title_en = 'Back Training Tutorial' WHERE video_id = 20;
UPDATE public.videos SET title_en = 'Leg Training Tutorial' WHERE video_id = 21;
UPDATE public.videos SET title_en = 'Shoulder Training Tutorial' WHERE video_id = 22;
UPDATE public.videos SET title_en = 'Arm Training Tutorial' WHERE video_id = 23;
UPDATE public.videos SET title_en = 'Core Training Tutorial' WHERE video_id = 24;


-- =============================================================================
-- SITE CONTENT
-- (Skipping: coach_intro_image_url = URL, coach_intro_bullets = JSON array)
-- =============================================================================

-- content_key = hero_title
UPDATE public.site_content SET content_value_en = 'I Love Aaron, Aaron Loves Me'
WHERE content_key = 'hero_title';

-- content_key = hero_subtitle
UPDATE public.site_content SET content_value_en = 'Who Needs Anyone Else'
WHERE content_key = 'hero_subtitle';

-- content_key = about_coach
UPDATE public.site_content SET content_value_en = 'About the Coach'
WHERE content_key = 'about_coach';

-- content_key = coach_intro_tagline
UPDATE public.site_content SET content_value_en = 'About the Coach'
WHERE content_key = 'coach_intro_tagline';

-- content_key = coach_intro_name
UPDATE public.site_content SET content_value_en = 'Coach Aaron'
WHERE content_key = 'coach_intro_name';

-- content_key = coach_intro_title
UPDATE public.site_content SET content_value_en = 'Professional Fitness Coach'
WHERE content_key = 'coach_intro_title';

-- content_key = coach_intro_image_url — skip (URL, not translatable text)

-- content_key = coach_intro_bullets — skip (JSON array; translate at application layer or expand below)
-- If you want to store a translated JSON array, use:
-- UPDATE public.site_content SET content_value_en = '["ACE – American Council on Exercise Certified Trainer","ISSA – International Sports Sciences Association Certified","Sports Nutrition Specialist Certified","1000+ successful client transformations"]'
-- WHERE content_key = 'coach_intro_bullets';


-- =============================================================================
-- SITE POPUPS
-- =============================================================================

-- popup_id = 1: test (content is English "test", no meaningful translation needed)
-- Providing a passthrough so the _en column is populated:
UPDATE public.site_popups SET
  popup_title_en = 'test',
  popup_content_en = '<p>test</p>'
WHERE popup_id = 1;
