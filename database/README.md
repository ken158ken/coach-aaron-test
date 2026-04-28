# Database — Supabase PostgreSQL

> 整套網站的單一資料來源（single source of truth）。所有 row 都跑在 Supabase 的 managed Postgres 上，後端用 service-role key bypass RLS、前端只走 backend API（**不**直接打 Supabase JS client，除了聊天 Realtime channel 訂閱）。

## 📁 目錄結構

```
database/
├── README.md                       ← 本檔
├── DATABASE_SCHEMA_REFERENCE.md    ← 早期手寫的 schema 描述（部分已過時，以 snapshot 為準）
├── DATABASE_SETUP_GUIDE.md         ← Supabase 專案初始建立步驟
├── schema.sql                      ← 完整 schema dump（手動匯出，不一定最新）
├── seed.sql                        ← 早期測試資料
├── test_data_rich.sql              ← Demo 內容（首頁文案 / banner 等）
├── dump_snapshot.mjs               ← 即時把 DB 抓下來的 Node 腳本
├── migrations/                     ← 27 支按時序 numbered SQL（**權威版本**）
└── snapshot/  *(gitignored)*
    ├── openapi.json                ← PostgREST 自動生成的 schema spec
    ├── schema.md                   ← 人類可讀的表 / 欄位摘要
    ├── SUMMARY.md                  ← 每張表 row 數
    └── data/<table>.json           ← 每張表的所有 row
```

`migrations/` 才是真實 schema，`schema.sql` 只是參考。

---

## 🔌 連線資訊

| 項目 | 值 |
|---|---|
| Project URL | `https://nalerberllvvbalfmadf.supabase.co` |
| Region | （查 Supabase dashboard） |
| 後端用的 service-role | env var `SUPABASE_SERVICE_KEY` （bypass RLS） |
| 前端用的 anon | env var `VITE_SUPABASE_ANON_KEY`（前端目前**只用於 Realtime channel**，不直接打 table） |

> ⚠️ Service-role key 等同 root 權限。**永遠不要**放 frontend bundle，**永遠不要** push git。後端 routes 都用 `supabaseAdmin`（`backend/config/supabase.ts`）。

---

## 🧱 概念分群（43 張表 + 1 view）

實際以 snapshot 自動產出的 [`snapshot/schema.md`](snapshot/schema.md) 為準。下面是按 domain 重新整理的「導讀」，方便快速找到對應位置。

### 🔐 帳號 / 授權（5 張）
| Table | 用途 |
|---|---|
| `users` | 主要會員資料（user_id PK / email / username / display_name / avatar_url / sex / phone / hashed password / `is_active`、`email_verified` 等） |
| `user_social_accounts` | OAuth 綁定（Google / LINE / FB），多帳號可綁同一個 user |
| `user_auth_tokens` | OAuth exchange token 暫存（短時間有效） |
| `admin_whitelist` | 管理員白名單（**僅 email 在這張就視為 admin**，與 `users` 分離） |
| `user_course_price_visibility` | 控制特定 user 看不看得到課程價格（per-user 鎖價） |

> Admin 判定的權威是 `admin_whitelist`，**不是** `users.role`。`backend/middleware/coachAuth.ts` 會撈這張表。

### 📚 內容（10 張）
| Table | 用途 |
|---|---|
| `courses` | 線上課程（CRUD by admin）— 標題 / 描述 / 內容 HTML / 縮圖 / banner / 等級 / 分類 / 價格 / 狀態 |
| `articles` | 文章（同上 + slug + 章節 HTML + 分類 + 關鍵字） |
| `article_comments`, `article_ratings` | 文章評論與評分 |
| `course_reviews` | 課程評論 |
| `videos` | **Reels 牆**（短影音）— 251 筆，YouTube/IG/TikTok 等等 |
| `lesson_videos` | **教學影片**（Loom 為主）— 含逐字稿 JSONB |
| `marquee_items` | 認證 / 成果跑馬燈 |
| `podcast_episodes` | Podcast 集數列表 |
| `site_content` | 鍵值式 site-wide 文案（key/value，含 type=text/json/image）— 27 筆 |
| `site_popups` | 首頁彈窗 |

### 🎨 首頁專屬（4 張）
| Table | 用途 |
|---|---|
| `homepage_banners` | 首頁輪播 banner |
| `gallery_config`, `gallery_slides` | 客戶展示用 gallery |
| `testimonial_config`, `testimonial_slides` | 學員見證 carousel |

