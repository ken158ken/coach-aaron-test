# Coach Aaron 教練網頁

> 健身教練 Aaron 的官方網站 + 會員系統 + 後台 CMS + Android app（webview / native）。
> Monorepo，前後端 + DB migrations + Flutter 全在一個 repo。

---

## 🗂️ 專案總覽

```
前端新設計參考 (react)1/
├── frontend/           ← React 19 + Vite SSR + Tailwind v4
├── backend/            ← Express 5 + Supabase + JWT
├── database/           ← Supabase PostgreSQL（schema、migration、snapshot）
├── mobile/             ← Flutter（webview shell + native app，Android only）
├── api/                ← Vercel serverless 入口（ssr / server / cron）
├── scripts/            ← Vercel build script
├── package.json        ← Monorepo 根（workspaces 都用各自 package.json）
├── vercel.json         ← Vercel routing / function 設定 / cron 排程
└── CHANGELOG.md        ← 過往的 release notes（按日期）
```

每個子專案都有自己的 README：

| 專案 | 文件 | 用途 |
|---|---|---|
| 🌐 frontend | [`frontend/README.md`](frontend/README.md) | React SSR 網站（公開 + 會員 + admin） |
| ⚙️ backend | [`backend/README.md`](backend/README.md) | Express API + 認證 + 排程 |
| 🗃️ database | [`database/README.md`](database/README.md) | Schema + 27 支 migration + 即時 snapshot 工具 |
| 📱 mobile | [`mobile/README.md`](mobile/README.md) | Flutter Android（webview shell + native app） |

---

## 🧩 系統架構

```
┌────────────────────────────────────────────────────────────────────┐
│                          客戶 / 會員 / Admin                        │
└──────────────┬───────────────────────────┬─────────────────────────┘
               │                           │
               ▼                           ▼
       ┌─────────────────┐         ┌──────────────────┐
       │  Web (React)    │         │  Android app     │
       │  + Service      │         │  (Flutter)       │
       │    Worker (PWA) │         │                  │
       └────────┬────────┘         └────────┬─────────┘
                │                           │
                │     HTTPS / JWT Bearer    │
                ▼                           ▼
       ┌────────────────────────────────────────┐
       │   Vercel Functions（Node 22）          │
       │   ┌────────────────────────────────┐   │
       │   │ /api/ssr.js   ← React SSR      │   │
       │   │ /api/server.js ← Express API   │   │
       │   │ /api/cron.js  ← keep-alive     │   │
       │   └────────────────────────────────┘   │
       └────┬──────────────────────────┬────────┘
            │                          │
            │ service-role JWT         │ admin SDK
            ▼                          ▼
   ┌───────────────────┐        ┌──────────────────┐
   │  Supabase         │        │  Firebase FCM    │
   │  (Postgres +      │        │  (Android push)  │
   │   Storage +       │        └──────────────────┘
   │   Realtime)       │
   └───────────────────┘                ▲
            ▲                            │ web-push (VAPID)
            │ Realtime channel           │
            └───── 廣播給瀏覽器 / app ───┘
```

### 主要外部服務

| 服務 | 用途 |
|---|---|
| **Vercel** | 部署 / serverless function / cron |
| **Supabase** | Postgres / Storage（聊天圖片）/ Realtime broadcast |
| **Firebase Cloud Messaging** | Android app 推播 |
| **Cloudinary** | 圖片 CDN（admin 上傳的內容圖只接受這個 CDN） |
| **Google Calendar API** | 教練預約雙向同步 |
| **Google OAuth** / **LINE Login** | 第三方登入 |

---

## 🔐 認證模型（速覽）

```
[Login form / OAuth callback]
       │
       ▼  POST /api/auth/login or /api/auth/oauth-exchange
       │
[Backend 簽 JWT (HS256, 30d)] ──→ { token, user, isAdmin }
       │
       ▼  前端存到 localStorage + 記憶體
       │
[每個 API call 帶 Authorization: Bearer <token>]
       │
       ▼  middleware/auth.ts authenticateToken
       │
[req.user.userId / req.user.email]
       │
       ▼  middleware/auth.ts requireAdmin
       │
[查 admin_whitelist.email + is_active = true]
       │
       ▼
[執行 admin only 動作]
```

**Admin 判定**靠 `admin_whitelist` 表（不是 `users.role`）。詳細看 [backend/README.md](backend/README.md)。

