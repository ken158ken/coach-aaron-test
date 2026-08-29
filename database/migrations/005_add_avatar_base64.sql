-- Migration: 005_add_avatar_base64
-- 新增 avatar_base64 欄位至 users 資料表
-- 用於儲存圓形裁剪 + 壓縮後的 base64 頭像字串

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_base64 TEXT DEFAULT NULL;

COMMENT ON COLUMN users.avatar_base64
IS '使用者頭像 base64 字串（圓形裁剪、壓縮畫質後儲存）';