### 🛒 商務（4 張，目前都 0 筆，未啟用）
| Table | 用途 |
|---|---|
| `user_courses` | user ↔ course 多對多（已購買關係） |
| `orders` | 訂單主檔 |
| `order_items` | 訂單明細 |
| `payments` | 金流交易紀錄 |

### 📅 預約（4 張，2026-04 上線）
| Table | 用途 |
|---|---|
| `coach_profile` | 教練設定（時區、單堂分鐘、buffer、預約前置時數、Google refresh_token） |
| `coach_availability_rules` | 週期可用規則（每週幾的幾點到幾點開放） |
| `coach_time_off` | 一次性休假區間 |
| `bookings` | 實際預約 row（pending/confirmed/rejected/cancelled/completed） |

### 💬 聊天（4 張）
| Table | 用途 |
|---|---|
| `chat_conversations` | 對話本體（type=`dm` 或 `group`） |
| `chat_participants` | 對話成員（含 `left_at` 軟刪除標記） |
| `chat_messages` | 訊息（含 `image_url` / `expires_at` 7 天清理） |
| `user_presence` | 在線狀態 / 最後上線時間 |

### 🔔 通知（2 張）
| Table | 用途 |
|---|---|
| `notifications` | 通用通知（chat / booking 都進這張）— 7 天後過期 |
| `push_subscriptions` | Push endpoint：`provider='web'` 走 Web Push（VAPID）；`provider='fcm'` 走 Firebase FCM |

### 🪧 動態頁面建構器 / Landing Pages（5 張，最大宗）
| Table | 用途 |
|---|---|
| `lp_templates` | 模板定義（301 筆） |
| `lp_template_sections` | 模板 section 結構（2,985 筆） |
| `lp_template_fields` | 模板欄位 schema（**8,861 筆**，最大表） |
| `lp_template_field_options` | 下拉選項（447 筆） |
| `lp_projects` | 用戶實際建立的 landing page 專案（2 筆） |
| `lp_project_field_values` | 專案的欄位填值（42 筆） |
| **VIEW** `vw_lp_project_resolved_fields` | resolved 後的欄位視圖（給前端 SSR 渲染用） |

### 📐 內容模板（1 張）
| Table | 用途 |
|---|---|
| `content_templates` | admin 後台的內容模板樣板（content tab 用） |

---

## 🔒 Row-Level Security（RLS）

所有「會員可寫入」的表都啟用 RLS。後端用 service-role key bypass，前端**只能透過後端 API**改任何資料。

| Pattern | 適用範圍 |
|---|---|
| `_admin_all` policy | 對 `authenticated` 角色 + `public.is_admin()` 函式（內部撈 `admin_whitelist`） |
| Public read | `articles`、`courses`、`videos`、`lesson_videos`、`site_content` 對 anon 開讀 |
| Own-row read/write | `bookings`、`chat_*`、`notifications`、`push_subscriptions` 限本人 |

詳細 policy 看 migration `009_fix_rls_security.sql` 與各 feature migration 的最後幾行。

---

## 🪜 Migrations 編年史

時序，每個 migration 一行。實際內容看 `database/migrations/<name>.sql`：

| # | 檔名 | 加了什麼 |
|--:|---|---|
| 001a | `001_add_course_packages.sql` | 課程包欄位 |
| 001b | `001_fix_and_import_courses.sql` | 早期課程匯入修正 |
| 002a | `002_add_course_level_and_fix_keywords.sql` | 課程加等級欄位、修 keywords |
| 002b | `002_social_accounts.sql` | Google / LINE OAuth 綁定表 |
| 003 | `003_site_content_and_popup.sql` | 站內文案 + 首頁彈窗 |
| 004 | `004_content_templates.sql` | 後台內容範本表 |
| 005 | `005_add_avatar_base64.sql` | 頭像支援 base64 |
| 006 | `006_facebook_social_accounts.sql` | FB 綁定（後來下架） |
| 007 | `007_rollback_facebook_columns.sql` | 回退 FB 相關欄位 |
| 008 | `008_user_course_price_visibility.sql` | 課程價格 per-user 顯示控制 |
| 009 | `009_fix_rls_security.sql` | RLS policies 全面修正（重要！） |
| 010 | `010_testimonial_gallery.sql` | 學員見證 + Gallery 兩組表 |
| 011 | `011_testimonial_card_layout.sql` | 見證卡片版型微調 |
| 012 | `012_landing_page_templates.sql` | 動態 landing page builder（5 張表） |
| 013 | `013_landing_page_seed.sql` | LP 模板大量 seed |
| 014 | `014_videos_add_description_thumbnail.sql` | videos 加 description / thumbnail_url |
| 015 | `015_marquee_podcast.sql` | 跑馬燈 + Podcast 拆出獨立表 |
| 016 | `016_coach_booking.sql` | 預約系統（4 張表） |
| 017 | `017_chat.sql` | 聊天（4 張表 + Storage bucket `chat-images`） |
| 018 | `018_chat_member_management.sql` | 軟刪除（`left_at`）+ 系統訊息 |
| 019 | `019_notifications.sql` | 通知 + Web Push 訂閱 |
| 020 | `020_push_provider_fcm.sql` | push_subscriptions 加 `provider` 欄位（web / fcm） |
| 021 | `021_lesson_videos.sql` | 教學影片（Loom）+ seed 一筆 demo |
| 022 | `022_lesson_dedupe_and_unique.sql` | 教學影片去重 + partial unique index |
| — | `add_i18n_en_columns.sql` | 一次性：給多張內容表加 `*_en` 雙語欄位 |
| — | `fill_en_translations.sql` | 一次性：填初版英文翻譯 |
| — | `videos_rows.sql` | 一次性：批量插入 251 筆 videos |

