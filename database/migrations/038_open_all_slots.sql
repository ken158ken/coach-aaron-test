-- =====================================================
-- 038: 全年無休 — 預約時段 7 天 × 24 小時全開
-- 業主 2026-08-31 拍板（原為週一~五 14:00–18:00）
-- =====================================================
--
-- ⚠️ 本檔為「已執行」記錄：2026-08-31 已由維護端以 service key 走
--    Supabase REST 直接執行完畢（純資料列 DML，毋須 Dashboard）。
--    需要重跑時直接貼 SQL Editor 亦可，先清後插、結果冪等。
--
-- 端點值刻意用 23:59:59 而非 24:00:00：後端 slots.ts 以
--   `${dateStr}T${end_time.slice(0,5)}:00` + date-fns-tz fromZonedTime 解析，
--   '24:00' 會被解析成「當天 00:00」→ end < start → 整天 0 時段（已實測）。
--   代價僅為每天少了 23:30–24:00 最末半小時一格。
--
-- 驗證（2026-08-31）：正式站 GET /api/bookings/slots 回一週 301 格，
--   週六/週日/凌晨時段皆出現，每日 47 格 00:00~23:00 起訖。

DELETE FROM coach_availability_rules WHERE coach_id = 1;

INSERT INTO coach_availability_rules (coach_id, weekday, start_time, end_time, is_active)
SELECT 1, wd, '00:00:00'::TIME, '23:59:59'::TIME, true
FROM generate_series(0, 6) AS wd;
