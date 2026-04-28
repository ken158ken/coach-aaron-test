# Frontend — React 19 + Vite SSR + Tailwind v4

> 主站（公開 + 會員 + admin 後台）一個 SPA 統包。Vite SSR 預渲染 HTML 給 SEO，hydrate 後就純 client-side。Tailwind v4 + DaisyUI v5 雙主題（dark / light）。

## 📁 目錄結構

```
frontend/
├── package.json
├── vite.config.ts          ← 雙 build 設定（client + ssr）
├── tsconfig.json
├── tailwind.config.js      ← 主要靠 @theme 在 index.css 定義 token
├── public/
│   ├── manifest.json       ← PWA manifest
│   ├── sw.js               ← Service Worker（Web Push + offline cache）
│   └── icons/              ← PWA icon
└── src/
    ├── entry-client.tsx    ← Browser 入口：hydrateRoot + SW register
    ├── entry-server.tsx    ← SSR 入口：renderToString + helmet
    ├── App.tsx             ← Provider tree + Routes 表
    ├── main.tsx            ← 純 SPA fallback（dev 時用）
    ├── index.css           ← Tailwind v4 + 主題 token + 全域樣式
    │
    ├── pages/              ← 22 公開頁 + 13 admin 頁 + 1 coach 頁
    ├── components/         ← 12 子分類（見下）
    ├── services/           ← 21 個 API service（一個 domain 一個檔）
    ├── context/            ← 5 個 Provider（Auth / Theme / Lang / 兩個 Notification）
    ├── hooks/              ← 19 個 custom hook
    ├── lib/                ← 5 個 lib（api、auth、Lenis、registerSW、ui）
    ├── types/              ← 6 個型別檔（user / content / api / admin / lesson / three.d）
    ├── constants/          ← 常數
    └── data/               ← 靜態 seed data（少數 hard-coded 內容）
```

---

## 🌳 Provider Tree（順序很重要）

```tsx
<AuthProvider>
  <NotificationProvider>           ← 系統通知（鈴鐺 / 推播）
    <ChatNotificationProvider>     ← 聊天未讀數
      <Heartbeat />                 ← 已登入時打 user_presence 心跳
      <ThemeProvider>
        <LanguageProvider>
          <DialogProvider>
            <SmoothScroll>          ← Lenis（dynamic import）
              <Analytics />
              <ScrollToTop />
              <PageBlade />         ← 全頁切換時的「銀刃」過場
              <Routes>...</Routes>
            </SmoothScroll>
          </DialogProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ChatNotificationProvider>
  </NotificationProvider>
</AuthProvider>
```

---

## 📄 Pages（公開：22 頁）

| Path | File | 用途 |
|---|---|---|
| `/` | `Home.tsx` | 首頁（Hero / 教練介紹 / Podcast / 見證 / Gallery / Marquee） |
| `/courses` | `Courses.tsx` | 課程列表（等級 + 分類雙篩選） |
| `/courses/:id` | `CourseDetail.tsx` | 課程詳情 + 評論 + 結帳 CTA |
| `/videos` | `Videos.tsx` | **Reels 牆**（短影音 grid） |
| `/lessons` | `Lessons.tsx` | **教學影片**（Loom，寬幅卡片） |
| `/lessons/:id` | `LessonDetail.tsx` | 影片 + 同步逐字稿 |
| `/articles` | `Articles.tsx` | 文章列表（分類 + 分頁） |
| `/articles/:slug` | `ArticleDetail.tsx` | 文章詳情 + 評分 + 留言 |
| `/contact` | `Contact.tsx` | 聯絡表單 |
| `/login` | `Login.tsx` | Email + 第三方登入 |
| `/register` | `Register.tsx` | 註冊 |
| `/member` | `MemberCenter.tsx` | 會員中心（resume / 個人設定） |
| `/dashboard` | `Dashboard.tsx` | 簡易學習儀表板 |
| `/checkout` | `Checkout.tsx` | 結帳（目前未啟用金流） |
| `/checkout/success` | `CheckoutSuccess.tsx` | 結帳成功 |
| `/booking` | `BookingPage.tsx` | 預約諮詢 |
| `/my-bookings` | `MyBookingsPage.tsx` | 我的預約 |
| `/coach` | `coach/CoachDashboard.tsx` | 教練 / Admin 看待審核預約 |
| `/chat`、`/chat/:conversationId` | `Chat.tsx` | 聊天（DM + 群組） |
| `/notifications` | `NotificationsPage.tsx` | 通知中心 + 推播設定 |
| `/pages` | `PublishedPages.tsx` | 已發佈的動態 landing page 列表 |
| `/page/:slug` | `LandingPageViewer.tsx` | 單一動態 landing page（**不套 Layout**，全頁獨立） |