> 命名慣例：**正式 feature 用 numbered prefix**，一次性 import / seed / 修補不編號。

### 怎麼跑 migration

1. 開 Supabase dashboard → SQL Editor
2. 新建 query
3. 把 `database/migrations/<檔名>.sql` 整個貼進去 → Run
4. 在 commit 訊息註記哪支 migration 已套用

> 沒有 migration runner 工具。**必須手動跑**，這是目前刻意的取捨（避免錯刪 production 資料）。

---

## 📸 Snapshot 工具

`dump_snapshot.mjs` 把整個 public schema 抓到本機，用來：
- 離線 review 資料
- 比對 migration 跑前/跑後的差異
- 客戶反映 bug 時當「事後鑑定」

**用法：**
```powershell
cd "前端新設計參考 (react)1"
node database/dump_snapshot.mjs
```

輸出在 `database/snapshot/`（gitignored）：

```
snapshot/
├── openapi.json     ← PostgREST OpenAPI（type / FK 結構）
├── schema.md        ← 人類可讀的表 / 欄位
├── SUMMARY.md       ← 每張表 row 數一覽
└── data/<table>.json
```

> 含真實使用者 email / phone / hashed password。**不要分享、不要 push**。`.gitignore` 已設保護。

---

## 🧠 設計原則 / 常見坑

1. **PK 取名**：早期用 `<table>_id`（`user_id`、`course_id`），新表（chat / booking / lesson_videos）統一用 `id`。**不一致是歷史遺留**。
2. **時區**：所有 timestamp 用 `TIMESTAMPTZ`；應用層用 `Asia/Taipei` 顯示，但存 DB 都是 UTC。
3. **軟刪除**：用 `deleted_at TIMESTAMPTZ NULL`，**不真的 DELETE**（保留 audit trail）。query 時記得 `IS NULL`。
4. **多語言欄位**：i18n 採 paired column（`title` / `title_en`），不開獨立 translations 表。維護成本低、英文欄位可以 nullable，前端有 fallback 顯示中文。
5. **JSONB 欄位**：少量結構彈性大的內容用 jsonb（`site_content.value`、`lesson_videos.transcript`、`bookings.metadata`、`notifications.metadata`）。**結構化的 list 一律拆獨立表**（如 marquee / podcast 從 `site_content.value` 拆出去）。
6. **`ON CONFLICT DO NOTHING` 陷阱**：必須指定 conflict target 才有意義。SERIAL PK 每次都新號，沒指定欄位等於沒擋（migration 022 就是修這個 bug）。

---

## 📊 目前資料量（snapshot 那刻）

| Domain | 表數 | 總 row 數 |
|---|---:|---:|
| 帳號 | 5 | 35 |
| 內容 | 10 | 327 |
| 首頁 | 4 | 17 |
| 商務 | 4 | 0 |
| 預約 | 4 | 6 |
| 聊天 | 4 | 28 |
| 通知 | 2 | 0 |
| Landing pages | 6 | 12,638 |
| 內容模板 | 1 | 15 |
| **合計** | **43** | **13,066** |

> Landing page builder 占 96% 的 row（模板 schema 自己就 8,861 筆 fields）。
