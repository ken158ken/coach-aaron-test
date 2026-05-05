# Aaron 教練網站 — 系統文件

> 健身教練 Aaron 的官方網站 + 會員系統 + 後台 CMS + Android App  
> Monorepo：前端 React SSR / 後端 Express / Supabase DB / Flutter Mobile 全在同一個 repo

**Production：** https://coach-aaron-redesign.vercel.app  
**GitHub：** https://github.com/ken158ken/coach-aaron-test（Vercel project: `coach-aaron-test`）

---

## 目錄

- [專案結構](#專案結構)
- [系統架構](#系統架構)
- [技術選型](#技術選型)
- [認證模型](#認證模型)
- [前端詳解](#前端詳解)
- [後端詳解](#後端詳解)
- [資料庫詳解](#資料庫詳解)
- [Landing Page 系統](#landing-page-系統)
- [匯出功能](#匯出功能)
- [Mobile App](#mobile-app)
- [部署流程](#部署流程)
- [本機開發](#本機開發)
- [環境變數](#環境變數)
- [排程任務](#排程任務)
- [i18n 與主題](#i18n-與主題)
- [安全規則](#安全規則)
- [除錯指南](#除錯指南)

---

## 專案結構

```
前端新設計參考 (react)1/
├── frontend/                   ← React 19 + Vite 5 + Tailwind v4（SSR）
├── backend/                    ← Express 5 + TypeScript 5
├── database/                   ← Supabase PostgreSQL（migrations + scripts）
├── mobile/                     ← Flutter Android（webview + native）
├── api/                        ← Vercel serverless 入口
│   ├── server.js               ← 載入 backend/dist/index.js（Express）
│   ├── ssr.js                  ← React SSR handler
│   └── cron.js                 ← Supabase keep-alive
├── scripts/
│   └── vercel-build.sh         ← Vercel build 腳本
├── vercel.json                 ← Vercel routing / function / cron 設定
├── package.json                ← 根 package（concurrently dev script）
├── .gitignore                  ← 含 secret 排除規則
├── README.md                   ← 本文件
├── CHANGELOG.md                ← 過往功能上線紀錄
├── DEVELOPMENT_SPEC.md         ← 早期開發規範（部分已過時）
├── SEO_CONTENT_PLAN.md         ← SEO 與內容策略
└── VERCEL_SSR_DEPLOYMENT_GUIDE.md ← SSR 部署踩雷紀錄
```

---

## 系統架構

```
┌─────────────────────────────────────────────────────────────────────┐
│                        客戶 / 會員 / Admin                           │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
               ▼                              ▼
    ┌─────────────────────┐        ┌────────────────────┐
    │  Web Browser         │        │  Android App        │
    │  React 19 + PWA     │        │  Flutter            │
    │  (SSR on first load)│        │  (WebView + Native) │
    └──────────┬──────────┘        └──────────┬──────────┘
               │                              │
               │   HTTPS / JWT Bearer Token   │
               ▼                              ▼
    ┌──────────────────────────────────────────────────┐
    │              Vercel Functions（Node 22）          │
    │  ┌──────────────────────────────────────────┐    │
    │  │ api/ssr.js     ← React Server-Side Render │    │
    │  │ api/server.js  ← Express API（全部 /api/*）│    │
    │  │ api/cron.js    ← Supabase keep-alive ping │    │
    │  └──────────────────────────────────────────┘    │
    └───────────┬──────────────────────┬───────────────┘
                │                      │
        service-role JWT          Firebase Admin SDK
                ▼                      ▼
    ┌───────────────────┐    ┌──────────────────────┐
    │  Supabase          │    │  Firebase FCM         │
    │  ├ PostgreSQL      │    │  (Android push notify)│
    │  ├ Storage         │    └──────────────────────┘
    │  │  ├ chat-images  │              ▲
    │  │  └ lp-images    │              │ Web Push VAPID
    │  └ Realtime        │◄─────────────┘
    └───────────────────┘   (Realtime broadcast → browser / app)
```

### 主要外部服務

| 服務 | 用途 | 備註 |
|---|---|---|
| **Vercel** | 部署 / serverless function / cron | Node 22 |
| **Supabase** | Postgres + Storage + Realtime | managed PostgreSQL |
| **Firebase FCM** | Android app 推播通知 | firebase_messaging |
| **Cloudinary** | 內容圖片 CDN | 文章/課程等圖片 URL 必須是 Cloudinary |
| **Supabase Storage** | 聊天圖片 + Landing Page 上傳圖片 | chat-images / lp-images bucket |
| **Google Calendar API** | 教練預約雙向同步 | OAuth 2 授權 |
| **Google OAuth** | 第三方登入 | /api/auth/google |
| **LINE Login** | 第三方登入 | /api/auth/line |

---

## 技術選型

| 層級 | 技術 | 版本 |
|---|---|---|
| 前端框架 | React + React Router | 19 / 7 |
| 前端建構 | Vite（雙 build：client + ssr） | 5 |
| 樣式 | Tailwind v4 + DaisyUI v5 + 自訂 OKLch token | v4 / v5 |
| 動畫 | Framer Motion + GSAP + Lenis + AOS | |
| 富文字編輯器 | TipTap（含 YouTube / Loom / Image 自訂節點） | |
| 後端框架 | Express + TypeScript | 5 / 5 |
| 資料庫 Client | @supabase/supabase-js | ^2.89 |
| 認證 | JWT（HS256, 30d）+ Google OAuth + LINE Login | |
| 推播 | web-push（VAPID）+ firebase-admin（FCM） | |
| 圖片處理 | sharp（壓縮 → WebP）+ multer（upload） | |
| Mobile | Flutter（Riverpod + go_router + Dio + supabase_flutter） | |
| 部署 | Vercel Functions | Node 22 |

---

## 認證模型

```
1. 使用者登入（表單 or OAuth）
   POST /api/auth/login         ← email + password
   POST /api/auth/oauth-exchange ← 短期 exchange token → 長期 JWT

2. 後端簽發 JWT（HS256, 30 天有效）
   回傳：{ token, user, isAdmin }

3. 前端存放
   localStorage + 記憶體（api.ts 的 _authToken 變數）
   每個 API call 帶 Authorization: Bearer <token>

4. 後端驗證
   middleware/auth.ts → authenticateToken → req.user.userId / req.user.email

5. Admin 判定
   middleware/auth.ts → requireAdmin
   → 查 admin_whitelist.email + is_active = true
   ★ 不是看 users.role，admin_whitelist 才是單一權威
```

### 三層守門

| Middleware | 位置 | 用途 | 失敗 |
|---|---|---|---|
| `authenticateToken` | middleware/auth.ts | 驗 JWT → 注入 req.user | 401 |
| `requireAdmin` | middleware/auth.ts | 確認 email 在 admin_whitelist | 403 |
| `requireCoach` / `requireCoachOrAdmin` | middleware/coachAuth.ts | 預約系統專用 | 403 |
| `optionalAuth` | middleware/auth.ts | 有 token 就 inject，沒有也過 | 不擋 |

---

## 前端詳解

### 目錄結構

```
frontend/src/
├── App.tsx                     ← 路由定義（所有 <Route>）
├── main.tsx                    ← 入口（client-side）
├── entry-server.tsx            ← SSR 入口
├── pages/                      ← 頁面元件（每個路由一個檔案）
│   ├── admin/                  ← 後台管理頁面
│   └── coach/                  ← 教練儀表板
├── components/                 ← 可重用元件
│   ├── admin/                  ← AdminSidebar / AdminLayout / 後台專用元件
│   ├── auth/                   ← RequireAuth / SocialLoginButtons
│   ├── chat/                   ← MessageThread / ConversationList / MessageBubble 等
│   ├── editor/                 ← TipTap 編輯器 + 自訂 Node（YouTube / Loom / Image）
│   ├── landing-templates/      ← LP 模板 React 元件（GenericLP / FitnessDarkLP 等）
│   ├── layout/                 ← Navbar / Footer / Layout / SmoothScroll
│   ├── notifications/          ← NotificationBell / NotificationCenter
│   ├── sections/               ← 首頁各 section 元件（Hero / Features 等）
│   ├── seo/                    ← SEOHead
│   ├── three/                  ← Three.js 3D 元件
│   └── ui/                     ← 通用 UI 元件（Button / Input / Modal / Toast 等）
├── services/                   ← API 呼叫層（依領域分組）
│   ├── api.ts                  ← Axios wrapper + token 管理
│   ├── auth/                   ← auth.service / user.service
│   ├── content/                ← article / course / video / lesson service
│   ├── site/                   ← content(文案) / marquee / podcast / slides / landing service
│   ├── social/                 ← chat / presence / realtime / supabase.client
│   ├── booking/                ← booking / coach service
│   └── notifications/          ← notification / pushSubscription service
├── hooks/                      ← 自訂 React hooks
├── context/                    ← Context Provider
│   ├── AuthContext.tsx          ← 登入狀態 + useAuth()
│   ├── ThemeContext.tsx         ← dark/light 切換
│   ├── LanguageContext.tsx      ← 中英文切換 + t() 翻譯
│   ├── ChatNotificationContext.tsx ← 未讀聊天徽章
│   └── NotificationContext.tsx ← 系統通知
├── types/                      ← TypeScript 型別定義
├── constants/                  ← 全域常數（主題色、連結等）
├── lib/                        ← auth-init（SSR 預載入）
└── utils/                      ← 工具函式
```

### 所有前端路由

#### 公開路由（有 Layout，含 Navbar）

| 路由 | 元件 | 說明 |
|---|---|---|
| `/` | Home | 首頁 |
| `/courses` | Courses | 課程列表 |
| `/courses/:id` | CourseDetail | 課程詳情 |
| `/videos` | Videos | Reels 牆 |
| `/lessons` | Lessons | 教學影片列表 |
| `/lessons/:id` | LessonDetail | Loom 教學影片 + 逐字稿 |
| `/articles` | Articles | 文章列表 |
| `/articles/:slug` | ArticleDetail | 文章詳情 |
| `/contact` | Contact | 聯絡表單 |
| `/login` | Login | 登入（含 Google / LINE OAuth） |
| `/register` | Register | 註冊 |
| `/pages` | PublishedPages | 已發布 Landing Page 清單 |

#### 需登入路由（RequireAuth）

| 路由 | 元件 | 說明 |
|---|---|---|
| `/member` | MemberCenter | 會員中心（個人資料 / 課程 / 設定 / 匯出資料） |
| `/dashboard` | Dashboard | 學習儀表板 |
| `/checkout` | Checkout | 結帳 |
| `/checkout/success` | CheckoutSuccess | 結帳完成 |
| `/booking` | BookingPage | 預約諮詢 |
| `/my-bookings` | MyBookingsPage | 我的預約記錄 |
| `/coach` | CoachDashboard | 教練儀表板（教練 / Admin 可見） |
| `/chat` | Chat | 聊天列表 |
| `/chat/:conversationId` | Chat | 聊天對話 |
| `/notifications` | NotificationsPage | 通知中心 |

#### Landing Page（無 Layout，獨立全頁）

| 路由 | 元件 | 說明 |
|---|---|---|
| `/page/:slug` | LandingPageViewer | 動態 Landing Page（by slug） |

#### 後台路由（RequireAdmin + AdminLayout）

| 路由 | 元件 | 說明 |
|---|---|---|
| `/admin` | AdminDashboard | 儀表板 |
| `/admin/users` | AdminUsers | 使用者管理 |
| `/admin/courses` | AdminCourses | 課程管理 |
| `/admin/videos` | AdminVideos | Reels 影片管理 |
| `/admin/lessons` | AdminLessons | 教學影片管理 |
| `/admin/content` | AdminContent | 站內文案 / Banner / Popup / 跑馬燈 / Podcast |
| `/admin/articles` | AdminArticles | 文章列表 |
| `/admin/landing-pages` | LandingPageManager | Landing Page 專案管理 |
| `/admin/whitelist` | AdminWhitelist | Admin 白名單管理 |
| `/admin/export` | AdminExport | 匯出中心（全模組 + 全站 Excel） |

#### 後台獨立編輯器（全螢幕，無 AdminLayout）

| 路由 | 元件 | 說明 |
|---|---|---|
| `/admin/articles/new` | ArticleEditor | 新增文章（TipTap） |
| `/admin/articles/:id/edit` | ArticleEditor | 編輯文章 |
| `/admin/courses/new` | CourseEditor | 新增課程 |
| `/admin/courses/:id/edit` | CourseEditor | 編輯課程 |
| `/admin/landing-pages/new` | LandingPageNew | 選模板 → 建立 LP 專案 |
| `/admin/landing-pages/:id/edit` | LandingPageEditor | LP 欄位編輯 + 樣式切換 + 圖片上傳 |

### 自訂 Hooks

| Hook | 說明 |
|---|---|
| `useAuth()` | 登入狀態、user 物件、login / logout |
| `useLanguage()` | 語言切換、t() 翻譯函式 |
| `useChat()` | 聊天訊息列表、新訊息訂閱 |
| `usePresence()` / `usePresenceMany()` | 在線狀態 |
| `useNotifications()` | 通知列表、未讀數 |
| `useChatNotifications()` | 聊天未讀徽章 |
| `useCoachAccess()` | 確認是否為教練 / Admin |
| `useSiteContent()` | 取站內文案（site_content 表） |
| `useRichTextEditor()` | TipTap editor 初始化 |
| `useLocalize()` | DB 欄位中英文 fallback |
| `useScrollAnimation()` | GSAP scroll 動畫 |
| `useMediaQuery()` | 響應式斷點偵測 |

---

## 後端詳解

### 目錄結構

```
backend/
├── index.ts                    ← 入口：CORS / middleware / registerRoutes / listen
├── routes/
│   ├── index.ts                ← 統一 route 掛載（registerRoutes 函式）
│   ├── auth.ts                 ← 登入 / 登出 / 註冊 / me
│   ├── authGoogle.ts           ← Google OAuth callback
│   ├── authLine.ts             ← LINE Login callback
│   ├── courses.ts              ← 課程 CRUD + reviews + 價格可見性
│   ├── articles.ts             ← 文章 CRUD + ratings + comments
│   ├── videos.ts               ← Reels 短影音 CRUD
│   ├── lessons.ts              ← 教學影片（Loom）CRUD + oEmbed 自動補 thumbnail
│   ├── content.ts              ← site_content / banners / popups
│   ├── slides.ts               ← testimonial carousel + gallery
│   ├── marquee.ts              ← 跑馬燈
│   ├── podcast.ts              ← Podcast 集數
│   ├── landing.ts              ← Landing Page 模板 + 專案 + variant + 圖片上傳
│   ├── coach.ts                ← 教練 profile / availability / time-off / Google Calendar
│   ├── bookings.ts             ← 預約 slot 計算 + 用戶/教練端操作
│   ├── chat.ts                 ← 對話 + 訊息 + 群組 + 圖片 + Realtime broadcast
│   ├── presence.ts             ← 在線心跳 + 狀態查詢
│   ├── chatCron.ts             ← 聊天清理排程
│   ├── notifications.ts        ← 通知列表 + push 訂閱（web + fcm）
│   ├── user.ts                 ← 個人資料 / 頭像
│   ├── contact.ts              ← 聯絡表單寄信
│   ├── search.ts               ← 全站全文搜尋
│   ├── admin.ts                ← 使用者管理 / 訂單 / 統計
│   ├── export.ts               ← 會員端聊天匯出
│   └── adminExport.ts          ← 後台全模組匯出
├── middleware/
│   ├── auth.ts                 ← JWT 驗證（authenticateToken / requireAdmin / optionalAuth）
│   ├── coachAuth.ts            ← 教練 / Admin 守門
│   ├── rateLimiter.ts          ← API / Auth / OAuth 限流
│   └── sanitize.ts             ← 全域輸入清理 + 可疑請求偵測
├── config/
│   ├── supabase.ts             ← supabase（anon）+ supabaseAdmin（service-role）
│   └── oauth.ts                ← Google / LINE OAuth 設定
├── utils/
│   ├── env.ts                  ← 啟動時驗證必填環境變數
│   ├── logger.ts               ← 結構化 JSON log（info / warn / error）
│   ├── sanitizer.ts            ← XSS / 注入防禦
│   ├── notifications.ts        ← 通知三件式：DB → Realtime → web-push / FCM
│   ├── exportHelpers.ts        ← 匯出格式生成（MD / TXT / HTML / XLSX / DOCX）
│   ├── googleCalendar.ts       ← Google Calendar API（freebusy / insert / delete）
│   ├── slots.ts                ← 預約時段計算（規則 × time-off × busy）
│   └── loom.ts                 ← Loom URL 解析 / oEmbed / transcript 解析
└── types/
    └── database.ts             ← Row insert/update 型別
```

### 所有 API 端點

```
認證
  POST   /api/auth/login                    ← email + password 登入
  POST   /api/auth/register                 ← 新帳號
  POST   /api/auth/logout                   ← 登出（清 token）
  POST   /api/auth/oauth-exchange           ← OAuth exchange token → JWT
  GET    /api/auth/me                       ← 取當前用戶資料
  GET    /api/auth/google                   ← Google OAuth redirect
  GET    /api/auth/google/callback          ← Google OAuth callback
  GET    /api/auth/line                     ← LINE OAuth redirect
  GET    /api/auth/line/callback            ← LINE OAuth callback

課程
  GET    /api/courses                       ← 課程列表（含 reviews 統計）
  GET    /api/courses/:id                   ← 課程詳情
  POST   /api/courses                (A)   ← 新增課程
  PUT    /api/courses/:id            (A)   ← 更新課程
  DELETE /api/courses/:id            (A)   ← 刪除課程
  POST   /api/courses/:id/reviews    (U)   ← 新增評論

文章
  GET    /api/articles                      ← 文章列表（分頁 + 篩選）
  GET    /api/articles/:slug                ← 文章詳情（by slug）
  POST   /api/articles               (A)   ← 新增文章
  PUT    /api/articles/:id           (A)   ← 更新文章
  DELETE /api/articles/:id           (A)   ← 刪除文章
  POST   /api/articles/:id/ratings   (U)   ← 評分
  POST   /api/articles/:id/comments  (U)   ← 留言
  DELETE /api/articles/comments/:id  (A)   ← 刪除留言

教學影片（Loom）
  GET    /api/lessons                       ← 教學影片列表
  GET    /api/lessons/:id                   ← 單一影片（含逐字稿）
  POST   /api/lessons                (A)   ← 新增（自動 oEmbed 補 thumbnail）
  PUT    /api/lessons/:id            (A)   ← 更新
  DELETE /api/lessons/:id            (A)   ← 刪除

Reels 影片
  GET    /api/videos                        ← 影片列表
  POST   /api/videos                 (A)   ← 新增
  PUT    /api/videos/:id             (A)   ← 更新
  DELETE /api/videos/:id             (A)   ← 刪除

站內文案 / Slides / 跑馬燈 / Podcast
  GET    /api/content                       ← site_content + banners + popups
  PUT    /api/content/:key           (A)   ← 更新文案 by key
  GET    /api/slides                        ← testimonial + gallery
  PUT    /api/slides                 (A)   ← 更新
  GET    /api/marquee                       ← 跑馬燈列表
  POST   /api/marquee                (A)   ← 新增
  PUT    /api/marquee/:id            (A)   ← 更新
  DELETE /api/marquee/:id            (A)   ← 刪除
  GET    /api/podcast                       ← Podcast 列表
  POST   /api/podcast                (A)   ← 新增集數

Landing Page
  GET    /api/landing/templates             ← 模板列表（篩選 / 分頁）
  GET    /api/landing/templates/:id         ← 模板詳情（含 sections + fields）
  GET    /api/landing/templates/:id/variants ← 模板樣式方案
  GET    /api/landing/projects/published    ← 已發布頁面列表
  GET    /api/landing/projects/slug/:slug   ← 已發布頁面 by slug（前台用）
  GET    /api/landing/projects         (A) ← 所有專案（含草稿）
  POST   /api/landing/projects         (A) ← 建立新專案
  GET    /api/landing/projects/:id     (A) ← 專案詳情 + 解析後欄位值
  PUT    /api/landing/projects/:id     (A) ← 更新專案基本資料 + variant
  PUT    /api/landing/projects/:id/fields (A) ← 批次更新欄位值
  POST   /api/landing/projects/:id/images (A) ← 上傳圖片（→ Supabase lp-images）
  DELETE /api/landing/projects/:id/images (A) ← 刪除圖片
  DELETE /api/landing/projects/:id     (A) ← 刪除專案

預約系統
  GET    /api/coach/profile                 ← 教練設定
  PUT    /api/coach/profile          (C)   ← 更新教練設定
  GET    /api/coach/availability            ← 可用規則列表
  POST   /api/coach/availability     (C)   ← 新增規則
  DELETE /api/coach/availability/:id (C)   ← 刪除規則
  GET    /api/coach/time-off                ← 休假列表
  POST   /api/coach/time-off         (C)   ← 新增休假
  DELETE /api/coach/time-off/:id     (C)   ← 刪除休假
  GET    /api/bookings/slots                ← 可用時段（計算結果）
  POST   /api/bookings               (U)   ← 用戶提交預約
  GET    /api/bookings/mine          (U)   ← 用戶的預約列表
  GET    /api/bookings               (C)   ← 教練的預約列表
  PUT    /api/bookings/:id/confirm   (C)   ← 確認預約
  PUT    /api/bookings/:id/reject    (C)   ← 拒絕預約
  PUT    /api/bookings/:id/cancel    (U)   ← 用戶取消

聊天
  GET    /api/chat/conversations            ← 我的對話列表
  POST   /api/chat/dm                       ← 建立 1v1 對話
  POST   /api/chat/group             (A)   ← 建立群組
  GET    /api/chat/conversations/:id/messages ← 訊息列表
  POST   /api/chat/conversations/:id/messages ← 發送訊息（支援圖片）
  PUT    /api/chat/conversations/:id/read   ← 標已讀
  POST   /api/chat/conversations/:id/members (A) ← 加成員
  DELETE /api/chat/conversations/:id/members/:uid (A) ← 移成員
  DELETE /api/chat/conversations/:id/leave ← 自己離開
  GET    /api/presence/:id                  ← 用戶在線狀態
  POST   /api/presence/heartbeat            ← 心跳 ping

通知
  GET    /api/notifications                 ← 通知列表
  PUT    /api/notifications/:id/read        ← 標已讀
  PUT    /api/notifications/read-all        ← 全部標已讀
  POST   /api/notifications/subscribe       ← Web Push 訂閱
  POST   /api/notifications/fcm-token       ← FCM token 登錄

用戶
  GET    /api/user/profile                  ← 個人資料
  PUT    /api/user/profile           (U)   ← 更新顯示名稱
  POST   /api/user/avatar            (U)   ← 上傳頭像
  DELETE /api/user/avatar            (U)   ← 刪除頭像

其他
  POST   /api/contact                       ← 聯絡表單寄信
  GET    /api/search?q=                     ← 全站全文搜尋

後台管理
  GET    /api/admin/users            (A)   ← 用戶列表
  PUT    /api/admin/users/:id        (A)   ← 更新用戶
  DELETE /api/admin/users/:id        (A)   ← 刪除用戶
  GET    /api/admin/whitelist        (A)   ← Admin 白名單
  POST   /api/admin/whitelist        (A)   ← 新增 admin
  DELETE /api/admin/whitelist/:id    (A)   ← 移除 admin
  GET    /api/admin/stats            (A)   ← 各模組統計數字

匯出（會員端）
  GET    /api/export/my-chats        (U)   ← 我的對話列表
  GET    /api/export/chat/:id?format=(U)   ← 匯出對話（md/txt/xlsx/docx）

匯出（後台）
  GET    /api/admin/export/modules   (A)   ← 可匯出模組清單
  GET    /api/admin/export/:module?format=(A) ← 匯出單一模組
  GET    /api/admin/export/full      (A)   ← 全站多 Sheet Excel

排程
  GET    /api/cron                          ← Supabase keep-alive
  GET    /api/cron/cleanup-chat             ← 清理過期訊息 / 圖片 / 通知

健康檢查
  GET    /api/health                        ← 服務狀態

(U) = 需登入  (A) = 需 Admin  (C) = 需教練 or Admin
```

---

## 資料庫詳解

### 資料庫連線

- **Project URL：** `https://nalerberllvvbalfmadf.supabase.co`
- **後端用：** `SUPABASE_SERVICE_KEY`（service-role，bypass RLS，所有 route 都用這個）
- **前端用：** `VITE_SUPABASE_ANON_KEY`（anon，僅用於聊天 Realtime channel 訂閱）

> ⚠️ Service-role key 等同 root 權限，**永遠不上 git，永遠不放前端 bundle**。

### 所有 Tables（按領域分組）

#### 帳號 / 授權（5 張）

| Table | 說明 | PK |
|---|---|---|
| `users` | 主要會員資料（email / username / display_name / phone / sex / avatar_url / is_active） | `user_id` |
| `user_social_accounts` | OAuth 綁定（Google / LINE），多帳號可綁同一個 user | `id` |
| `user_auth_tokens` | OAuth exchange token 暫存（短時間有效） | `id` |
| `admin_whitelist` | Admin 白名單（**email 在這裡 = admin**，與 users 分離） | `id` |
| `user_course_price_visibility` | per-user 課程價格可見性控制 | `id` |

> **Admin 判定：** 唯一依據是 `admin_whitelist.email + is_active`，`users.role` 只是描述欄位。

#### 內容（10 張）

| Table | 說明 |
|---|---|
| `courses` | 課程（title / description / content HTML / thumbnail / price / status / level） |
| `course_reviews` | 課程評論 |
| `articles` | 文章（title / slug / content HTML / category / status / view_count） |
| `article_comments` | 文章留言 |
| `article_ratings` | 文章評分 |
| `videos` | Reels 短影音（title / url / type / is_visible / sort_order / description） |
| `lesson_videos` | 教學影片（loom_id / loom_url / thumbnail_url / duration_seconds / transcript JSONB / keywords） |
| `marquee_items` | 跑馬燈（label / sub / icon / type / sort_order / is_active） |
| `podcast_episodes` | Podcast（title / description / duration / episode_date / category） |
| `site_content` | 鍵值式文案（key / value JSONB / type / title_en） |

#### 首頁專屬（5 張）

| Table | 說明 |
|---|---|
| `homepage_banners` | 輪播 banner |
| `site_popups` | 首頁彈窗 |
| `gallery_config` + `gallery_slides` | Gallery 展示 |
| `testimonial_config` + `testimonial_slides` | 學員見證 carousel |

#### 預約系統（4 張）

| Table | 說明 |
|---|---|
| `coach_profile` | 教練設定（時區 / 單堂分鐘 / buffer / 預約前置時數 / Google refresh_token） |
| `coach_availability_rules` | 週期可用規則（每週幾幾點到幾點） |
| `coach_time_off` | 一次性休假區間 |
| `bookings` | 預約記錄（pending / confirmed / rejected / cancelled / completed） |

#### 聊天（4 張）

| Table | 說明 |
|---|---|
| `chat_conversations` | 對話本體（type: dm / group） |
| `chat_participants` | 成員（含 left_at 軟刪除） |
| `chat_messages` | 訊息（content / image_url / message_type / expires_at） |
| `user_presence` | 在線狀態 / 最後上線時間 |

#### 通知（2 張）

| Table | 說明 |
|---|---|
| `notifications` | 通知（7 天過期）|
| `push_subscriptions` | Push endpoint（provider: web = VAPID / fcm = Firebase） |

#### Landing Page 系統（7 張 + 1 view）

| Table / View | 說明 |
|---|---|
| `lp_templates` | 模板定義（template_code / jsx_component_key / color_vars / page_kind） |
| `lp_template_sections` | 模板 section 結構（hero / features / pricing / faq 等） |
| `lp_template_fields` | 可編輯欄位（field_kind: plain_text / long_text / image / url / number） |
| `lp_template_field_options` | select / option_group 的選項值 |
| `lp_template_variants` | 樣式方案（dark_gold / dark_blue / light_classic 等，各有 color_vars） |
| `lp_projects` | 用戶建立的 LP 專案（status / custom_slug / variant_id / hero_image_url） |
| `lp_project_field_values` | 專案欄位填值（稀疏儲存，只存覆寫值） |
| `vw_lp_project_resolved_fields` | **VIEW**：解析後欄位值（project values 覆蓋 template defaults） |

#### 商務（4 張，目前未啟用）

`user_courses` / `orders` / `order_items` / `payments`

#### 其他（1 張）

`content_templates` — 後台內容模板樣板

### Migrations 完整清單

| 序號 | 檔名 | 新增內容 |
|---|---|---|
| 001a | `001_add_course_packages.sql` | 課程包欄位 |
| 001b | `001_fix_and_import_courses.sql` | 課程匯入修正 |
| 002a | `002_add_course_level_and_fix_keywords.sql` | 課程等級欄位 |
| 002b | `002_social_accounts.sql` | Google / LINE OAuth 綁定 |
| 003 | `003_site_content_and_popup.sql` | 站內文案 + 彈窗 |
| 004 | `004_content_templates.sql` | 後台內容範本 |
| 005 | `005_add_avatar_base64.sql` | 頭像 base64 支援 |
| 006 | `006_facebook_social_accounts.sql` | FB 綁定（已下架） |
| 007 | `007_rollback_facebook_columns.sql` | 回退 FB 欄位 |
| 008 | `008_user_course_price_visibility.sql` | 課程價格 per-user 控制 |
| 009 | `009_fix_rls_security.sql` | RLS policies 全面修正 |
| 010 | `010_testimonial_gallery.sql` | 學員見證 + Gallery |
| 011 | `011_testimonial_card_layout.sql` | 見證卡片版型 |
| 012 | `012_landing_page_templates.sql` | Landing Page Builder（6 張表 + 1 view） |
| 013 | `013_landing_page_seed.sql` | LP 初始模板 seed（AARON_GENERIC_001） |
| 014 | `014_videos_add_description_thumbnail.sql` | videos 加描述 / 縮圖 |
| 015 | `015_marquee_podcast.sql` | 跑馬燈 + Podcast 獨立表 |
| 016 | `016_coach_booking.sql` | 預約系統（4 張表） |
| 017 | `017_chat.sql` | 聊天（4 張表 + chat-images bucket） |
| 018 | `018_chat_member_management.sql` | 軟刪除 + 系統訊息 |
| 019 | `019_notifications.sql` | 通知 + Web Push 訂閱 |
| 020 | `020_push_provider_fcm.sql` | push_subscriptions 加 provider 欄位 |
| 021 | `021_lesson_videos.sql` | 教學影片（Loom）表 |
| 022 | `022_lesson_dedupe_and_unique.sql` | 去重 + partial unique index |
| 023 | `023_lp_style_variants.sql` | LP 樣式 variant 表 + lp-images bucket |
| 024 | `024_lp_more_templates.sql` | 4 個新 LP 模板（FITNESS / PRICING / MINIMAL / STORY） |
| — | `add_i18n_en_columns.sql` | 多張表加 `*_en` 雙語欄位 |
| — | `fill_en_translations.sql` | 填初版英文翻譯 |
| — | `videos_rows.sql` | 批量插入 251 筆 videos |

> **執行方式：** Supabase dashboard → SQL Editor → 貼入 SQL → Run  
> 序號是執行依賴順序，一次性腳本（無序號）可在對應功能的 numbered migration 之後執行。

### Supabase Storage Buckets

| Bucket | 用途 | 公開 | 大小限制 |
|---|---|---|---|
| `chat-images` | 聊天圖片（7 天後 cron 清理） | ✓ | 5 MB |
| `lp-images` | Landing Page 上傳圖片 | ✓ | 5 MB |

---

## Landing Page 系統

### 概念

Landing Page Builder 是一套無碼建站系統，Admin 可以從模板建立頁面、填寫欄位、切換樣式、上傳圖片，發布後透過 `/page/:slug` 公開存取。

### 架構

```
lp_templates（模板定義）
  └── lp_template_sections（區塊：hero / features / pricing...）
        └── lp_template_fields（可編輯欄位）
  └── lp_template_variants（樣式方案：dark_gold / dark_blue / light_classic）

lp_projects（專案實例）
  ├── template_id → lp_templates
  ├── variant_id  → lp_template_variants（NULL = 使用模板預設）
  └── lp_project_field_values（欄位覆寫值，稀疏儲存）

vw_lp_project_resolved_fields（VIEW）
  = 欄位值（project 覆蓋 template defaults）
```

### 現有模板

| 模板代號 | 版面風格 | jsx_component_key |
|---|---|---|
| AARON_GENERIC_001 | 通用（Hero + Features + Testimonials + CTA） | GenericLP |
| AARON_FITNESS_DARK | 健身深黑（全寬 Hero + 數據帶 + 特色卡 + 見證） | FitnessDarkLP |
| AARON_PRICING | 定價方案（Hero + 3 欄定價卡 + FAQ + CTA） | PricingLP |
| AARON_MINIMAL_LIGHT | 極簡亮色（留白 Hero + 分割介紹 + 引言 + 特色） | MinimalLightLP |
| AARON_STORY | 個人故事（電影感 Hero + 時間軸 + Gallery + 聯絡） | StoryLP |

每個模板都有 3 個樣式方案：**品牌金**（deep dark + gold）、**深海藍**（midnight + ice blue）、**簡約白**（clean white）

### CSS 變數體系

每個模板 / variant 提供以下 CSS custom properties：

```css
--lp-primary   /* 主品牌色（按鈕、accent） */
--lp-bg        /* 頁面背景色 */
--lp-surface   /* 卡片/區塊背景色 */
--lp-text      /* 主要文字色 */
--lp-muted     /* 次要文字色 */
--lp-border    /* 邊框色 */
```

### 加入新模板的步驟

1. 在 `frontend/src/components/landing-templates/` 建立新元件（參考 `FitnessDarkLP.tsx`）
2. 在 `LandingPageViewer.tsx` 的 `TEMPLATE_MAP` 加一行
3. 在 Supabase 執行 SQL 新增 template + sections + fields + variants seed
4. 元件接收 `{ project, fields }` props，用 `buildCssVars(project)` 注入樣式

---

## 匯出功能

### 會員端（chat 匯出）

| 端點 | 功能 |
|---|---|
| `GET /api/export/my-chats` | 取得自己的所有對話（給會員中心顯示） |
| `GET /api/export/chat/:id?format=md\|txt\|xlsx\|docx` | 匯出單一對話 |

- 入口 1：聊天視窗右上角 ↓ 下載圖示 → 選格式
- 入口 2：`/member` → 「匯出資料」tab → 選對話 → 選格式

### 後台端（全模組匯出）

| 端點 | 功能 |
|---|---|
| `GET /api/admin/export/modules` | 可匯出模組清單 |
| `GET /api/admin/export/:module?format=md\|txt\|html\|xlsx\|docx` | 匯出單一模組 |
| `GET /api/admin/export/full` | 全站 Excel（所有模組各一個 Sheet） |

- 入口：`/admin/export`（後台側邊欄 → 匯出中心）
- 可匯出模組：使用者 / 課程 / 文章 / Reels 影片 / 教學影片 / 預約記錄 / 所有聊天 / 跑馬燈 / Podcast / 通知 / 站內文案 / 白名單 / Landing Pages
- 密碼欄位**永遠不匯出**

### 格式支援

| 格式 | 實作 | 備註 |
|---|---|---|
| `.md` | 原生字串模板 | Markdown 表格 |
| `.txt` | 原生字串模板 | Tab 分隔 |
| `.html` | 原生字串模板 | 含基本 CSS |
| `.xlsx` | ExcelJS | 中文標題行 + 自動欄寬 + 隔行配色 |
| `.docx` | docx 套件 | Word 文件，含表格樣式 |

---

## Mobile App

### 兩個 App（均在 `mobile/` 目錄）

| App | 路徑 | 技術 | 說明 |
|---|---|---|---|
| WebView Shell | `mobile/aaron_webview/` | Flutter minimal | 把網站包成 App，WebView 載入 production URL |
| Native App | `mobile/aaron_app/` | Flutter full | 原生 UI + 深度整合 |

### Native App 功能（aaron_app）

- 登入 / 會員中心 / 課程 / 文章 / 影片 / 預約 / 聊天（Supabase Realtime）/ 通知
- FCM 推播：`fcm_registrar.dart` 監聽登入狀態，自動把 FCM token 上傳到後端
- Supabase Realtime：`supabase_flutter` 訂閱聊天 channel
- State management：Riverpod
- Navigation：go_router
- HTTP：Dio

### Firebase 設定

- `mobile/*/android/app/google-services.json` — gitignored（Firebase config）
- 後端：`FCM_SERVICE_ACCOUNT_JSON` 環境變數（firebase-admin SDK 用）
- Android 推播 → FCM；Web 推播 → VAPID（web-push）

---

## 部署流程

```
git push origin main
  │
  ▼
Vercel Webhook 觸發 Build
  │
  ▼
scripts/vercel-build.sh
  ├─ cd backend && npm install && npm run build   → backend/dist/
  ├─ cd frontend && npm install && npm run build  → frontend/dist/{client,server}
  ├─ 複製 SSR bundle → api/_ssr_bundle.cjs + api/_ssr_template.html
  └─ 刪除 frontend/dist/client/index.html（強制走 SSR，避免 SPA 404）
  │
  ▼
Vercel Functions 上線
  /api/*  → api/server.js → require("backend/dist/index.js")  [Express]
  /*      → api/ssr.js    → React SSR render
  cron    → api/cron.js   → keep-alive / cleanup
```

### Vercel 設定重點（vercel.json）

- Build command: `bash scripts/vercel-build.sh`
- Output directory: `frontend/dist/client`
- Function includes: `backend/dist/**` / `api/_ssr_*`
- Function timeout: 10 秒
- Cron jobs: 每天 2 支（UTC 04:00 / UTC 19:00）
- Assets cache: `public, max-age=31536000, immutable`

---

## 本機開發

### 一鍵啟動

```powershell
# 根目錄
npm install    # 安裝根 + backend + frontend 依賴
npm run dev    # 並行啟動 backend (3001) + frontend (5173)
```

### 分開啟動

```powershell
# Terminal 1：後端
cd backend
npm install
npm run dev           # tsx watch → http://localhost:3001

# Terminal 2：前端
cd frontend
npm install
npm run dev           # Vite → http://localhost:5173
                      # /api/* 會 proxy 到 localhost:3001
```

---

## 環境變數

### `backend/.env.local`（永遠不上 git）

```bash
# 必填
SUPABASE_URL=https://nalerberllvvbalfmadf.supabase.co
SUPABASE_SERVICE_KEY=<service role key>    # 極敏感
JWT_SECRET=<隨機 32+ 字元>
CRON_SECRET=<隨機字串>
FRONTEND_URL=http://localhost:5173         # production 改 Vercel URL

# Web Push（選填，沒設則跳過 web push）
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:noreply@coach-aaron.local

# Firebase FCM（選填，沒設則跳過 FCM）
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Google OAuth（選填）
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
COACH_GOOGLE_CALENDAR_ID=<教練 email>     # Google Calendar 同步用

# LINE Login（選填）
LINE_CHANNEL_ID=...
LINE_CHANNEL_SECRET=...

# 聯絡表單寄信（選填）
MAIL_FROM=...
MAIL_HOST=...
MAIL_PASS=...

# 本機
PORT=3001
```

### `frontend/.env.local`（永遠不上 git）

```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://nalerberllvvbalfmadf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>         # 僅用於聊天 Realtime 訂閱
```

> Production 環境變數統一在 **Vercel Dashboard → Settings → Environment Variables** 設定，不靠 `.env` 檔。

---

## 排程任務

| Cron（UTC） | 台灣時間 | 路徑 | 動作 |
|---|---|---|---|
| `0 4 * * *` | 12:00 中午 | `/api/cron` | Supabase keep-alive（避免免費方案 inactive 暫停） |
| `0 19 * * *` | 03:00 凌晨 | `/api/cron/cleanup-chat` | 清理 7 天前聊天訊息 + Storage 圖片 + 過期通知 |

認證：`Authorization: Bearer ${CRON_SECRET}`

---

## i18n 與主題

### 多語言（繁中 / English）

- 純前端字典：`frontend/src/context/LanguageContext.tsx`
- 切換按鈕：Navbar 右上角 / Admin sidebar
- DB 內容：paired column 設計（`title` / `title_en`），fallback 邏輯在 `useLocalize` hook
- i18n key 涵蓋：nav / common / article / course / videos / member / login / register / admin / exportFeature 等

### 主題（Dark / Light）

- DaisyUI v5 雙主題：`studio`（暗）/ `studio-light`（亮）
- 切換：修改 `<html data-theme="...">`
- ⚠️ Tailwind v4 **不支援** `dark:` prefix，改用 `[data-theme="studio-light"]` selector 覆寫 CSS variables

### Landing Page 主題

- 每個模板 / variant 有獨立的 CSS custom properties（`--lp-primary` / `--lp-bg` 等）
- 元件在根 div 注入這些 vars，所有子元件用 `var(--lp-primary, fallback)` 引用

---

## 安全規則

### 永遠不上 git 的東西

| 路徑 | 原因 |
|---|---|
| `backend/.env*.local` | JWT secret / Supabase service key / FCM key |
| `frontend/.env*.local` | Supabase anon key |
| `mobile/**/google-services.json` | Firebase OAuth client id |
| `*-firebase-adminsdk-*.json` | Firebase service account 私鑰 |
| `database/snapshot/` | 含真實用戶資料（email / phone / hashed password） |
| `database/scripts/import_*.mjs` | 一次性 hardcode key 的腳本 |
| `database/scripts/migrate_*.mjs` | 同上 |
| `database/dump_snapshot.mjs` | 含 service-role key 硬編 |

`.gitignore` 已設保護，**不要手動 `git add -f`**。

### Supabase RLS 原則

| Pattern | 適用 |
|---|---|
| Public read | articles / courses / videos / lesson_videos / site_content |
| Own-row only | bookings / chat_* / notifications / push_subscriptions |
| Admin all | 透過 `public.is_admin()` function（查 admin_whitelist） |
| Backend bypasses | 後端全用 service-role key，RLS 不 enforce |

---

## 除錯指南

### 一般流程

1. **Vercel Deployments tab** — 最新 commit 是 Ready 還是 Error？
2. **Vercel Function logs** — Dashboard → Functions → 點 function → invocation log
3. **Supabase logs** — Dashboard → Logs → API / Postgres（看慢查詢 / 報錯）
4. **本機重現** — `npm run dev` 在自己機器跑同樣請求

### 常見問題

| 症狀 | 原因 / 解法 |
|---|---|
| Landing page 回 404 | `getProjectBySlug` Supabase query 語法錯，看 Network tab 的 API response |
| Admin 所有端點 401 | `admin_whitelist.is_active` 是否 true / email 大小寫不一致 |
| Landing page variant 不套用 | migration 023 是否已執行 |
| 新模板看不到 | migration 024 是否已執行 |
| Realtime 沒觸發 | 前端有沒有設 `VITE_SUPABASE_ANON_KEY`（聊天用 anon） |
| 預約 slot 算錯 | 時區！DB 存 UTC，計算用 `Asia/Taipei`（`date-fns-tz` toZonedTime） |
| Vercel cron 401 | `Authorization: Bearer ${CRON_SECRET}` 沒帶 |
| firebase-admin 重複 init | 已加 `if (admin.apps.length === 0)` 守門，若還報錯確認 `FCM_SERVICE_ACCOUNT_JSON` 格式 |
| `Unexpected token '<'` 在 script.js | Service worker 快取到舊 HTML，清除瀏覽器快取 / 重新整理 SW |

### Vercel 部署 commit 不同步

通常是按到舊 deployment 的「Redeploy」（會用當時的 commit，不是最新的）。確認 deploy 來源後重新 push 觸發新的 build。