## 🛠️ Pages — Admin（13 頁，全部 require admin）

| Path | File |
|---|---|
| `/admin` | `AdminDashboard.tsx` |
| `/admin/users` | `AdminUsers.tsx` |
| `/admin/whitelist` | `AdminWhitelist.tsx` |
| `/admin/courses` | `AdminCourses.tsx` |
| `/admin/courses/new`、`/admin/courses/:id/edit` | `CourseEditor.tsx`（**獨立全螢幕**，不套 AdminLayout） |
| `/admin/articles` | `AdminArticles.tsx` |
| `/admin/articles/new`、`/admin/articles/:id/edit` | `ArticleEditor.tsx`（同上獨立全螢幕） |
| `/admin/videos` | `AdminVideos.tsx` |
| `/admin/lessons` | `AdminLessons.tsx` |
| `/admin/content` | `AdminContent.tsx`（site_content / banner / popup / marquee / podcast） |
| `/admin/landing-pages` | `LandingPageManager.tsx` |
| `/admin/landing-pages/new` | `LandingPageNew.tsx`（獨立） |
| `/admin/landing-pages/:id/edit` | `LandingPageEditor.tsx`（獨立） |

---

## 🌐 Services（21 個，一個 domain 一個檔）

`services/api.ts` 是底層 wrapper（fetch + auth header + 錯誤處理 + 自動 unwrap data），**所有 service 都靠它**。

| Service | API base | 重點 method |
|---|---|---|
| `api.ts` | — | `get / post / put / del / patch`（底層） |
| `auth.service.ts` | `/api/auth/*` | `login / register / logout / checkAuth / exchangeOAuthCode` |
| `user.service.ts` | `/api/user/*` | `updateProfile / uploadAvatar` |
| `course.service.ts` | `/api/courses/*` | `getAll / getById` + reviews |
| `article.service.ts` | `/api/articles/*` | `getAll / getById` + ratings + comments |
| `video.service.ts` | `/api/videos/*` | Reels 牆 CRUD |
| `lesson.service.ts` | `/api/lessons/*` | 教學影片 CRUD |
| `content.service.ts` | `/api/content/*` | site_content / banner / popup |
| `marquee.service.ts` | `/api/marquee/*` | 跑馬燈 |
| `podcast.service.ts` | `/api/podcast/*` | Podcast |
| `slides.service.ts` | `/api/slides/*` | 學員見證 / Gallery |
| `landing.service.ts` | `/api/landing/*` | 動態 landing page builder |
| `coach.service.ts` | `/api/coach/*` | 教練 profile / availability / Google 連結 |
| `booking.service.ts` | `/api/bookings/*` | slot 查詢 / 建立 / 取消 / 批准 |
| `chat.service.ts` | `/api/chat/*` | conversations / messages / 群組成員 |
| `presence.service.ts` | `/api/presence/*` | heartbeat |
| `realtime.service.ts` | Supabase Channel | 訂閱 `conv-{uuid}` broadcast |
| `notification.service.ts` | `/api/notifications/*` | list / read / delete |
| `pushSubscription.service.ts` | （瀏覽器 + `/api/notifications/push/*`） | 開關 Web Push |
| `search.service.ts` | `/api/search/*` | 全站搜尋 |
| `supabase.client.ts` | — | 建 Supabase JS client（**只給 Realtime 用**） |

---

## 🪝 Hooks（19 個）

### 業務邏輯
| Hook | 用途 |
|---|---|
| `useChat` | 進聊天 thread 管整套狀態（fetch / send / 樂觀更新 / Realtime 訂閱） |
| `useChatNotifications` | 全域聊天未讀計數（rate-limited polling + Realtime 補強） |
| `useNotifications` | 通知中心列表 + 鈴鐺未讀 |
| `usePresence` / `useHeartbeat` | user_presence 心跳（每 30 秒一次） |
| `useCoachAccess` | 路由守門：是否教練 / admin |
| `useCourses` / `useVideos` | 列表頁的 fetch + 分頁 |
| `useUser` | 目前登入用戶資料（從 AuthContext 包一層） |
| `useSiteContent` | 抓 `site_content` 並做模組層快取，避免 home 多區塊重打 API |

