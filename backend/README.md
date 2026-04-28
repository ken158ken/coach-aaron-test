# Backend — Express + Supabase

> Express.js 5 + TypeScript 5。所有 `/api/*` 請求都打進這支。部署到 Vercel Functions（serverless），**單一 entry point** `api/server.js` 動態載入這裡的 `dist/index.js`。

## 📁 目錄結構

```
backend/
├── index.ts                    ← 入口：CORS / middleware / route mount / app.listen
├── package.json                ← 依賴：express 5 / @supabase/supabase-js / web-push / firebase-admin / googleapis / multer / sharp / jsonwebtoken
├── tsconfig.json               ← 編譯設定（target: ES2022, module: NodeNext）
├── dist/                       ← 編譯後輸出（vercel build 時產生）
│
├── config/
│   ├── supabase.ts             ← Supabase client 初始化（普通 + admin 雙 client）
│   └── oauth.ts                ← Google / LINE OAuth 設定 + getFrontendUrl()
│
├── middleware/
│   ├── auth.ts                 ← JWT 驗證（authenticateToken / requireAdmin / optionalAuth / extractToken）
│   ├── coachAuth.ts            ← 教練 / Admin 守門（requireCoach / requireCoachOrAdmin）
│   ├── rateLimiter.ts          ← apiLimiter / authLimiter / oauthLimiter
│   └── sanitize.ts             ← 全域輸入清理 + 可疑請求偵測
│
├── routes/                     ← 22 支 route file（見下表）
├── utils/                      ← 8 支 utility（見下表）
└── types/
    └── database.ts             ← row insert/update 型別 (UpdateUserData 等)
```

---

## 🔑 Auth 模型

### Token 流程

```
[Login form / OAuth callback]
           │
           ▼
   POST /api/auth/login                ← email + password
   POST /api/auth/oauth-exchange       ← 短期 exchange token → 長期 JWT
           │
           ▼  (sign with JWT_SECRET, HS256, 30d expiry)
   { token, user, isAdmin }
           │
           ▼
[前端 Bearer header → 後端 authenticateToken middleware → req.user.userId]
```

### 三層守門

| Middleware | 來源 | 用途 | 失敗回應 |
|---|---|---|---|
| `authenticateToken` | `middleware/auth.ts` | 驗 JWT → 注入 `req.user` | 401 |
| `requireAdmin` | `middleware/auth.ts` | 確認 `req.user.email` 在 `admin_whitelist` 且 `is_active` | 403 |
| `requireCoach` / `requireCoachOrAdmin` | `middleware/coachAuth.ts` | 預約相關專用：對應 `coach_profile.user_id` 或 admin | 403 |
| `optionalAuth` | `middleware/auth.ts` | 不強制登入但有 token 就 inject | 不擋 |

### Admin 判定的單一真相

**`admin_whitelist` 表的 email**。`users.role` 欄位只是描述，不是權威。每次驗證都即時查一次（沒做快取）。

**為什麼分離**：客戶可能 hire / fire admin，不希望動到 `users` row（保留歷史登入紀錄）。

---

## 🔌 Supabase Client

`config/supabase.ts` 匯出兩個 client：

| Export | Key | RLS | 用途 |
|---|---|---|---|
| `supabase` | anon | ✓ enforced | 幾乎不用（為了完整性留著） |
| `supabaseAdmin` | service_role | ✗ bypass | **所有 route 都用這個** |

> 後端用 `supabaseAdmin` 是刻意的：JWT 已在 middleware 驗過，再走一次 RLS 是冗餘。所有 row-level 權限檢查在 application layer（route handler 自己 `eq('user_id', myId)`）。

---

## 🛣️ Routes 一覽（22 支）

mount path 全部由 `index.ts` 處理。

### 公開 / 認證類
| Mount | File | 主要 endpoints |
|---|---|---|
| `/api/auth` | `auth.ts` | POST login / register / logout / oauth-exchange、GET me |
| `/api/auth/google` | `authGoogle.ts` | Google OAuth callback + token exchange |
| `/api/auth/line` | `authLine.ts` | LINE OAuth callback + token exchange |