---

## 🚀 部署

```
git push origin main
       │
       ▼
[Vercel webhook 觸發 build]
       │
       ▼
scripts/vercel-build.sh
   ├─ build backend  → backend/dist/
   ├─ build frontend client + ssr → frontend/dist/{client,server}
   └─ 把 ssr bundle 複製到 api/_ssr_bundle.cjs + api/_ssr_template.html
       │
       ▼
[Vercel Functions 上線]
   /api/(.*)  → api/server.js → require backend/dist/index.js (Express)
   /(.*)      → api/ssr.js     → React SSR
```

**Production 域名：**`https://coach-aaron-redesign.vercel.app`

**Vercel project：**`coach-aaron-test`（GitHub repo: [`ken158ken/coach-aaron-test`](https://github.com/ken158ken/coach-aaron-test)）

---

## 🛠️ 本機開發

### 一鍵起兩個 dev server

根目錄 `package.json` 有 concurrently script：

```powershell
npm install              # 在根 + backend + frontend 都裝
npm run dev              # 並行起 backend (3001) + frontend (5173) + concurrently
```

或分開：

```powershell
# Terminal 1
cd backend
npm install
npm run dev              # http://localhost:3001

# Terminal 2
cd frontend
npm install
npm run dev              # http://localhost:5173 — vite proxy /api → :3001
```

### 必要環境變數

`backend/.env.local`（**不上 git**）：

```bash
SUPABASE_URL=https://nalerberllvvbalfmadf.supabase.co
SUPABASE_SERVICE_KEY=<service role key>
JWT_SECRET=<隨機 32+ 字元>
CRON_SECRET=<隨機>
FRONTEND_URL=http://localhost:5173

# 選填
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:noreply@coach-aaron.local
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINE_CHANNEL_ID=...
LINE_CHANNEL_SECRET=...
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

`frontend/.env.local`：

```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://nalerberllvvbalfmadf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key — 給聊天 Realtime 訂閱用>
```

> Production 上的 env 統一在 Vercel dashboard 設，不靠 .env。

---

## 📋 主要功能模組

| 模組 | 對應路由（前端） | 後端 | 主要 table |
|---|---|---|---|
| 帳號 / OAuth | `/login`、`/register` | `routes/auth.ts`、`authGoogle.ts`、`authLine.ts` | `users`、`user_social_accounts`、`admin_whitelist` |
| 課程 | `/courses`、`/courses/:id` | `routes/courses.ts` | `courses`、`course_reviews`、`user_course_price_visibility` |
| 文章 | `/articles`、`/articles/:slug` | `routes/articles.ts` | `articles`、`article_ratings`、`article_comments` |
| 影片（Reels 牆） | `/videos` | `routes/videos.ts` | `videos` |
| 教學影片（Loom + 逐字稿） | `/lessons`、`/lessons/:id` | `routes/lessons.ts` + `utils/loom.ts` | `lesson_videos` |
| 預約諮詢 | `/booking`、`/my-bookings`、`/coach` | `routes/bookings.ts`、`coach.ts` + `utils/slots.ts` + `utils/googleCalendar.ts` | `coach_profile`、`coach_availability_rules`、`coach_time_off`、`bookings` |
| 聊天（DM + 群組 + 圖片 + Realtime） | `/chat`、`/chat/:id` | `routes/chat.ts`、`presence.ts`、`chatCron.ts` | `chat_conversations`、`chat_participants`、`chat_messages`、`user_presence` |
| 通知中心 + 推播（Web Push + FCM） | `/notifications` | `routes/notifications.ts` + `utils/notifications.ts` | `notifications`、`push_subscriptions` |
| 動態 Landing Page Builder | `/pages`、`/page/:slug`、`/admin/landing-pages/*` | `routes/landing.ts` | 6 張 `lp_*` 表 |
| 站內文案 / Banner / Popup / 跑馬燈 / Podcast | （首頁 + admin/content） | `routes/content.ts`、`marquee.ts`、`podcast.ts`、`slides.ts` | `site_content`、`homepage_banners`、`site_popups`、`marquee_items`、`podcast_episodes`、`gallery_*`、`testimonial_*` |
| 後台管理 | `/admin/*` | `routes/admin.ts` | 跨多張 |

---

## 🗓️ 排程任務（vercel.json crons）

| 排程 (UTC) | 對應台灣時間 | 路徑 | 動作 |
|---|---|---|---|
| `0 4 * * *` | 12:00 中午 | `/api/cron` | Supabase keep-alive ping（避免免費方案 inactive 暫停） |
| `0 19 * * *` | 03:00 凌晨 | `/api/cron/cleanup-chat` | 刪過期 7 天的聊天訊息、storage 圖片、過期通知 |

兩支都用 `Authorization: Bearer ${CRON_SECRET}` 做認證。

---

## 🌍 i18n（繁中 / English）

純前端字典（`frontend/src/context/LanguageContext.tsx`）。DB 內容用 paired column（`title` / `title_en`），fallback 邏輯在 `useLocalize` hook。

切換按鈕在 navbar 右上 / admin sidebar。

---

## 🎨 主題（Dark / Light）

DaisyUI v5 雙主題：`studio`（暗）/ `studio-light`（亮）。切換時改 `<html data-theme="...">`。

> Tailwind v4 不支援 `dark:` prefix（無效），用 CSS variable 在 `[data-theme="..."]` selector 下覆寫。

---

## 📦 主要技術選型

| 層 | 技術 |
|---|---|
| 前端框架 | React 19 + React Router 7 + Vite 5（雙 build：client + ssr） |
| 樣式 | Tailwind v4（@theme block）+ DaisyUI v5 + 自訂 OKLch token |
| 動畫 | Framer Motion（卡片 hover）+ GSAP（滾動）+ Lenis（smooth scroll）+ AOS（fade-in） |
| 編輯器 | TipTap（含自訂 Resizable YouTube / Loom / Image 三種 node） |
| 後端框架 | Express 5 + TypeScript 5 |
| DB | Supabase（managed Postgres + Storage + Realtime） |
| 認證 | JWT（HS256, 30d）+ OAuth 2（Google、LINE） |
| 推播 | Web Push（VAPID）+ Firebase FCM（Android app） |
| Mobile | Flutter（Riverpod、go_router、Dio、supabase_flutter） |
| 部署 | Vercel Functions（Node 22）+ Vercel Cron |

---

## 🔒 機密資料 / git 排除清單

**永遠不上 git 的東西：**

| 檔案 / 資料夾 | 原因 |
|---|---|
| `backend/.env*.local` | 各種 secret |
| `frontend/.env*.local` | 同上 |
| `mobile/**/google-services.json` | Firebase OAuth client id |
| `*-firebase-adminsdk-*.json` | Firebase service account 私鑰 |
| `database/snapshot/` | 含真實 user 資料 |
| `backend/import_*.mjs` `backend/migrate_*.mjs` | 一次性 hardcode key 的腳本 |

`.gitignore` 已設保護。**不要手動 `git add -f`**。

---

## 📚 進階文件

- 📅 [`CHANGELOG.md`](CHANGELOG.md) — 過往功能上線時間軸（按日期，含 screenshot 與步驟說明）
- 📋 [`DEVELOPMENT_SPEC.md`](DEVELOPMENT_SPEC.md) — 早期開發規範（部分過時）
- 🔍 [`SEO_CONTENT_PLAN.md`](SEO_CONTENT_PLAN.md) — SEO 與內容策略
- 🚀 [`(vercel佈署成功)VERCEL_SSR_DEPLOYMENT_GUIDE.md`](<%28vercel佈署成功%29VERCEL_SSR_DEPLOYMENT_GUIDE.md>) — Vercel SSR 設定踩雷紀錄
- 🎨 [`aceternity-ui-migration.md`](aceternity-ui-migration.md) — 早期 UI 遷移筆記

---

## 🐛 出問題的時候第一件事

1. **看 Vercel 「Deployments」tab** — 最新 commit 是不是有部署成功？status 是 Ready 還是 Error？
2. **看 Function logs** — Vercel dashboard → Functions → 點對應的 function → 看 invocation log
3. **看 Supabase logs** — Supabase dashboard → Logs → API / Postgres 看慢查詢或錯誤
4. **本機重現** — `npm run dev` 在自己機器跑同樣的請求

如果是部署的 commit 跟 GitHub 不同步：通常是按到舊 deployment 的「Redeploy」（會用該 deployment 當下的 commit，不是最新的）。
