-- 037: 意見反饋角色改為 開發者(developer) ↔ 教練(coach)
-- 背景：035 原本做成 學員(member) ↔ 教練(coach)，但業主澄清「意見反饋」其實是
--        開發者(我) ↔ 教練 的內部溝通平台（類似歐捷 ERP 的 客戶↔開發者），
--        一般學員不該看到。此 migration 把 DB 的角色/狀態語意改成 開發者↔教練。
--
-- 動作：
--   1) 先把既有資料轉成新值（member → developer、waiting_member → waiting_developer），
--      否則換上新 CHECK 時會被舊列擋住。
--   2) 換 feedback_messages.author_role 的 CHECK：('member','coach') → ('developer','coach')
--   3) 換 feedback_threads.status  的 CHECK：waiting_member → waiting_developer
--
-- 冪等：DROP CONSTRAINT IF EXISTS + 條件式 UPDATE，可重複執行。
-- 貼到 Supabase Dashboard SQL Editor 執行。

BEGIN;

-- 1) 既有資料先轉新值 -------------------------------------------------
UPDATE feedback_messages
   SET author_role = 'developer'
 WHERE author_role = 'member';

UPDATE feedback_threads
   SET status = 'waiting_developer'
 WHERE status = 'waiting_member';

-- 2) feedback_messages.author_role：member|coach → developer|coach ----
ALTER TABLE feedback_messages
  DROP CONSTRAINT IF EXISTS feedback_messages_author_role_check;
ALTER TABLE feedback_messages
  ADD CONSTRAINT feedback_messages_author_role_check
  CHECK (author_role IN ('developer', 'coach'));

-- 3) feedback_threads.status：waiting_member → waiting_developer ------
ALTER TABLE feedback_threads
  DROP CONSTRAINT IF EXISTS feedback_threads_status_check;
ALTER TABLE feedback_threads
  ADD CONSTRAINT feedback_threads_status_check
  CHECK (status IN ('waiting_developer', 'waiting_coach', 'in_progress', 'resolved'));

COMMIT;