### UI / 互動
| Hook | 用途 |
|---|---|
| `useScrollReveal` | IntersectionObserver 滾動觸發動畫 |
| `useScrollAnimation` | GSAP timeline 滾動動畫 |
| `useScrollLock` | Modal 開啟時鎖 body scroll |
| `useMagnetic` | 磁性 cursor 效果（hover 吸引） |
| `useMediaQuery` | 響應式斷點 |
| `useLocalStorage` | 持久化 state |
| `useLocalize` | i18n lookup（含 fallback 邏輯：英文沒填就用中文） |
| `useRichTextEditor` | TipTap 編輯器初始化（共用給 Article / Course / Landing） |
| `useSafeInput` | 表單輸入清理 |

---

## 🌎 Contexts（5 個）

| Provider | 提供 |
|---|---|
| `AuthProvider` | `user`、`isAuthenticated`、`isAdmin`、`login()`、`logout()`、`checkAuth()`、`loginFromOAuth()`、`updateUser()` |
| `ThemeProvider` | `theme` (`'studio' | 'studio-light'`)、`isDark`、`toggleColorMode` — `localStorage('theme')` 持久化 |
| `LanguageProvider` | `language` (`'zh-TW' | 'en'`)、`t`（一大包翻譯物件）、`toggleLanguage` |
| `NotificationProvider` | 系統通知列表 + push 訂閱狀態 |
| `ChatNotificationProvider` | 聊天未讀數 + 即時新訊息 toast |

`DialogProvider`（在 `components/ui/Dialog.tsx`）也是 context，提供 `useDialog()` → `prompt / confirm / alert` API。

---

## 🎨 主題 / 樣式

### Tailwind v4 + DaisyUI v5

`frontend/src/index.css` 定義雙主題（DaisyUI 命名為 `studio` 與 `studio-light`），用 OKLch 色彩空間。

```css
@theme {
  /* 暗色（預設） */
  --color-studio-bg:        #0a0a0a;
  --color-studio-surface:   #141414;
  --color-studio-surface-2: #1e1e1e;
  --color-gold:             #c5a059;
  --color-gold-dim:         #8a6030;
  --color-text-main:        #f0f0f0;
  --color-text-muted:       #888888;
}

[data-theme="studio-light"] {
  /* 淺色覆寫 */
  --color-surface:   #f5f3ef;
  --color-surface-2: #ece9e4;
  --color-muted:     rgba(40,36,30,0.58);
  /* ... */
}
```

切換主題：`ThemeContext.toggleColorMode()` 改 `<html data-theme="...">`。

> ⚠️ Tailwind v4 沒 `darkMode: 'class'`。**用 `data-theme` selector**，不是 `dark:` prefix（會無效）。

### 全域樣式

`index.css` 後段有大量 `.studio-*` 自訂 class（PageHeader / 課程卡片 / filter pill 等），是早期沒拆 component 的遺產。新 component 盡量用 utility class 不再加。

---

## 🌍 i18n

純前端字典，沒接 i18next。

`context/LanguageContext.tsx` 的 `Translations` interface 列出每個翻譯鍵；`zhTW` 與 `en` 兩個物件實作。

**用法：**
```tsx
const { t, language } = useLanguage();
return <h1>{t.nav.lessons}</h1>;
```

DB 內容的多語言（標題 / 描述 / 內容 HTML）走「paired column」：`title` + `title_en`，前端用 `useLocalize` hook：
```tsx
const { loc } = useLocalize();
loc(article, 'title');  // 英文沒填會自動 fallback 中文
```

---

## 🧱 Components 子分類

```
components/
├── admin/             ← AdminLayout / Sidebar
├── auth/              ← RequireAuth / RequireAdmin
├── chat/              ← ConversationList / MessageThread / NewChatModal / GroupMembersModal / UserAvatar / PresenceDot / UnreadBadge
├── editor/            ← ResizableImage / ResizableYoutube / ResizableLoom / ImageGallery / RichTextEditor
├── landing-templates/ ← 各種 LP 區塊樣板
├── layout/            ← Layout / Navbar / Footer / SmoothScroll / PageBlade / ScrollToTop
├── notifications/     ← NotificationBell（鈴鐺）
├── sections/          ← 首頁分塊（Hero / Podcast / Testimonials …）
├── seo/               ← SEOHead（react-helmet）
├── three/             ← 3D 元件（少量首頁特效）
└── ui/                ← Button / Input / Modal / Dialog / Tooltip / Sparkles / GlobalSearch
```

