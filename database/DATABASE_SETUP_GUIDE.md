# 資料庫設定指南

## Supabase 設定步驟

### 1. 建立專案

1. 前往 [Supabase](https://supabase.com/) 建立帳號
2. 建立新專案
3. 記下以下資訊：
   - Project URL
   - anon (public) key
   - service_role key (在 Settings > API 中)

### 2. 執行 Schema

1. 在 Supabase Dashboard 中，前往 SQL Editor
2. 複製 `schema.sql` 內容並執行
3. 執行成功後，會建立所有必要的表和索引

### 3. 執行 Seed Data（可選）

1. 在 SQL Editor 中執行 `seed.sql`
2. 這會建立測試用的資料

### 4. 設定環境變數

在後端的 `.env` 檔案中設定：

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_at_least_32_chars
```

## 資料表說明

| 表名             | 說明             |
| ---------------- | ---------------- |
| users            | 使用者資料       |
| admin_whitelist  | 管理員白名單     |
| user_auth_tokens | 認證 Token       |
| courses          | 課程資料         |
| orders           | 訂單             |
| user_courses     | 使用者已購買課程 |
| order_items      | 訂單項目         |
| payments         | 付款記錄         |
| course_reviews   | 課程評論         |
| videos           | 短影音           |

## RLS 政策

所有表都啟用了 Row Level Security (RLS)：

- **users**: 使用者只能讀取和更新自己的資料
- **courses**: 已發布的課程任何人都可以讀取
- **videos**: 可見的影片任何人都可以讀取
- **orders**: 使用者只能讀取自己的訂單
- **admin_whitelist**: 只有 service_role 可以操作

## 預設管理員

schema.sql 會自動插入以下預設管理員：

- ken158ken@gmail.com
- s330221@gmail.com