### 內容（公開讀 + admin 寫）
| Mount | File | 涵蓋 |
|---|---|---|
| `/api/courses` | `courses.ts` | 課程 CRUD + reviews + price visibility |
| `/api/articles` | `articles.ts` | 文章 CRUD + ratings + comments |
| `/api/videos` | `videos.ts` | Reels 牆短影音 CRUD（含批次 import） |
| `/api/lessons` | `lessons.ts` | 教學影片（Loom）CRUD + transcript |
| `/api/marquee` | `marquee.ts` | 認證 / 成果跑馬燈 |
| `/api/podcast` | `podcast.ts` | Podcast 集數列表 |
| `/api/content` | `content.ts` | 站內文案（site_content / banner / popup） |
| `/api/slides` | `slides.ts` | 學員見證 / Gallery 兩組 |
| `/api/landing` | `landing.ts` | 動態 landing page 模板 + 專案 |

### 用戶
| Mount | File | 涵蓋 |
|---|---|---|
| `/api/user` | `user.ts` | 個人資料 / 頭像 / 偏好 |
| `/api/contact` | `contact.ts` | 聯絡表單收信 |
| `/api/search` | `search.ts` | 全站全文搜尋 |

### 預約系統
| Mount | File | 涵蓋 |
|---|---|---|
| `/api/coach` | `coach.ts` | 教練 profile / availability / time-off + Google OAuth 連結 |
| `/api/bookings` | `bookings.ts` | slot 計算 + 用戶/教練端 booking 操作 |

### 聊天
| Mount | File | 涵蓋 |
|---|---|---|
| `/api/chat` | `chat.ts` | 對話 + 訊息 + 群組成員管理（含圖片上傳） |
| `/api/presence` | `presence.ts` | 在線心跳 + 狀態查詢 |

### 通知
| Mount | File | 涵蓋 |
|---|---|---|
| `/api/notifications` | `notifications.ts` | 通知列表 / 未讀 / push 訂閱（web + fcm） |

### 後台
| Mount | File | 涵蓋 |
|---|---|---|
| `/api/admin` | `admin.ts` | users 管理 / whitelist / orders / stats |

### Cron jobs（vercel.json 排程）
| Mount | File | 排程 | 動作 |
|---|---|---|---|
| `/api/cron` | （vercel `api/cron.js`） | `0 4 * * *` UTC（台灣 12:00） | Supabase keep-alive ping（避免免費方案 inactive 暫停） |
| `/api/cron/cleanup-chat` | `chatCron.ts` | `0 19 * * *` UTC（台灣 03:00） | 刪過期 7 天的聊天訊息、storage 圖檔、過期通知 |

---

## 🧰 Utils 一覽（8 支）

| File | 功能 |
|---|---|
| `env.ts` | 啟動時驗證 `process.env`（必填項：`SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`JWT_SECRET`、`CRON_SECRET`） |
| `logger.ts` | 結構化 log（`info` / `warn` / `error`，輸出 JSON to stdout） |
| `sanitizer.ts` | XSS / 注入防禦（`sanitizeComment`、`sanitizeRating`、`sanitizeId`、HTML escape） |
| `oauth.ts` | OAuth code exchange（給 google / line 共用） |
| `googleCalendar.ts` | Google Calendar API（freebusy 查詢、events insert / delete） |
| `slots.ts` | 預約時段計算（規則 × time-off × bookings × Google busy → 可用 slots） |
| `notifications.ts` | 通用通知三件式：寫 DB → Realtime broadcast → web-push / FCM 推播 |
| `loom.ts` | Loom URL 解析、VTT/SRT 逐字稿 parse、oEmbed metadata 抓取 |

---

## 📦 重要依賴

| Package | 版本 | 用途 |
|---|---|---|
| `express` | ^5.2 | HTTP server |
| `@supabase/supabase-js` | ^2.89 | DB client |
| `jsonwebtoken` | ^9 | JWT sign / verify |
| `bcryptjs` | ^2.4 | 密碼 hash |
| `web-push` | ^3.6 | VAPID Web Push |
| `firebase-admin` | ^13 | FCM 推播 |
| `googleapis` | ^171 | Google Calendar |
| `multer` | ^2.1 | multipart 檔案上傳（聊天圖片） |
| `sharp` | ^0.34 | 圖片壓縮 / webp 轉檔 |
| `cookie-parser` | ^1.4 | OAuth state cookie |
| `cors` | ^2.8 | CORS |
| `express-rate-limit` | ^8 | 限流 |
| `date-fns` / `date-fns-tz` | ^4 / ^3 | 預約時段時區處理 |

---

## 🌐 環境變數（必填 + 選填）

詳細驗證在 `utils/env.ts`。

### 必填
| Var | 說明 |
|---|---|
| `SUPABASE_URL` | `https://nalerberllvvbalfmadf.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role JWT（**極敏感**） |
| `JWT_SECRET` | 自家簽 token 的密鑰 |
| `CRON_SECRET` | Vercel cron 帶 `Authorization: Bearer <secret>` |
| `FRONTEND_URL` | 給 OAuth redirect 用（生產 = `https://coach-aaron-redesign.vercel.app`） |

