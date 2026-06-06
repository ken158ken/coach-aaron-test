-- Migration 025: 移除 users 表的 sex 欄位（原私密相簿功能已廢棄）
-- 執行前確認無其他程式碼仍讀寫此欄位

ALTER TABLE users DROP COLUMN IF EXISTS sex;
