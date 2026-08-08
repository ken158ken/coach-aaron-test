# 接續 Context（Aaron 教練網站）— 複製到下個 task 用

## 專案 / 部署
- 前端+後端專案根目錄：`X:\其他\小實用網頁\Aaron教練網頁\前端新設計參考 (react)1\`
- 正式站：https://coach-aaron-test.vercel.app （Vercel，經 GitHub 自動部署）
- **部署方式：`git commit` + `git push origin main`**（Vercel 自動建置）。**Vercel CLI 在此 shell 的 token 已過期，不能用 `vercel` 指令**，一律走 git push。
- 驗證部署上線：輪詢 `https://coach-aaron-test.vercel.app/sw.js` 的 `SW_VERSION`（已改為每次部署=commit SHA）。
- 技術棧：Vite + React 19 + SSR（`X-Rendered-By: ssr`）、backend Express（`api/server`）、Supabase、Tailwind v4、framer-motion。
- 型別檢查：`cd frontend && npx tsc --noEmit`；backend `cd backend && npm run build`。**目前應為 0 錯誤**（先前的 Navbar `sex` 錯誤已修）。

## 重要慣例 / 雷區
- 客戶端（阿倫本人）是非工程師，溝通用**繁體中文**。
- 圖片一律 Cloudinary（`https://res.cloudinary.com/daejq0zo9/`）。
- **看網站/後台前要清一次 Service Worker**：F12 → Application → Clear site data（SW 已改網路優先 + 每次部署換版本，這是一次性）。
- 首頁各區塊多在 `LazySection` + AOS（捲動才顯示）→ headless 靜態截圖看似空白屬正常；驗證用 puppeteer-core（`/tmp/shot/`，系統 Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`）捲動後截圖。
- 前端 auth token 是**記憶體變數**（api.ts `_authToken`），reload 靠 httpOnly cookie + `/api/auth/me`（initAuth）還原。

## 剛修好的 bug（本次 task）
- `users.sex` 欄位已被 migration 025 DROP，但多處仍 explicit `select(...sex...)` → 查詢 500：
  - `admin.ts` 用戶列表 → 修「載入用戶失敗」
  - `auth.ts` `GET /me` select + JWT/回應 sex → 修 /me 500（**很可能也是先前「reload / Google 連結後被登出」的根因**）
  - `Navbar.tsx` 移除依 user.sex 的廢棄 /photos 連結
- 已 commit + push（等部署驗證）。

## 待客戶自己在 Supabase 跑的 migration（若還沒跑）
- `029_testimonial_quote_grid.sql`（見證版型；客戶說跑過）
- `031_seed_testimonials.sql`（9 筆假教練見證，客戶要跑才會有素材）
- `027/028_lp_*.sql`（Landing Page 圖文模板，選跑）
- `030_b2b_site_content.sql`（B2B 文案，客戶已跑）

## 已完成的大項
- 首頁 B2B 改版（純 B2B 定位，服務對象＝教練）：Hero → 關於教練 → 服務(apple-cards) → 學員留言(card-stack 三欄) → Moments → 人設經歷(animated-testimonials 倒敘、多圖1秒輪播) → Credentials。Podcast 已移除（假資料）。
- 效能：行動版 57→75、桌機 91；bundle code-split；SW 版本自動化。
- 內頁 SEO：SSR 資料預抓、sitemap、真 404、canonical。
- 關於教練照片：5 張 Cloudinary 輪播（3 秒）。
- `/about` 公開頁（職涯時間軸+證照+成就+自傳，SSR、BreadcrumbList）。
- Google 日曆：路線 A（會員自動收邀請+提醒）、Meet 自動連結、booking_id 綁定、後台 `/admin/google-calendar` 頁（彈窗連結/切換/登出，不再登出網站）。OAuth 已 Production（無 7 天限制）。

## 待辦 / 待客戶決定
- 隱私權政策 + 服務條款頁（`/privacy`、`/terms`）—— 尚未建，Google 驗證去警告會用到。
- 待佐證數字（月入8萬 / 130位教練）目前全站有用，客戶未拍板是否保留。
- Services / apple-cards 卡片圖片、Career 已有圖；其餘佔位待補圖。
- 研究報告在 `REPORTS/`：`GOOGLE_CALENDAR_功能研究.md`、`效能_根因與修復方案.md`、`SEO稽核與框架選型評估.md`、`INDEX_*`。人設/履歷在 `人設揣摩/`、`整理結果(markdown)/`。

## 常用驗證片段
```bash
# 部署輪詢
for i in $(seq 1 25); do v=$(curl -sS "https://coach-aaron-test.vercel.app/sw.js?cb=$RANDOM$i" | grep -oE 'SW_VERSION = "[0-9a-f]{7}'); echo "$v"|grep -q "$(git rev-parse --short HEAD)" && { echo OK; break; }; sleep 20; done
```