### Web Push（選，沒設則略過 web push）
| Var | 說明 |
|---|---|
| `VAPID_PUBLIC_KEY` | 給前端 subscribe 用的公鑰 |
| `VAPID_PRIVATE_KEY` | 後端 sendNotification 簽證 |
| `VAPID_SUBJECT` | `mailto:noreply@xxx` |

### FCM（選，沒設則略過 fcm）
| Var | 說明 |
|---|---|
| `FCM_SERVICE_ACCOUNT_JSON` | Firebase Admin SDK service account 整份 JSON 字串化 |

### OAuth Providers（選）
| Var | 說明 |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` | LINE Login |
| `COACH_GOOGLE_CALENDAR_ID` | 教練要連的 calendar id（通常 = 該帳號 email） |

### 其他
| Var | 說明 |
|---|---|
| `MAIL_FROM` / `MAIL_HOST` / `MAIL_PASS` | Contact form 寄信 |
| `PORT` | local dev 用，Vercel 會忽略 |

---

## 🚀 部署流程

```
git push main
   │
   ▼
[Vercel webhook]
   │
   ▼
scripts/vercel-build.sh
   │
   ├─ cd backend && npm install && npm run build  → dist/
   ├─ cd frontend && npm install && npm run build → dist/client + dist/server
   ├─ 複製 SSR bundle 到 api/_ssr_bundle.cjs + api/_ssr_template.html
   └─ 砍掉 frontend/dist/client/index.html（強制走 SSR）
   │
   ▼
[Vercel Functions 部署]
   /api/server.js  ─ require("backend/dist/index.js")
   /api/ssr.js      ─ require("api/_ssr_bundle.cjs")
   /api/cron.js     ─ Supabase keep-alive
```

---

## 🛠️ 本機開發

```powershell
cd backend
npm install
npm run dev          # tsx watch — 自動 reload
```

預設聽 `PORT=3001`。前端 `vite.config.ts` 設 proxy 把 `/api` 轉這裡。

build 出 dist：
```powershell
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

---

## 🧠 設計原則

1. **薄 controller**：route handler 直接 inline supabase query，不抽 service layer。資料量還小、開發快。要重構也容易。
2. **失敗不擋主流程**：通知 / 推播 / Realtime broadcast 任一失敗都只 `logger.warn` 不 throw（影響使用者寫入體驗大於通知準確）。
3. **multipart 只用於聊天圖片**：其他都 JSON。Multer memory storage（不寫 disk）→ 直推 Supabase Storage。
4. **時區固定 `Asia/Taipei`**：`utils/slots.ts` 用 `date-fns-tz` 把 UTC 轉教練時區算 slot，存 DB 一律 UTC。
5. **沒有 ORM**：直接寫 PostgREST 風格的 select / insert / update。換 schema 時手動同步 TypeScript type。

---

## 🐛 常見坑

| 症狀 | 原因 / 解法 |
|---|---|
| 401 在所有 admin endpoint | `admin_whitelist.is_active` 是否 = true / email 是否大小寫不一致 |
| Realtime 廣播沒 fire | service-role 必須能 insert `realtime` 系統表，預設可以；常見問題是 **anon key 沒設給前端**（聊天訂閱用 anon） |
| 預約 slot 算錯 | 時區！slot 都是 `Asia/Taipei` 的 local 時間，後端進來時已是 UTC，要先 `toZonedTime` |
| Vercel cron 401 | 沒帶 `Authorization: Bearer ${CRON_SECRET}`；Vercel cron 自動帶，自己手 curl 要記得帶 |
| `firebase-admin` init 重複 | 多次 import 同一個檔可能重複 init，已加 `if (admin.apps.length === 0)` 守門 |
