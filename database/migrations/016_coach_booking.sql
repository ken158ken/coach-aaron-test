-- =============================================
-- Migration 016: 教練諮詢預約系統 + Google Calendar 同步
-- 建立時間: 2026-04-24
--
-- 四張新表：
--   1. coach_profile            — 教練基本設定 + Google OAuth token
--   2. coach_availability_rules — 每週例行可預約時段（週一 14:00-18:00 等）
--   3. coach_time_off           — 一次性休假區間
--   4. bookings                 — 預約主表
--
-- 開發期 seed 一筆 coach_profile 指向 ken158ken@gmail.com（admin 本人）
-- 交付日改 user_id 指向 s330221@gmail.com 並清掉 refresh token 即可。
-- =============================================

-- =====================================================
-- 1. coach_profile
-- =====================================================
CREATE TABLE IF NOT EXISTS coach_profile (
  id                    SERIAL       PRIMARY KEY,
  user_id               INTEGER      NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  display_name          VARCHAR(100) NOT NULL DEFAULT 'Aaron 教練',
  google_calendar_id    VARCHAR(200) NOT NULL DEFAULT 'primary',
  google_refresh_token  TEXT,                                  -- NULL = 未連結
  timezone              VARCHAR(50)  NOT NULL DEFAULT 'Asia/Taipei',
  default_slot_minutes  INTEGER      NOT NULL DEFAULT 30,
  buffer_minutes        INTEGER      NOT NULL DEFAULT 10,
  booking_notice_hours  INTEGER      NOT NULL DEFAULT 24,      -- 最短前置時間（低於此不可訂）
  booking_window_days   INTEGER      NOT NULL DEFAULT 30,      -- 最遠可預約天數
  cancellation_hours    INTEGER      NOT NULL DEFAULT 24,      -- confirmed 後多少小時前可取消
  is_active             BOOLEAN      NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_coach_profile_updated_at ON coach_profile;
CREATE TRIGGER set_coach_profile_updated_at
  BEFORE UPDATE ON coach_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. coach_availability_rules（每週例行規則）
-- =====================================================
CREATE TABLE IF NOT EXISTS coach_availability_rules (
  id         SERIAL      PRIMARY KEY,
  coach_id   INTEGER     NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
  weekday    INTEGER     NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0=週日, 6=週六
  start_time TIME        NOT NULL,
  end_time   TIME        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_coach_weekday
  ON coach_availability_rules(coach_id, weekday);

-- =====================================================
-- 3. coach_time_off（一次性休假）
-- =====================================================
CREATE TABLE IF NOT EXISTS coach_time_off (
  id         SERIAL      PRIMARY KEY,
  coach_id   INTEGER     NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  reason     VARCHAR(200) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_time_off_coach_range
  ON coach_time_off(coach_id, start_at, end_at);

-- =====================================================
-- 4. bookings（預約主表）
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id               SERIAL       PRIMARY KEY,
  coach_id         INTEGER      NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
  user_id          INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id        INTEGER              REFERENCES courses(course_id) ON DELETE SET NULL,

  start_at         TIMESTAMPTZ  NOT NULL,
  end_at           TIMESTAMPTZ  NOT NULL,

  status           VARCHAR(15)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),

  user_note        TEXT                  DEFAULT '',   -- 用戶送出時的需求說明
  coach_note       TEXT                  DEFAULT '',   -- 教練批註 / 拒絕原因

  -- 預約當下的聯絡方式 snapshot（用戶日後改 profile 不影響這筆）
  contact_email    VARCHAR(200)          DEFAULT '',
  contact_phone    VARCHAR(30)           DEFAULT '',

  google_event_id  VARCHAR(255),                       -- 同步到教練日曆後的 event id
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  rejected_at      TIMESTAMPTZ,
  cancelled_by     VARCHAR(10)
                     CHECK (cancelled_by IN ('user', 'coach', 'admin')),

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bookings_coach_start ON bookings(coach_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =====================================================
-- 5. Row Level Security
-- =====================================================
ALTER TABLE coach_profile              ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_time_off             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                   ENABLE ROW LEVEL SECURITY;

-- coach_profile: 任何人都能看「公開欄位」（由 backend route 過濾） — policy 對 authenticated+anon 開放 select
DROP POLICY IF EXISTS "coach_profile_public_select" ON coach_profile;
CREATE POLICY "coach_profile_public_select"
  ON coach_profile FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "coach_profile_admin_all" ON coach_profile;
CREATE POLICY "coach_profile_admin_all"
  ON coach_profile FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- availability rules: 公開讀（前端算 slots 用），admin 寫
DROP POLICY IF EXISTS "availability_public_select" ON coach_availability_rules;
CREATE POLICY "availability_public_select"
  ON coach_availability_rules FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "availability_admin_all" ON coach_availability_rules;
CREATE POLICY "availability_admin_all"
  ON coach_availability_rules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- time off: 公開讀（算 slots 用），admin 寫
DROP POLICY IF EXISTS "time_off_public_select" ON coach_time_off;
CREATE POLICY "time_off_public_select"
  ON coach_time_off FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "time_off_admin_all" ON coach_time_off;
CREATE POLICY "time_off_admin_all"
  ON coach_time_off FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- bookings: 用戶只看自己的，教練/admin 看全部
-- 實際存取都經 backend + service_role，這裡 RLS 主要擋 anon 直連
DROP POLICY IF EXISTS "bookings_no_anon" ON bookings;
CREATE POLICY "bookings_no_anon"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);  -- backend 會自行用 user_id 過濾，這裡允許驗證過的 session 基本讀取

DROP POLICY IF EXISTS "bookings_admin_all" ON bookings;
CREATE POLICY "bookings_admin_all"
  ON bookings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 6. Seed — 開發期教練指向 ken158ken@gmail.com
-- =====================================================
INSERT INTO coach_profile (
  user_id, display_name, timezone, default_slot_minutes, is_active
)
SELECT
  user_id,
  'Aaron 教練',
  'Asia/Taipei',
  30,
  true
FROM users
WHERE email = 'ken158ken@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 預設可預約時段：週一到週五 14:00-18:00（30 分鐘一格，透過 default_slot_minutes）
-- coach_id 取第一筆 coach_profile（只有一筆）
INSERT INTO coach_availability_rules (coach_id, weekday, start_time, end_time, is_active)
SELECT cp.id, wd, '14:00'::TIME, '18:00'::TIME, true
FROM coach_profile cp, generate_series(1, 5) AS wd
WHERE NOT EXISTS (
  SELECT 1 FROM coach_availability_rules WHERE coach_id = cp.id
);

-- =====================================================
-- 完成
-- =====================================================
