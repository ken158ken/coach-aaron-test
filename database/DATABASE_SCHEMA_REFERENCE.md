# Coach Aaron 資料庫 Schema 完整參考文件

> **最後更新**: 2026-03-05T23:00:00+08:00  
> **資料庫**: Supabase PostgreSQL  
> **專案 Ref**: `nalerberllvvbalfmadf`  
> **Schema**: `public`

---

## 目錄

1. [總覽](#1-總覽)
2. [資料表詳細定義](#2-資料表詳細定義)
   - [2.1 users（使用者表）](#21-users使用者表)
   - [2.2 admin_whitelist（管理員白名單）](#22-admin_whitelist管理員白名單)
   - [2.3 user_auth_tokens（認證 Token 表）](#23-user_auth_tokens認證-token-表)
   - [2.4 courses（課程表）](#24-courses課程表)
   - [2.5 orders（訂單表）](#25-orders訂單表)
   - [2.6 user_courses（使用者課程關聯表）](#26-user_courses使用者課程關聯表)
   - [2.7 order_items（訂單項目表）](#27-order_items訂單項目表)
   - [2.8 payments（付款記錄表）](#28-payments付款記錄表)
   - [2.9 course_reviews（課程評論表）](#29-course_reviews課程評論表)
   - [2.10 videos（短影音表）](#210-videos短影音表)
   - [2.11 articles（文章表）](#211-articles文章表)
   - [2.12 article_ratings（文章評分表）](#212-article_ratings文章評分表)
   - [2.13 article_comments（文章留言表）](#213-article_comments文章留言表)
3. [資料表關聯 (ER Diagram)](#3-資料表關聯-er-diagram)
4. [索引清單](#4-索引清單)
5. [觸發器](#5-觸發器)
6. [Row Level Security (RLS) 政策](#6-row-level-security-rls-政策)
7. [輔助函數](#7-輔助函數)
8. [環境變數設定](#8-環境變數設定)

---

## 1. 總覽

Coach Aaron 平台共有 **13 張資料表**，分為三大類：

| 類別           | 資料表             | 說明                        |
| -------------- | ------------------ | --------------------------- |
| **使用者管理** | `users`            | 使用者帳號資料              |
|                | `admin_whitelist`  | 管理員權限白名單            |
|                | `user_auth_tokens` | JWT / 重設密碼 Token        |
| **課程與交易** | `courses`          | 課程資料                    |
|                | `orders`           | 訂單                        |
|                | `order_items`      | 訂單項目                    |
|                | `user_courses`     | 使用者已購買課程            |
|                | `payments`         | 付款記錄                    |
|                | `course_reviews`   | 課程評論                    |
| **內容管理**   | `videos`           | 短影音 (Instagram Reels 等) |
|                | `articles`         | 部落格文章                  |
|                | `article_ratings`  | 文章評分                    |
|                | `article_comments` | 文章留言                    |

> **重要**: `users`、`admin_whitelist`、`user_auth_tokens` 三張表由 Supabase 直接管理，不在 `schema.sql` 中重建。

---

## 2. 資料表詳細定義

### 2.1 users（使用者表）

> 由 Supabase 管理，已在資料庫中存在。

| 欄位             | 型別        | 約束             | 預設值              | 說明                     |
| ---------------- | ----------- | ---------------- | ------------------- | ------------------------ |
| `user_id`        | `SERIAL`    | **PRIMARY KEY**  | auto-increment      | 使用者 ID                |
| `auth_id`        | `UUID`      | UNIQUE           | —                   | Supabase Auth UID        |
| `username`       | `VARCHAR`   | NOT NULL         | —                   | 使用者名稱               |
| `email`          | `VARCHAR`   | UNIQUE, NOT NULL | —                   | 電子郵件                 |
| `password_hash`  | `VARCHAR`   | —                | —                   | bcrypt 加密密碼          |
| `phone_number`   | `VARCHAR`   | —                | `NULL`              | 電話號碼                 |
| `display_name`   | `VARCHAR`   | —                | `NULL`              | 顯示名稱                 |
| `avatar_url`     | `TEXT`      | —                | `NULL`              | 頭像 URL                 |
| `avatar_base64`  | `TEXT`      | —                | `NULL`              | 頭像 Base64 資料         |
| `sex`            | `BOOLEAN`   | —                | `NULL`              | 性別 (true=男, false=女) |
| `email_verified` | `BOOLEAN`   | —                | `FALSE`             | 郵件是否已驗證           |
| `is_active`      | `BOOLEAN`   | —                | `TRUE`              | 帳號是否啟用             |
| `last_login_at`  | `TIMESTAMP` | —                | `NULL`              | 最後登入時間             |
| `created_at`     | `TIMESTAMP` | —                | `CURRENT_TIMESTAMP` | 建立時間                 |
| `updated_at`     | `TIMESTAMP` | —                | `CURRENT_TIMESTAMP` | 更新時間                 |
| `deleted_at`     | `TIMESTAMP` | —                | `NULL`              | 軟刪除時間               |

**備註**:

- 密碼使用 `bcryptjs` 加密（10 rounds）
- `auth_id` 對應 Supabase Auth 系統的 UUID
- 管理員判斷透過 `admin_whitelist` 表比對 email

---

### 2.2 admin_whitelist（管理員白名單）

> 由 Supabase 管理，已在資料庫中存在。

| 欄位           | 型別        | 約束             | 預設值              | 說明           |
| -------------- | ----------- | ---------------- | ------------------- | -------------- |
| `whitelist_id` | `SERIAL`    | **PRIMARY KEY**  | auto-increment      | 白名單 ID      |
| `email`        | `VARCHAR`   | UNIQUE, NOT NULL | —                   | 管理員電子郵件 |
| `phone_number` | `VARCHAR`   | —                | `NULL`              | 電話號碼       |
| `added_by`     | `INTEGER`   | —                | `NULL`              | 新增者 user_id |
| `note`         | `TEXT`      | —                | `NULL`              | 備註           |
| `is_active`    | `BOOLEAN`   | —                | `TRUE`              | 是否啟用       |
| `created_at`   | `TIMESTAMP` | —                | `CURRENT_TIMESTAMP` | 建立時間       |
| `updated_at`   | `TIMESTAMP` | —                | `CURRENT_TIMESTAMP` | 更新時間       |

**目前已註冊管理員**:

- `ken158ken@gmail.com`
- `s330221@gmail.com`

---

### 2.3 user_auth_tokens（認證 Token 表）

> 由 Supabase 管理，已在資料庫中存在。

| 欄位         | 型別        | 約束            | 預設值              | 說明                          |
| ------------ | ----------- | --------------- | ------------------- | ----------------------------- |
| `token_id`   | `SERIAL`    | **PRIMARY KEY** | auto-increment      | Token ID                      |
| `user_id`    | `INTEGER`   | FK → users      | —                   | 使用者 ID                     |
| `token`      | `VARCHAR`   | —               | —                   | Token 值                      |
| `type`       | `VARCHAR`   | —               | —                   | Token 類型 (refresh/reset 等) |
| `expires_at` | `TIMESTAMP` | —               | —                   | 過期時間                      |
| `created_at` | `TIMESTAMP` | —               | `CURRENT_TIMESTAMP` | 建立時間                      |

**備註**: 目前此表為空，主要用於密碼重設 Token 或 Refresh Token 儲存。

---

### 2.4 courses（課程表）

| 欄位                   | 型別            | 約束            | 預設值              | 說明                   |
| ---------------------- | --------------- | --------------- | ------------------- | ---------------------- |
| `course_id`            | `SERIAL`        | **PRIMARY KEY** | auto-increment      | 課程 ID                |
| `course_title`         | `VARCHAR(255)`  | NOT NULL        | —                   | 課程標題               |
| `course_slug`          | `VARCHAR(255)`  | UNIQUE          | `NULL`              | URL slug               |
| `course_description`   | `VARCHAR(1000)` | —               | `NULL`              | 課程簡述               |
| `course_content`       | `TEXT`          | —               | `NULL`              | 課程完整內容（HTML）   |
| `course_video_url`     | `TEXT`          | —               | `NULL`              | 課程介紹影片 URL       |
| `course_thumbnail_url` | `TEXT`          | —               | `NULL`              | 課程縮圖 URL           |
| `course_keywords`      | `TEXT`          | —               | `NULL`              | SEO 關鍵字（逗號分隔） |
| `course_category`      | `TEXT`          | —               | `NULL`              | 課程分類               |
| `course_level`         | `VARCHAR(50)`   | —               | `'beginner'`        | 難度等級               |
| `lessons_count`        | `INTEGER`       | —               | `0`                 | 課堂數                 |
| `price`                | `DECIMAL(10,2)` | NOT NULL        | `0`                 | 價格                   |
| `currency`             | `VARCHAR(3)`    | —               | `'TWD'`             | 貨幣代碼               |
| `access_duration_days` | `INTEGER`       | —               | `NULL`              | 存取天數（NULL=永久）  |
| `status`               | `VARCHAR(20)`   | CHECK           | `'draft'`           | 課程狀態               |
| `total_enrolled`       | `INTEGER`       | —               | `0`                 | 總報名人數             |
| `rating_average`       | `DECIMAL(3,2)`  | —               | `0`                 | 平均評分               |
| `rating_count`         | `INTEGER`       | —               | `0`                 | 評分數量               |
| `created_at`           | `TIMESTAMP`     | —               | `CURRENT_TIMESTAMP` | 建立時間               |
| `updated_at`           | `TIMESTAMP`     | —               | `CURRENT_TIMESTAMP` | 更新時間               |
| `deleted_at`           | `TIMESTAMP`     | —               | `NULL`              | 軟刪除時間             |

**CHECK 約束**:

- `status` ∈ (`'draft'`, `'published'`, `'archived'`)

**課程分類**:

- `主方案` — 變現陪跑主課程（三個月/六個月/一年）
- `線上課程` — 獨立線上課程
- `一對一服務` — 個人化服務

**難度等級**: `beginner`、`intermediate`、`advanced`

---

### 2.5 orders（訂單表）

| 欄位             | 型別            | 約束                     | 預設值              | 說明       |
| ---------------- | --------------- | ------------------------ | ------------------- | ---------- |
| `order_id`       | `SERIAL`        | **PRIMARY KEY**          | auto-increment      | 訂單 ID    |
| `user_id`        | `INTEGER`       | **FK → users**, NOT NULL | —                   | 下單使用者 |
| `order_number`   | `VARCHAR(50)`   | UNIQUE, NOT NULL         | —                   | 訂單編號   |
| `total_amount`   | `DECIMAL(10,2)` | NOT NULL                 | —                   | 訂單總金額 |
| `currency`       | `VARCHAR(3)`    | —                        | `'TWD'`             | 貨幣代碼   |
| `status`         | `VARCHAR(20)`   | CHECK                    | `'pending'`         | 訂單狀態   |
| `payment_method` | `VARCHAR(50)`   | —                        | `NULL`              | 付款方式   |
| `notes`          | `TEXT`          | —                        | `NULL`              | 備註       |
| `created_at`     | `TIMESTAMP`     | —                        | `CURRENT_TIMESTAMP` | 建立時間   |
| `paid_at`        | `TIMESTAMP`     | —                        | `NULL`              | 付款時間   |
| `cancelled_at`   | `TIMESTAMP`     | —                        | `NULL`              | 取消時間   |
| `updated_at`     | `TIMESTAMP`     | —                        | `CURRENT_TIMESTAMP` | 更新時間   |

**CHECK 約束**:

- `status` ∈ (`'pending'`, `'paid'`, `'cancelled'`, `'refunded'`)

---

### 2.6 user_courses（使用者課程關聯表）

| 欄位                | 型別        | 約束                       | 預設值              | 說明         |
| ------------------- | ----------- | -------------------------- | ------------------- | ------------ |
| `user_course_id`    | `SERIAL`    | **PRIMARY KEY**            | auto-increment      | 關聯 ID      |
| `user_id`           | `INTEGER`   | **FK → users**, NOT NULL   | —                   | 使用者 ID    |
| `course_id`         | `INTEGER`   | **FK → courses**, NOT NULL | —                   | 課程 ID      |
| `order_id`          | `INTEGER`   | FK → orders                | `NULL`              | 訂單 ID      |
| `access_granted_at` | `TIMESTAMP` | —                          | `CURRENT_TIMESTAMP` | 授權時間     |
| `access_expires_at` | `TIMESTAMP` | —                          | `NULL`              | 存取過期時間 |
| `is_active`         | `BOOLEAN`   | —                          | `TRUE`              | 是否啟用     |
| `last_accessed_at`  | `TIMESTAMP` | —                          | `NULL`              | 最後存取時間 |

**UNIQUE 約束**: `(user_id, course_id)` — 同一使用者不能重複購買同一課程

---

### 2.7 order_items（訂單項目表）

| 欄位            | 型別            | 約束                       | 預設值         | 說明    |
| --------------- | --------------- | -------------------------- | -------------- | ------- |
| `order_item_id` | `SERIAL`        | **PRIMARY KEY**            | auto-increment | 項目 ID |
| `order_id`      | `INTEGER`       | **FK → orders**, NOT NULL  | —              | 訂單 ID |
| `course_id`     | `INTEGER`       | **FK → courses**, NOT NULL | —              | 課程 ID |
| `unit_price`    | `DECIMAL(10,2)` | NOT NULL                   | —              | 單價    |
| `quantity`      | `INTEGER`       | —                          | `1`            | 數量    |
| `subtotal`      | `DECIMAL(10,2)` | NOT NULL                   | —              | 小計    |

---

### 2.8 payments（付款記錄表）

| 欄位                  | 型別            | 約束                      | 預設值              | 說明           |
| --------------------- | --------------- | ------------------------- | ------------------- | -------------- |
| `payment_id`          | `SERIAL`        | **PRIMARY KEY**           | auto-increment      | 付款 ID        |
| `order_id`            | `INTEGER`       | **FK → orders**, NOT NULL | —                   | 訂單 ID        |
| `payment_provider`    | `VARCHAR(50)`   | NOT NULL                  | —                   | 付款服務商     |
| `provider_payment_id` | `VARCHAR(255)`  | —                         | `NULL`              | 服務商交易 ID  |
| `payment_method`      | `VARCHAR(50)`   | —                         | `NULL`              | 付款方式       |
| `amount`              | `DECIMAL(10,2)` | NOT NULL                  | —                   | 金額           |
| `currency`            | `VARCHAR(3)`    | —                         | `'TWD'`             | 貨幣代碼       |
| `status`              | `VARCHAR(20)`   | CHECK                     | `'pending'`         | 付款狀態       |
| `paid_at`             | `TIMESTAMP`     | —                         | `NULL`              | 付款時間       |
| `failed_reason`       | `TEXT`          | —                         | `NULL`              | 失敗原因       |
| `refunded_at`         | `TIMESTAMP`     | —                         | `NULL`              | 退款時間       |
| `refund_amount`       | `DECIMAL(10,2)` | —                         | `NULL`              | 退款金額       |
| `raw_response`        | `JSONB`         | —                         | `NULL`              | 服務商原始回應 |
| `created_at`          | `TIMESTAMP`     | —                         | `CURRENT_TIMESTAMP` | 建立時間       |
| `updated_at`          | `TIMESTAMP`     | —                         | `CURRENT_TIMESTAMP` | 更新時間       |

**CHECK 約束**:

- `status` ∈ (`'pending'`, `'success'`, `'failed'`, `'refunded'`)

---

### 2.9 course_reviews（課程評論表）

| 欄位             | 型別        | 約束                       | 預設值              | 說明        |
| ---------------- | ----------- | -------------------------- | ------------------- | ----------- |
| `review_id`      | `SERIAL`    | **PRIMARY KEY**            | auto-increment      | 評論 ID     |
| `user_id`        | `INTEGER`   | **FK → users**, NOT NULL   | —                   | 評論者      |
| `course_id`      | `INTEGER`   | **FK → courses**, NOT NULL | —                   | 課程 ID     |
| `user_course_id` | `INTEGER`   | FK → user_courses          | `NULL`              | 購買記錄 ID |
| `rating`         | `INTEGER`   | NOT NULL, CHECK            | —                   | 評分 (1-5)  |
| `comment`        | `TEXT`      | —                          | `NULL`              | 評論內容    |
| `is_visible`     | `BOOLEAN`   | —                          | `TRUE`              | 是否顯示    |
| `created_at`     | `TIMESTAMP` | —                          | `CURRENT_TIMESTAMP` | 建立時間    |
| `updated_at`     | `TIMESTAMP` | —                          | `CURRENT_TIMESTAMP` | 更新時間    |
| `deleted_at`     | `TIMESTAMP` | —                          | `NULL`              | 軟刪除時間  |

**CHECK 約束**:

- `rating` ≥ 1 AND `rating` ≤ 5

**UNIQUE 約束**: `(user_id, course_id)` — 同一使用者只能評論同一課程一次

---

### 2.10 videos（短影音表）

| 欄位         | 型別           | 約束            | 預設值              | 說明     |
| ------------ | -------------- | --------------- | ------------------- | -------- |
| `video_id`   | `SERIAL`       | **PRIMARY KEY** | auto-increment      | 影片 ID  |
| `title`      | `VARCHAR(255)` | NOT NULL        | —                   | 影片標題 |
| `url`        | `TEXT`         | NOT NULL        | —                   | 影片 URL |
| `type`       | `VARCHAR(50)`  | —               | `'instagram'`       | 影片類型 |
| `is_visible` | `BOOLEAN`      | —               | `TRUE`              | 是否顯示 |
| `sort_order` | `INTEGER`      | —               | `0`                 | 排序順序 |
| `created_at` | `TIMESTAMP`    | —               | `CURRENT_TIMESTAMP` | 建立時間 |
| `updated_at` | `TIMESTAMP`    | —               | `CURRENT_TIMESTAMP` | 更新時間 |

**影片類型**: `instagram`、`youtube`、`tiktok`

---

### 2.11 articles（文章表）

| 欄位                    | 型別           | 約束            | 預設值              | 說明             |
| ----------------------- | -------------- | --------------- | ------------------- | ---------------- |
| `article_id`            | `SERIAL`       | **PRIMARY KEY** | auto-increment      | 文章 ID          |
| `author_id`             | `INTEGER`      | FK → users      | `NULL`              | 作者             |
| `article_title`         | `VARCHAR(255)` | NOT NULL        | —                   | 文章標題         |
| `article_slug`          | `VARCHAR(255)` | UNIQUE          | `NULL`              | URL slug         |
| `article_description`   | `VARCHAR(500)` | —               | `NULL`              | 文章摘要         |
| `article_content`       | `TEXT`         | —               | `NULL`              | 文章內容（HTML） |
| `article_thumbnail_url` | `TEXT`         | —               | `NULL`              | 文章縮圖 URL     |
| `article_keywords`      | `TEXT`         | —               | `NULL`              | SEO 關鍵字       |
| `article_category`      | `TEXT`         | —               | `NULL`              | 文章分類         |
| `status`                | `VARCHAR(20)`  | CHECK           | `'draft'`           | 文章狀態         |
| `view_count`            | `INTEGER`      | —               | `0`                 | 瀏覽次數         |
| `rating_average`        | `DECIMAL(3,2)` | —               | `0`                 | 平均評分         |
| `rating_count`          | `INTEGER`      | —               | `0`                 | 評分數量         |
| `comment_count`         | `INTEGER`      | —               | `0`                 | 留言數量         |
| `is_featured`           | `BOOLEAN`      | —               | `FALSE`             | 是否精選         |
| `published_at`          | `TIMESTAMP`    | —               | `NULL`              | 發布時間         |
| `created_at`            | `TIMESTAMP`    | —               | `CURRENT_TIMESTAMP` | 建立時間         |
| `updated_at`            | `TIMESTAMP`    | —               | `CURRENT_TIMESTAMP` | 更新時間         |
| `deleted_at`            | `TIMESTAMP`    | —               | `NULL`              | 軟刪除時間       |

**CHECK 約束**:

- `status` ∈ (`'draft'`, `'published'`, `'archived'`)

---

### 2.12 article_ratings（文章評分表）

| 欄位         | 型別        | 約束                                           | 預設值              | 說明       |
| ------------ | ----------- | ---------------------------------------------- | ------------------- | ---------- |
| `rating_id`  | `SERIAL`    | **PRIMARY KEY**                                | auto-increment      | 評分 ID    |
| `article_id` | `INTEGER`   | **FK → articles**, ON DELETE CASCADE, NOT NULL | —                   | 文章 ID    |
| `user_id`    | `INTEGER`   | **FK → users**, NOT NULL                       | —                   | 使用者 ID  |
| `rating`     | `INTEGER`   | NOT NULL, CHECK                                | —                   | 評分 (1-5) |
| `created_at` | `TIMESTAMP` | —                                              | `CURRENT_TIMESTAMP` | 建立時間   |
| `updated_at` | `TIMESTAMP` | —                                              | `CURRENT_TIMESTAMP` | 更新時間   |

**CHECK 約束**: `rating` ≥ 1 AND `rating` ≤ 5  
**UNIQUE 約束**: `(article_id, user_id)` — 同一使用者只能評一次  
**CASCADE**: 文章刪除時自動刪除相關評分

---

### 2.13 article_comments（文章留言表）

| 欄位                | 型別        | 約束                                           | 預設值              | 說明                 |
| ------------------- | ----------- | ---------------------------------------------- | ------------------- | -------------------- |
| `comment_id`        | `SERIAL`    | **PRIMARY KEY**                                | auto-increment      | 留言 ID              |
| `article_id`        | `INTEGER`   | **FK → articles**, ON DELETE CASCADE, NOT NULL | —                   | 文章 ID              |
| `user_id`           | `INTEGER`   | **FK → users**, NOT NULL                       | —                   | 使用者 ID            |
| `parent_comment_id` | `INTEGER`   | FK → article_comments (self)                   | `NULL`              | 父留言 ID (巢狀回覆) |
| `content`           | `TEXT`      | NOT NULL                                       | —                   | 留言內容             |
| `is_visible`        | `BOOLEAN`   | —                                              | `TRUE`              | 是否顯示             |
| `created_at`        | `TIMESTAMP` | —                                              | `CURRENT_TIMESTAMP` | 建立時間             |
| `updated_at`        | `TIMESTAMP` | —                                              | `CURRENT_TIMESTAMP` | 更新時間             |
| `deleted_at`        | `TIMESTAMP` | —                                              | `NULL`              | 軟刪除時間           |

**CASCADE**: 文章刪除時自動刪除相關留言  
**Self-Reference**: `parent_comment_id` → `comment_id`，支援多層巢狀回覆

---

## 3. 資料表關聯 (ER Diagram)

```
┌──────────────────┐
│     users        │
│──────────────────│
│ PK user_id       │
│    auth_id       │
│    username      │
│    email         │
│    password_hash │
│    display_name  │
│    avatar_url    │
│    avatar_base64 │
│    sex           │
│    ...           │
└──────┬───────────┘
       │
       │ 1:N
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
┌──────────────────┐                    ┌──────────────────┐
│ admin_whitelist   │                    │     orders       │
│──────────────────│                    │──────────────────│
│ PK whitelist_id  │                    │ PK order_id      │
│    email ←─match─┼── users.email      │ FK user_id       │
│    is_active     │                    │    order_number   │
└──────────────────┘                    │    total_amount   │
                                        │    status         │
       ┌────────────────────────────────┤    ...           │
       │                                └──────┬───────────┘
       │ 1:N                                   │ 1:N
       ▼                                       │
┌──────────────────┐                           │
│  user_courses    │                           │
│──────────────────│                           │
│ PK user_course_id│                           │
│ FK user_id       │                           │
│ FK course_id     │                           │
│ FK order_id      │◄─────────────────────────┘
│    is_active     │
└──────┬───────────┘        ┌──────────────────┐
       │                    │   order_items    │
       │                    │──────────────────│
       │                    │ PK order_item_id │
       │                    │ FK order_id      │◄─── orders
       │                    │ FK course_id     │◄─── courses
       ▼                    │    unit_price    │
┌──────────────────┐        │    subtotal      │
│    courses       │        └──────────────────┘
│──────────────────│
│ PK course_id     │        ┌──────────────────┐
│    course_title  │        │    payments      │
│    course_slug   │        │──────────────────│
│    price         │        │ PK payment_id    │
│    status        │        │ FK order_id      │◄─── orders
│    ...           │        │    provider      │
└──────┬───────────┘        │    amount        │
       │                    │    status        │
       │ 1:N                └──────────────────┘
       │
       ▼
┌──────────────────┐
│ course_reviews   │
│──────────────────│
│ PK review_id     │
│ FK user_id       │◄─── users
│ FK course_id     │◄─── courses
│ FK user_course_id│◄─── user_courses
│    rating (1-5)  │
│    comment       │
└──────────────────┘

┌──────────────────┐
│     videos       │
│──────────────────│
│ PK video_id      │
│    title         │
│    url           │
│    type          │        (獨立表，無外鍵關聯)
│    is_visible    │
│    sort_order    │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    articles      │     │ article_ratings  │     │article_comments  │
│──────────────────│     │──────────────────│     │──────────────────│
│ PK article_id    │────▶│ PK rating_id     │     │ PK comment_id    │
│ FK author_id     │     │ FK article_id    │     │ FK article_id    │◄── articles
│    article_title │     │ FK user_id       │     │ FK user_id       │◄── users
│    article_slug  │     │    rating (1-5)  │     │ FK parent_id     │◄── self
│    status        │     └──────────────────┘     │    content       │
│    is_featured   │                              │    is_visible    │
│    ...           │                              └──────────────────┘
└──────────────────┘
```

### 外鍵關聯摘要

| 來源表             | 來源欄位            | → 目標表           | 目標欄位         | ON DELETE   |
| ------------------ | ------------------- | ------------------ | ---------------- | ----------- |
| `orders`           | `user_id`           | `users`            | `user_id`        | RESTRICT    |
| `user_courses`     | `user_id`           | `users`            | `user_id`        | RESTRICT    |
| `user_courses`     | `course_id`         | `courses`          | `course_id`      | RESTRICT    |
| `user_courses`     | `order_id`          | `orders`           | `order_id`       | RESTRICT    |
| `order_items`      | `order_id`          | `orders`           | `order_id`       | RESTRICT    |
| `order_items`      | `course_id`         | `courses`          | `course_id`      | RESTRICT    |
| `payments`         | `order_id`          | `orders`           | `order_id`       | RESTRICT    |
| `course_reviews`   | `user_id`           | `users`            | `user_id`        | RESTRICT    |
| `course_reviews`   | `course_id`         | `courses`          | `course_id`      | RESTRICT    |
| `course_reviews`   | `user_course_id`    | `user_courses`     | `user_course_id` | RESTRICT    |
| `articles`         | `author_id`         | `users`            | `user_id`        | RESTRICT    |
| `article_ratings`  | `article_id`        | `articles`         | `article_id`     | **CASCADE** |
| `article_ratings`  | `user_id`           | `users`            | `user_id`        | RESTRICT    |
| `article_comments` | `article_id`        | `articles`         | `article_id`     | **CASCADE** |
| `article_comments` | `user_id`           | `users`            | `user_id`        | RESTRICT    |
| `article_comments` | `parent_comment_id` | `article_comments` | `comment_id`     | RESTRICT    |

---

## 4. 索引清單

| 索引名稱                          | 資料表             | 欄位                | 用途               |
| --------------------------------- | ------------------ | ------------------- | ------------------ |
| `idx_courses_status`              | `courses`          | `status`            | 依狀態篩選課程     |
| `idx_courses_slug`                | `courses`          | `course_slug`       | 依 slug 查找課程   |
| `idx_courses_category`            | `courses`          | `course_category`   | 依分類篩選         |
| `idx_user_courses_user_id`        | `user_courses`     | `user_id`           | 查找使用者所有課程 |
| `idx_user_courses_course_id`      | `user_courses`     | `course_id`         | 查找課程所有學員   |
| `idx_orders_user_id`              | `orders`           | `user_id`           | 查找使用者訂單     |
| `idx_orders_status`               | `orders`           | `status`            | 依狀態篩選訂單     |
| `idx_orders_number`               | `orders`           | `order_number`      | 依訂單編號查找     |
| `idx_order_items_order_id`        | `order_items`      | `order_id`          | 查找訂單項目       |
| `idx_payments_order_id`           | `payments`         | `order_id`          | 查找訂單付款       |
| `idx_course_reviews_course_id`    | `course_reviews`   | `course_id`         | 查找課程所有評論   |
| `idx_videos_is_visible`           | `videos`           | `is_visible`        | 篩選可見影片       |
| `idx_videos_sort_order`           | `videos`           | `sort_order`        | 排序影片           |
| `idx_articles_author_id`          | `articles`         | `author_id`         | 查找作者文章       |
| `idx_articles_status`             | `articles`         | `status`            | 依狀態篩選文章     |
| `idx_articles_slug`               | `articles`         | `article_slug`      | 依 slug 查找文章   |
| `idx_articles_category`           | `articles`         | `article_category`  | 依分類篩選         |
| `idx_articles_published_at`       | `articles`         | `published_at`      | 依發布時間排序     |
| `idx_articles_is_featured`        | `articles`         | `is_featured`       | 篩選精選文章       |
| `idx_article_ratings_article_id`  | `article_ratings`  | `article_id`        | 查找文章評分       |
| `idx_article_ratings_user_id`     | `article_ratings`  | `user_id`           | 查找使用者評分     |
| `idx_article_comments_article_id` | `article_comments` | `article_id`        | 查找文章留言       |
| `idx_article_comments_user_id`    | `article_comments` | `user_id`           | 查找使用者留言     |
| `idx_article_comments_parent_id`  | `article_comments` | `parent_comment_id` | 查找巢狀回覆       |

---

## 5. 觸發器

所有主要資料表都有 `updated_at` 自動更新觸發器：

| 觸發器名稱                           | 資料表             | 事件          | 函數                         |
| ------------------------------------ | ------------------ | ------------- | ---------------------------- |
| `update_courses_updated_at`          | `courses`          | BEFORE UPDATE | `update_updated_at_column()` |
| `update_orders_updated_at`           | `orders`           | BEFORE UPDATE | `update_updated_at_column()` |
| `update_payments_updated_at`         | `payments`         | BEFORE UPDATE | `update_updated_at_column()` |
| `update_course_reviews_updated_at`   | `course_reviews`   | BEFORE UPDATE | `update_updated_at_column()` |
| `update_videos_updated_at`           | `videos`           | BEFORE UPDATE | `update_updated_at_column()` |
| `update_articles_updated_at`         | `articles`         | BEFORE UPDATE | `update_updated_at_column()` |
| `update_article_ratings_updated_at`  | `article_ratings`  | BEFORE UPDATE | `update_updated_at_column()` |
| `update_article_comments_updated_at` | `article_comments` | BEFORE UPDATE | `update_updated_at_column()` |

---

## 6. Row Level Security (RLS) 政策

所有資料表皆已啟用 RLS。以下為各表政策：

### courses

| 政策名稱                          | 操作   | 條件                                          |
| --------------------------------- | ------ | --------------------------------------------- |
| Anyone can view published courses | SELECT | `status = 'published' AND deleted_at IS NULL` |

### videos

| 政策名稱                       | 操作   | 條件                |
| ------------------------------ | ------ | ------------------- |
| Anyone can view visible videos | SELECT | `is_visible = TRUE` |

### user_courses

| 政策名稱                   | 操作   | 條件                                 |
| -------------------------- | ------ | ------------------------------------ |
| Users can view own courses | SELECT | `user_id` 匹配 Supabase `auth.uid()` |

### orders

| 政策名稱                  | 操作   | 條件                                 |
| ------------------------- | ------ | ------------------------------------ |
| Users can view own orders | SELECT | `user_id` 匹配 Supabase `auth.uid()` |

### course_reviews

| 政策名稱                        | 操作   | 條件                                       |
| ------------------------------- | ------ | ------------------------------------------ |
| Anyone can view visible reviews | SELECT | `is_visible = TRUE AND deleted_at IS NULL` |
| Users can create own reviews    | INSERT | `user_id` 匹配 Supabase `auth.uid()`       |

### articles

| 政策名稱                           | 操作   | 條件                                          |
| ---------------------------------- | ------ | --------------------------------------------- |
| Anyone can view published articles | SELECT | `status = 'published' AND deleted_at IS NULL` |

### article_ratings

| 政策名稱                        | 操作   | 條件                                 |
| ------------------------------- | ------ | ------------------------------------ |
| Anyone can view article ratings | SELECT | `true`（公開）                       |
| Users can create own ratings    | INSERT | `user_id` 匹配 Supabase `auth.uid()` |
| Users can update own ratings    | UPDATE | `user_id` 匹配 Supabase `auth.uid()` |

### article_comments

| 政策名稱                         | 操作   | 條件                                       |
| -------------------------------- | ------ | ------------------------------------------ |
| Anyone can view visible comments | SELECT | `is_visible = TRUE AND deleted_at IS NULL` |
| Users can create comments        | INSERT | `user_id` 匹配 Supabase `auth.uid()`       |
| Users can update own comments    | UPDATE | `user_id` 匹配 Supabase `auth.uid()`       |

> **注意**: 後端使用 `supabaseAdmin`（Service Role Key）存取資料，**繞過 RLS**。RLS 主要保護前端直接存取的情境。

---

## 7. 輔助函數

```sql
-- 自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. 環境變數設定

後端 `.env` 檔案需要以下設定：

```env
# Supabase 連線
SUPABASE_URL=https://nalerberllvvbalfmadf.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_KEY=<your_service_role_key>

# JWT 認證
JWT_SECRET=<your_jwt_secret_at_least_32_chars>

# 伺服器
PORT=5000
NODE_ENV=development

# 前端 URL（CORS）
FRONTEND_URL=http://localhost:5173

# Cookie Domain（生產環境）
# COOKIE_DOMAIN=.yourdomain.com
```

---

## 變更紀錄

| 日期       | 變更內容                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------ |
| 2026-01-27 | 初始 Schema 建立（courses, orders, user_courses, order_items, payments, course_reviews, videos） |
| 2026-02-10 | 新增 articles, article_ratings, article_comments 表                                              |
| 2026-03-05 | 修正 `course_description` VARCHAR(50) → VARCHAR(1000)；清空測試資料，匯入 9 門真實課程           |