`components/ui/index.ts` 是 barrel export，import 方便：
```tsx
import { PillButton, Modal, Loading, useDialog } from "@/components/ui";
```

---

## 🚀 SSR + 部署

`vite.config.ts` 雙 build：
- **client**：標準 React build → `dist/client/assets/*.js`
- **ssr**：把 `entry-server.tsx` bundle 成 CJS → `dist/server/entry-server.cjs`

部署 pipeline（`scripts/vercel-build.sh`）：
1. 跑 `npm run build` 出 client + ssr 兩份
2. 把 ssr bundle 複製到 `api/_ssr_bundle.cjs`
3. 把 `dist/client/index.html` 變成 `api/_ssr_template.html`（保留 `<!--ssr-outlet-->` 標記）
4. **刪掉** `dist/client/index.html`，這樣 Vercel 不會走靜態 fallback，所有 path 強制走 `api/ssr.js`

`api/ssr.js` 收到 request → require ssr bundle → `render(url)` 回傳 `{html, helmet}` → 注入 template → 回 client。

> 為什麼這樣搞：要 SSR 又要 Vercel 不用 Next.js 框架。Vercel rewrites 把所有 path 導向 `/api/ssr`，讓我們完全控制 HTML 輸出（含 Open Graph / SEO meta）。

### Lenis SmoothScroll

`SmoothScroll.tsx` **dynamic import** Lenis（避免 SSR 載入 `window`）；首屏 ~500ms 內等待 Lenis 初始化完才跑 AOS.refresh()，否則動畫會亂跳。

---

## 💻 本機開發

```powershell
cd frontend
npm install
npm run dev          # http://localhost:5173 — vite dev + proxy /api → :3001
```

> 後端要另開一個 terminal `cd backend && npm run dev`。

build：
```powershell
npm run build        # 出 dist/client + dist/server
npm run preview      # 預覽 client build
```

> SSR 預覽不能在本機跑（需要 vercel runtime），靠 vercel preview deploy 驗證。

---

## ✏️ 編輯器（TipTap）

文章 / 課程 / Landing block 都用同一份 `useRichTextEditor` hook 裝起來的 TipTap editor。

支援的 node：
- 標準（粗體 / 斜體 / 標題 / 列表 / code block / 引用）
- `ResizableImage` — 拖曳調整大小的圖片
- `ImageGallery` — 多圖網格
- `ResizableYoutube` — YouTube embed（vault 內預設 16:9，可拖大小）
- `ResizableLoom` — Loom embed（同上）
- `Link` / `CharacterCount` / `Placeholder`

工具列在 `components/editor/RichTextEditor.tsx` 一字排開，每個 callback 都是 ArticleEditor / CourseEditor 自己 inject 進來（驗證 + dialog prompt 寫在 editor page 自己那邊）。

---

## 🧭 路由結構（App.tsx）

兩段式：
1. **公開 + 會員區** — 包在 `<Layout />`（Navbar + Footer）下
2. **後台** — 包在 `<RequireAdmin>` + `<AdminLayout />`（Sidebar）下
3. **獨立全螢幕路由** — 編輯器類型（ArticleEditor / CourseEditor / LandingPageEditor）跳出 layout，用整個視窗
4. **動態 landing page** — `/page/:slug` 也是不套 Layout，全頁獨立

`<RequireAuth>` / `<RequireAdmin>` 在 `components/auth/RequireAuth.tsx`，沒登入就 navigate 到 `/login`，admin 不通過則 `/`。

---

## 🐛 常見坑

| 症狀 | 原因 / 解法 |
|---|---|
| Hydration mismatch warning | SSR 跟 client render 不一致 — 通常是 ThemeProvider 或 LanguageProvider 在 SSR 跟 client 拿到不同預設。看 `useTheme` / `useLanguage` 的 `mounted` 狀態 |
| 點 navbar 兩次才換頁 | Lenis 還沒 init 完，PageBlade 過場吃掉第一次 click。已加 `lastFired` 冷卻 |
| Firefox 卡片 hover 後消失 | Framer Motion `animate` 必須配 `initial`，缺它 Firefox 會把過渡值當 invalid CSS 全砍。所有 `motion.div` 都要明確 `initial={{}}` |
| 後台變色不適配亮色 | 早期 hard-code 的 `text-white/X` `bg-luxe-bg` 沒走 theme variable。`index.css` 末段有 safety net 強制覆寫 |
| 圖片只能放 Cloudinary | 後端 `/api/content` 寫入時做了三層驗證，URL 必須 `https://res.cloudinary.com/daejq0zo9/...` |
