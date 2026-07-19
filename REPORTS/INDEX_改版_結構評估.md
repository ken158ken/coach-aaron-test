# 首頁（Index）改版 — 元件結構評估報告

> 日期：2026-07-19
> 範圍：僅評估與規劃，**未修改任何程式碼**
> 前提：本站目前單一 bundle 未壓縮 3,527 KiB、無 code splitting，因此所有建議一律**以不新增套件為原則**

---

## 0. 摘要（先看這段）

| 項目 | 結論 |
|---|---|
| 需新建的元件 | **1 個**（`ServicesSection`）+ **1 個由既有元件改造**（`CareerCarousel`） |
| 需刪除的元件 | `CardStackTestimonial.tsx`（改造後回收）、`ReviewSection.tsx`、`PodcastSection.tsx`（已是死碼） |
| 需新增的套件 | **0 個**（framer-motion + AnimatePresence 已足夠） |
| 預估工作量 | **5.5 ～ 8 人天**（不含文案盤點與後台美化） |
| 最大阻塞 | 客戶未表態的 3 件事：Credentials、Podcast、**以及客戶清單裡漏掉的 GallerySlider**（見 §6） |

**兩個關鍵技術發現（會大幅降低工作量）：**

1. **Student Reviews 與 Real Reviews 讀的是同一份資料** —— 兩者都呼叫 `slidesService.getTestimonials()`，只是版型不同。合併不是「資料整併」，而是「刪掉一個版型」，成本極低。
2. **「其他人設經歷」要的輪播效果，現成的程式碼已經寫好了** —— `CardStackTestimonial.tsx` 的「一次顯示 N 筆、整組換場」邏輯，正好就是客戶說的「一次可插入多筆經歷」。合併 §4 後這個元件本來要刪除，改為**回收改造**，等於零成本取得輪播。

---

## 1. 現況盤點

### 1.1 首頁組成

首頁入口：`frontend/src/pages/Home.tsx`（111 行）
區塊元件目錄：`frontend/src/components/sections/`

| # | 畫面上的區塊 | 元件檔案 | 行數 | 資料來源 |
|---|---|---|---|---|
| 1 | Hero | `sections/HeroSection.tsx` | 303 | `contentService.getPublicContent()` → `hero_*` keys；GSAP 進場 |
| 2 | 關於教練 | `sections/CoachIntroSection.tsx` | 170 | `contentService` → `about_coach`、`coach_intro_*`；`coach_intro_bullets` 是 JSON 陣列 |
| 3 | Credentials | `sections/CertificationMarquee.tsx` | 160 | `marqueeService.getAll()` → DB `marquee_items` 表（cert / stat 兩型） |
| 4 | Podcast | `sections/PodcastExpandable.tsx` | 290 | `podcastService` → DB `podcast_episodes` 表；標題文案走 `useSiteContent` |
| 5 | Student Reviews | `sections/TestimonialCarousel.tsx` | 434 | `slidesService.getTestimonials()` + `getTestimonialsConfig()` |
| 6 | Real Reviews | `sections/CardStackTestimonial.tsx` | 229 | **`slidesService.getTestimonials()`（同上，同一份資料）** |
| 7 | 相片輪播 | `sections/GallerySlider.tsx` | 412 | `slidesService.getGallery()` |
| 8 | Moments | `sections/DirectionAwareGallery.tsx` | 157 | **`slidesService.getGallery()`（同上，同一份資料）** |

> ⚠️ **客戶提供的現況清單只有 7 項，漏掉了第 7 項 `GallerySlider`（相片輪播）。** 這是本次規劃必須先釐清的問題之一，見 §6.3。

另有首頁彈窗 `sections/HomePopup.tsx`（156 行），與區塊順序無關，改版不受影響。

### 1.2 死碼（可直接清掉）

`sections/ReviewSection.tsx`（172 行）與 `sections/PodcastSection.tsx`（174 行）已被 `CardStackTestimonial` / `PodcastExpandable` 取代，全專案**無任何引用**，但仍掛在 `sections/index.ts` 的 barrel export 中，因此**照樣被打包進 bundle**。約 346 行純浪費。

### 1.3 資料層與後台

- 文案讀取統一走 `frontend/src/hooks/useSiteContent.ts`（模組層級快取，全站只打一次 `/api/content`）。舊元件 `HeroSection` / `CoachIntroSection` 仍直接呼叫 `contentService`，未使用此 hook，**各自多打一次 API**（可順手統一）。
- 後台編輯頁：`frontend/src/pages/admin/AdminContent.tsx`（2,576 行，單一巨型元件，6 個 tab）。
- **`site_content` 後端沒有 key 白名單**，任何 key 都能寫入；真正的「已知 key 清單」在前端 `frontend/src/utils/homepageSections.ts`（8 個區塊、約 30 個 key）。新增 key 只要在此檔加入，**後端零改動**。
- 陣列型 key 由 `isArrayKey()` 以 `_bullets|_list|_items` 後綴自動判定，後台會給 chip 編輯器；圖片型由 `_url|_image|image_url` 判定，並強制 Cloudinary 前綴 `https://res.cloudinary.com/daejq0zo9/`。
- 後端路由：`backend/routes/content.ts`（`/api/content`）、`slides.ts`、`marquee.ts`、`podcast.ts`。
- DB migration 放 `database/migrations/`，手動套用至 Supabase，**下一個可用編號是 029**。

### 1.4 效能現況（本次改版的硬性約束）

- `frontend/src/App.tsx` 以**靜態 import 載入全部 40+ 個頁面**，包含 GrapesJS、TipTap、moveable、@scena 等重量級後台編輯器 → 這才是 3,527 KiB 的主因，與首頁區塊關係不大。
- `frontend/vite.config.ts` 客戶端建置**沒有設定 `manualChunks`**，也沒有任何 `React.lazy`。
- 好消息：`three` 已經是動態 import（`components/three/AbyssScene.tsx`），沒有進主 bundle。
- 因此本次改版的原則是：**不要讓首頁再變胖**，並順手把死碼清掉。真正的瘦身要靠 admin 頁面 lazy load（見 §7.4）。

---

## 2. 新結構逐項對應方案

### 2.1 Hero — 沿用，零改動

`sections/HeroSection.tsx` 不動。唯一需要調整的是 `Home.tsx` 的 `SEOHead` keywords（見 §7.2）。

**工作量：0**

---

### 2.2 關於教練 — 修改既有元件

**檔案：`frontend/src/components/sections/CoachIntroSection.tsx`**

要放入的履歷內容（出自 `人設揣摩/阿倫_正式履歷.html`「近年・教練教育」段）：

> 教練職涯培訓講師 / 私教變現顧問 —— 面向同業私人教練開設培訓與顧問服務，主題聚焦私教變現、銷售心理學、課程成交、續約與客戶經營。累積逾 1000 小時教學／授課時數，協助超過 130 位私人教練提升收入（多位年收破百萬），並曾進行企業內訓。

**建議做法（維持可後台編輯，不寫死）：**

新增 3 個 `site_content` key：

| key | 型別 | 用途 |
|---|---|---|
| `coach_intro_role_label` | 文字 | 「教練職涯培訓講師 / 私教變現顧問」 |
| `coach_intro_role_body` | 長文字 | 該段敘述 |
| `coach_intro_role_stats` | 陣列（`_stats` 需改用 `_items` 後綴才會自動吃到 chip 編輯器，建議命名 `coach_intro_role_items`） | 「1000+ 小時授課」「130+ 教練」「企業內訓」 |

具體改動：

1. `CoachIntroSection.tsx` — 在現有 `bullets` 清單下方加一個「身分卡」區塊，沿用既有的 `data-aos="fade-up"` + `delay` 遞增節奏（目前最後一個 delay 是 320，新區塊接 400）。
2. 順手把此元件從直接呼叫 `contentService` 改為 `useSiteContent()`，消除一次重複 API 請求。
3. `frontend/src/utils/homepageSections.ts` — 在 `id: 'coach_intro'` 的 `keys` 陣列加入上述 3 個 key。
4. 新 migration `database/migrations/029_*.sql` 或直接由後台「新增」按鈕建立 3 筆 `site_content`。
5. （選配）`frontend/src/utils/contentTemplates.ts` — 為 `coach_intro_role_body` 加 2～3 組範本，讓客戶有現成文案可選。

**風險：** 版面右欄會變長，桌機版左圖右文的垂直置中會失衡，需微調 `items-center`。
**工作量：0.5 ～ 1 人天**

---

### 2.3 主要服務項目和專長 — 新建元件

**新檔案：`frontend/src/components/sections/ServicesSection.tsx`**

內容由同事盤點中，所以此處只定版位與資料結構。

**版型建議：** 3 欄（手機 1 欄）卡片 grid，每張卡 = icon + 標題 + 一句描述。理由：與下方 §2.4 的評價區、§2.6 的經歷輪播在視覺節奏上形成「靜態 grid → 動態輪播 → 動態輪播」的層次，不會全頁都在動。可直接複用 `components/ui/cards/` 既有卡片樣式（`AbyssCard.tsx` / `PrismCard.tsx`）。

**資料來源 — 兩案，建議先走 A：**

| | A. `site_content` JSON 陣列 | B. 獨立 `services` 資料表 |
|---|---|---|
| 做法 | 單一 key `services_items`，值為 JSON 字串 | 新 migration + 新 route + 新 service + 新 admin tab |
| 後台編輯 | `_items` 後綴自動觸發 chip 編輯器（僅支援字串陣列） | 完整 CRUD、排序、啟用停用 |
| 工作量 | 0.5 人天 | 2 ～ 2.5 人天 |
| 限制 | 每項只有一行字，**放不下 icon + 描述** | 無 |

**建議：** 若客戶最終決定每項服務只要「一行標題」，走 A；若要 icon + 描述（較可能），則**服務項目是有結構的列表 → 應開獨立 table**（符合本專案既有的架構原則：小陣列留 JSON、有結構的列表才開表）。

若走 B，複製範本已經很明確：
- 後端：複製 `backend/routes/marquee.ts`（185 行，最乾淨的 `sort_order` + `is_active` CRUD 範本），於 `backend/routes/index.ts` 掛載。
- 前端 service：複製 `frontend/src/services/site/marquee.service.ts`（71 行，與路由 1:1 對應）。
- Migration：複製 `database/migrations/015_marquee_podcast.sql` 的 RLS 區塊（117–140 行）。
- 後台：`AdminContent.tsx` 新增第 7 個 tab。

另需 3 個標題文案 key：`services_tagline` / `services_title` / `services_subtitle`，並在 `homepageSections.ts` 新增一個 section entry。

**工作量：A 案 0.5 ～ 1 人天／B 案 2 ～ 2.5 人天**

---

### 2.4 真實學員留言／圖片 — 合併兩個元件

詳見 §3。結論：**保留 `TestimonialCarousel.tsx`，刪除 `CardStackTestimonial.tsx`（改造後移作 §2.6 使用）。**

**工作量：1 ～ 1.5 人天**

---

### 2.5 Moments — 沿用

`sections/DirectionAwareGallery.tsx` 不動。

但請一併決定 `GallerySlider.tsx` 的去留（見 §6.3）——它與 Moments 讀同一份 `getGallery()` 資料，目前首頁等於把同一批相片連續播兩次。

**工作量：0（若同時處理 GallerySlider 則 +0.5 人天）**

---

### 2.6 其他人設經歷 — 由既有元件改造

**新檔案：`frontend/src/components/sections/CareerCarousel.tsx`**（**改造自 `CardStackTestimonial.tsx`**，非從零寫）

要放入的三段經歷（出自履歷「工作經歷」段）：

| 排序 | 標題 | 單位 | 期間 | 重點 |
|---|---|---|---|---|
| 1 | 總教官（教練經理） | 威豪健身 Pro Fitness（台東） | 現職 | 統籌約 50 人教練團隊、8 年營運管理、KPI 與教練育成 |
| 2 | 私人教練 | 成吉思汗健身（連鎖品牌） | 轉職入行 | 體能評估、個人化課表、私教月入約 8 萬 |
| 3 | 房仲業務經紀人 | 房仲不動產業 | 早期 | 完整銷售流程、單月業績約 200 萬 |

**「一次可插入多筆」如何滿足：** `CardStackTestimonial.tsx` 現有的 `PER_PAGE = 3` 常數 + `groupIdx` 換組邏輯（108–128 行），本質就是「一次顯示 N 筆、整組換場、下方一組一個圓點」。把 `PER_PAGE` 改成可由設定調整（1 / 2 / 3），即可同時支援「一次一筆」與「一次多筆」，完全符合客戶描述。

**資料來源建議：獨立資料表 `career_experiences`。** 理由：每筆經歷有 `title / org / period / summary / bullets[] / is_current` 至少 6 個欄位，是明確「有結構的列表」，不適合塞進 `site_content` 的字串陣列。

- Migration：`database/migrations/029_career_experiences.sql`
- 後端：`backend/routes/careerExperiences.ts`（複製 `marquee.ts`）+ `routes/index.ts` 掛載
- 前端 service：`frontend/src/services/site/career.service.ts`（複製 `marquee.service.ts`）
- 後台：`AdminContent.tsx` 新增 tab
- 另需 `career_tagline` / `career_title` / `career_subtitle` 三個文案 key + `homepageSections.ts` 新 entry

**若要壓縮工期**，第一階段可先把三段經歷寫死在元件內的 `DEFAULT_EXPERIENCES` 常數（比照 `CertificationMarquee` 的 `DEFAULT_CERTS` 寫法），第二階段再接 DB。這樣可先出畫面給客戶看，工期減半。

**工作量：接 DB 完整版 2 ～ 2.5 人天／寫死常數版 0.5 ～ 1 人天**

---

## 3. Student Reviews + Real Reviews 合併分析

### 3.1 兩者現況差異

| | Student Reviews（`TestimonialCarousel.tsx`） | Real Reviews（`CardStackTestimonial.tsx`） |
|---|---|---|
| 資料來源 | `slidesService.getTestimonials()` | **完全相同** |
| 型別 | `TestimonialSlide`（id/image_url/name/achievement/quote/sort_order/is_active） | **完全相同** |
| 設定 | 讀 `getTestimonialsConfig()`：`interval_ms`、`is_published`、`card_layout` | **不讀設定** |
| 版型 | 3D coverflow，一次一張，左右露邊，圖為主 | 3 欄卡片 grid，一次三張整組換，**文字引言為主** |
| 動畫 | CSS transform + framer-motion 逐字淡入 | framer-motion `AnimatePresence` 左右滑入 |
| 標題 key | `testimonial_tagline/title/subtitle` | `review_tagline/title/subtitle` |
| Fallback | 無資料時回 `null`（不顯示） | **內建 6 筆假資料 `DEMO_CARDS`（pravatar 頭像）** |
| 行數 | 434 | 229 |

### 3.2 目前存在的兩個實質問題

1. **重複 API 請求**：同一份 testimonials 資料在首頁被抓兩次（`useSiteContent` 有快取，但 `slidesService` 沒有）。
2. **`is_published` 失效**：後台把學員見證設為「未發布」時，`TestimonialCarousel` 會正確隱藏，但 `CardStackTestimonial` 不讀設定、且有假資料墊底 → **首頁會繼續顯示 pravatar 的假學員評價**。這是目前線上就存在的 bug，合併後自然消失。

### 3.3 合併建議

**保留 `TestimonialCarousel.tsx` 作為唯一的「真實學員留言／圖片」區塊**，理由：它已經串好 `is_published` 開關、`interval_ms` 輪播秒數、`card_layout` 版型切換，且後台 testimonial tab 的設定 UI 已經存在。

**做法：把 CardStack 的三欄引言版型，變成第三種 `card_layout`。**

`testimonial_config.card_layout` 目前是 `'portrait' | 'landscape'`（型別定義在 `frontend/src/services/site/slides.service.ts` 第 27 行）。擴充為：

```
'portrait' | 'landscape' | 'quote-grid'
```

- `quote-grid` 的渲染邏輯直接搬 `CardStackTestimonial.tsx` 的 130–224 行。
- DB 只需一支 migration 放寬 `testimonial_config.card_layout` 的 CHECK 約束。
- 後台 `AdminContent.tsx` 的版型下拉多一個選項。
- 客戶可自行在「圖片為主（coverflow）」與「文字為主（引言牆）」之間切換，**不必二選一，決定權留給客戶。**

**取捨提醒（需向客戶說明）：**

- 客戶說的「真實學員留言**／圖片**」暗示兩者都要。若要同時呈現，建議 `quote-grid` 卡片上加入小頭像（CardStack 原本就有 `w-9 h-9` 圓形頭像），而不是保留兩個獨立區塊。
- 合併後首頁少一個滿版區塊，頁面明顯變短 —— 這對本站是好事（減少捲動疲勞），但視覺上要確認客戶接受。
- **`review_tagline` / `review_title` / `review_subtitle` 三個 key 合併後會孤立**。建議保留資料不刪（避免客戶已編輯的文案消失），但從 `homepageSections.ts` 的 `review` section 移除，改由 `testimonial_*` 統一。

### 3.4 具體改動清單

1. `frontend/src/services/site/slides.service.ts` — `TestimonialConfig.card_layout` 型別加 `'quote-grid'`
2. `frontend/src/components/sections/TestimonialCarousel.tsx` — 新增 `quote-grid` 分支（移植 CardStack 130–224 行）
3. `frontend/src/components/sections/CardStackTestimonial.tsx` — **改造為 `CareerCarousel.tsx`**（見 §2.6），不是單純刪除
4. `frontend/src/components/sections/index.ts` — 移除 `CardStackTestimonial`、`ReviewSection`、`PodcastSection` 三個 export
5. `frontend/src/pages/Home.tsx` — 移除 `CardStackTestimonial` 的 `LazySection`
6. `frontend/src/pages/admin/AdminContent.tsx` — 版型下拉加選項
7. `database/migrations/029_*.sql` — 放寬 `card_layout` CHECK
8. `frontend/src/utils/homepageSections.ts` — 調整 `review` section

**工作量：1 ～ 1.5 人天**

---

## 4. 「其他人設經歷」輪播 — 技術方案選型

### 4.1 專案現有可用資源（已查 `frontend/package.json`）

| 套件 | 版本 | 現況 | 可用性 |
|---|---|---|---|
| **framer-motion** | ^12.38.0 | **已大量使用**，7 個 section 元件都靠它 | ✅ **建議採用** |
| aos | ^2.3.4 | 已使用（`data-aos`），由 Lenis 驅動 | ⭕ 進場動畫可搭配，但不做輪播 |
| gsap | ^3.14.2 | 僅 `HeroSection` + `useMagnetic` 使用 | ⭕ 可用但殺雞用牛刀 |
| lenis | ^1.3.18 | 全站平滑捲動 | — |
| three | ^0.160.0 | **已動態 import**，未進主 bundle | ❌ 不相關 |
| embla / swiper / keen-slider | — | **未安裝** | ❌ **不要引入** |

「Aceternity」不是套件，而是**手抄的設計樣式**（各元件註解都標明「Aceternity XXX 風格」），實作全部是自己寫的 framer-motion + Tailwind，沒有額外相依。

### 4.2 建議：framer-motion `AnimatePresence`，並直接回收 CardStack 的程式碼

**理由：**

1. **零新增 bundle**。framer-motion 已在主 bundle 中，新增一個輪播不會多出任何 KB。引入 embla（~10 KB gzip）或 swiper（~40 KB gzip）在本站現況下完全不划算。
2. **程式碼已經寫好了**。`CardStackTestimonial.tsx` 的換組輪播（自動播放 + 方向感知滑入 + 圓點指示器 + `PER_PAGE` 一次多筆）與需求 100% 吻合，改造只需替換卡片內容與資料來源。
3. **視覺一致性**。全站的緩動曲線統一是 `[0.16, 1, 0.3, 1]`、金色主色 `gold`、圓點指示器 `w-6 bg-gold`。沿用同一套實作可免費維持一致。
4. **無障礙與 SSR 已驗證過**。既有元件已處理過 hydration 與 `aria-label`，照抄即可。

### 4.3 實作要點

- `PER_PAGE` 由寫死的 `3` 改為 props / DB 設定（建議桌機 2、手機 1，用既有的 `hooks/useMediaQuery.ts` 判斷）。
- 卡片內容改為：期間標籤（如「現職」）+ 職稱 + 單位 + 3～4 條 bullet + 亮點數字（50 人團隊 / 200 萬業績 / 8 萬月入）。亮點數字可沿用 `components/ui/cards/StatCard.tsx`。
- 自動輪播間隔沿用 4500ms；`onMouseEnter` 暫停（照抄 `TestimonialCarousel` 的 `paused` state，CardStack 原本**沒有**暫停功能，這是要補的）。
- 加上 `prefers-reduced-motion` 判斷，關閉自動輪播（目前全站都沒做，可在此建立範例）。

---

## 5. 重要決策點 — **需客戶決定**

### 5.1 🔴 需客戶決定：Credentials（專業認證跑馬燈）

新結構未列此區塊。

| 選項 | 評估 |
|---|---|
| ❌ 完全移除 | 不建議。此區塊承載 NSCA-CPT、TQUK、NLP、ACE、ISSA 等**證照關鍵字**，是首頁 SEO 的主要來源之一；且它是純 CSS `@keyframes` 動畫，**零 JS 成本**，移除省不到效能。 |
| ⭕ 併入「關於教練」 | 可行。但 §2.2 已要在關於教練加一段培訓講師內容，再塞 8 張證照 + 8 個數字會讓該區塊過重。 |
| ✅ **保留但下移**（建議） | 移到「其他人設經歷」**之後**作為收尾。邏輯順暢：先講服務 → 學員成果 → 精彩瞬間 → 完整經歷 → **證照背書收尾**。改動只是 `Home.tsx` 調整順序，成本近乎為零。 |

**建議：保留但下移至最末。**

### 5.2 🔴 需客戶決定：Podcast（深海電台）

新結構未列此區塊。這一項的商業判斷比 Credentials 明確：

- 履歷寫明 Podcast《陪你健身》發布期間為 **2021/02–2022/01，已結束**，且被歸類在「自媒體經營（非正式工作）」。
- 但首頁目前的 `PodcastExpandable` 用的是 `DEMO_EPISODES` 三筆示範資料（新手迷思、飲食控制、訓練動力），**與真實的 58 集內容無關**，除非後台已建過 `podcast_episodes` 資料。

| 選項 | 評估 |
|---|---|
| ⭕ 完全移除 | 首頁乾淨、少 290 行。但 `podcast_episodes` 表、`backend/routes/podcast.ts`、後台 podcast tab 全部變孤兒，需一併決定是否清理。 |
| ✅ **併入「其他人設經歷」**（建議） | 把「Podcast《陪你健身》主持人 · 約 58 集 · 2021–2022」做成經歷輪播中的**第四張卡**。既保留這段資歷的說服力（一整年系統化內容輸出），又不佔一個滿版區塊。同時履歷中的 IG「阿倫教官 @coach.luen」與 FB「阿倫好健」也可作為第五張卡。 |
| ⭕ 保留但下移 | 若客戶打算**重啟** Podcast，就該保留獨立區塊。這是純商業決策，技術上兩種都可行。 |

**建議：併入「其他人設經歷」作為一張卡，除非客戶計畫重啟節目。**
**必須問客戶的問題：Podcast 還會繼續更新嗎？**

### 5.3 🔴 需客戶決定：GallerySlider（相片輪播）—— 客戶清單中遺漏的區塊

客戶列的現況只有 7 項，但首頁實際有 8 個區塊。第 7 個 `GallerySlider.tsx`（412 行，是首頁最大的單一元件）**與 Moments 讀同一份 `getGallery()` 資料**，等於同一批相片在首頁連播兩次，只是一個是 3D coverflow、一個是 hover 方向感知 grid。

| 選項 | 評估 |
|---|---|
| ✅ **移除 GallerySlider，只留 Moments**（建議） | 少 412 行、少一次重複 API、頁面變短。Moments 的 grid 版型在手機上表現也優於 coverflow。 |
| ⭕ 反過來只留 GallerySlider | 若客戶偏好大圖輪播的視覺衝擊。但它用了 `useMotionValue`/`useSpring`/`useTransform` 三個 hook 做 3D tilt，運算成本明顯較高。 |
| ⭕ 兩者都留 | 不建議，內容重複。 |

**建議：移除 `GallerySlider.tsx`。但因客戶未提及此區塊，需明確確認。**

---

## 6. 建議的最終首頁順序

```
1. Hero                    HeroSection.tsx              沿用
2. 關於教練                CoachIntroSection.tsx        修改（+ 培訓講師段）
3. 主要服務項目和專長      ServicesSection.tsx          新建
4. 真實學員留言／圖片      TestimonialCarousel.tsx      合併（+ quote-grid 版型）
5. Moments                 DirectionAwareGallery.tsx    沿用
6. 其他人設經歷            CareerCarousel.tsx           改造自 CardStackTestimonial
7. Credentials             CertificationMarquee.tsx     保留但下移  ← 待客戶確認
   （Podcast 併入第 6 項 ／ GallerySlider 移除          ← 待客戶確認）
```

區塊數 8 → 7，程式碼淨減少約 700 行。

---

## 7. 改動風險

### 7.1 SSR 風險（`frontend/src/entry-server.tsx`）

- **本站是真 SSR**（`renderToString` + `StaticRouter` + `HelmetProvider`），但**所有區塊的資料都在 `useEffect` 裡抓**，因此 SSR 產出的 HTML 只有 fallback 文案，沒有 DB 內容。新元件必須遵守同樣模式，否則 SSR 會失敗。
- **⚠️ 最容易踩的雷：hydration mismatch。** `frontend/src/utils/contentTemplates.ts` 的註解已明確警告 `getRandomTemplate()` 不可用於 `useState` 初始值。新元件的 `useState` 初始值**必須是確定值**，禁用 `Math.random()`、`Date.now()`、`new Date()` 格式化。經歷卡片若要顯示「年資 8 年」這類推算值，必須寫死或由 DB 給，不可用當前日期計算。
- `DirectionAwareGallery` 目前 `if (loading) return null`，SSR 時整段消失 → 客戶端掛載後才冒出來，造成版面跳動（CLS）。新元件請改用「骨架佔位 + 固定高度」，不要回 `null`。
- `LazySection`（`frontend/src/components/ui/LazySection.tsx`）用 `IntersectionObserver`，SSR 時一律不渲染子元素。**新區塊放進 `LazySection` 時務必給對 `minHeight`**，否則首屏 CLS 會惡化。§2.3 的 ServicesSection 若放在第 3 位，離首屏很近，建議**不要**包 `LazySection`（比照現在的 CoachIntro / Marquee 處理方式）。

### 7.2 SEO 風險

- **`Home.tsx` 第 45–62 行的 `keywords` 陣列必須同步更新。** 若移除 Podcast 區塊，`keywords` 應補上服務項目與經歷相關詞；若移除 Credentials，證照關鍵字會從首頁完全消失。
- 目前每個區塊都用 `<h2>`，只有 Hero 是 `<h1>`。新增 ServicesSection 與 CareerCarousel 時**必須沿用 `<h2>`**，不要用 `<h3>` 或 `<div>`，以免破壞標題階層。
- 輪播內未顯示的卡片（`opacity: 0` / 非當前組）內容**仍在 DOM 中**，對 SEO 有利；但 `CardStackTestimonial` 的做法是只渲染當前組的 3 張 → 改造成 `CareerCarousel` 後，**未輪到的經歷不會出現在 HTML 裡**。若客戶重視「總教官／私人教練」這些職稱的 SEO 權重，建議改為全部渲染、以 CSS 控制可見性。

### 7.3 樣式風險

- **色彩 token 不一致**：`CertificationMarquee.tsx` 用的是 `luxe-gold` / `luxe-surface`，其餘所有元件用 `gold` / `surface`。若把它下移並與新區塊相鄰，色差可能被看出來，建議一併統一。
- 動畫節奏：全站緩動統一為 `cubic-bezier(0.16, 1, 0.3, 1)`，新元件請沿用。
- AOS 使用密度差異大（`CoachIntroSection` 有 11 處 `data-aos`，`CardStackTestimonial` 完全沒有、純 framer-motion）。新元件建議統一走 framer-motion `whileInView`，避免 AOS 與 framer-motion 同時操作 `opacity` 打架（`Home.tsx` 第 29–34 行的註解已記錄過這個踩雷經驗）。
- `Home.tsx` 各區塊靠 `bg-transparent` + `z-10` 疊在全域背景上，新區塊需沿用同樣的 wrapper 寫法。

### 7.4 Bundle 風險（最重要）

- 本次規劃**新增 0 個套件**，首頁淨減少約 700 行，對 bundle 是正向的。
- 但真正的 3,527 KiB 問題不在首頁：**`frontend/src/App.tsx` 靜態 import 了全部後台頁面**，包括 GrapesJS（`LandingPageEditor`）、TipTap 全套 20+ extension（`ArticleEditor`）、moveable / @scena。一般訪客載入首頁時，這些全都被下載。
- **強烈建議在本次改版一併處理（另案報告，約 1 人天）：**
  1. `App.tsx` 對 `pages/admin/*` 與 `LandingPage*` 改用 `React.lazy` + `Suspense`
  2. `vite.config.ts` 客戶端建置加 `rollupOptions.output.manualChunks`，切出 vendor / editor / admin 三塊
  3. 刪除 `ReviewSection.tsx`、`PodcastSection.tsx` 兩支死碼並清掉 barrel export
  - 預估首屏 bundle 可降到 1/3 以下，效益遠大於首頁區塊調整。

### 7.5 資料風險

- 若刪除 `CardStackTestimonial`，其 `review_*` 三個 `site_content` key 會孤立。**不要直接刪 DB 資料**，客戶可能已編輯過文案。
- 若移除 Podcast 區塊，`podcast_episodes` 表資料請保留，僅停用前端顯示，保留日後重啟的彈性。
- 後端 `backend/routes/*.ts` **沒有任何批次排序（bulk reorder）端點**，`sort_order` 只能逐筆 `PUT`。新的 `career_experiences` 若期待後台能拖曳排序，需**額外**開一支 reorder 端點（+0.5 人天），否則客戶只能一筆筆改數字。這點在需求裡沒提，但實務上客戶一定會問。

---

## 8. 工作量估計總表

| 項目 | 檔案 | 人天 |
|---|---|---|
| 2.2 關於教練 加入培訓講師段 | `CoachIntroSection.tsx`、`homepageSections.ts`、migration | 0.5 – 1 |
| 2.3 服務項目新區塊（A 案：JSON 陣列） | `ServicesSection.tsx`、`homepageSections.ts` | 0.5 – 1 |
| 2.3 服務項目新區塊（B 案：獨立表） | ＋ migration、route、service、admin tab | 2 – 2.5 |
| 2.4 學員評價合併 | `TestimonialCarousel.tsx`、`slides.service.ts`、`AdminContent.tsx`、migration | 1 – 1.5 |
| 2.6 經歷輪播（寫死常數版） | `CareerCarousel.tsx` | 0.5 – 1 |
| 2.6 經歷輪播（接 DB 完整版） | ＋ migration、route、service、admin tab | 2 – 2.5 |
| 區塊順序調整 + 死碼清理 | `Home.tsx`、`sections/index.ts` | 0.25 |
| SEO keywords / 標題階層調整 | `Home.tsx` | 0.25 |
| 整合測試（SSR / 手機 / 後台編輯 / hydration） | — | 1 |
| **小計（保守：兩個新區塊都接 DB）** | | **6.5 – 8 人天** |
| **小計（快速：服務項目走 JSON、經歷先寫死）** | | **3.5 – 5 人天** |
| （建議另案）bundle 瘦身：admin lazy load + manualChunks | `App.tsx`、`vite.config.ts` | +1 |

**建議策略：先走「快速版」（3.5–5 人天）產出可視畫面給客戶確認版型與文案，確認後第二階段再把服務項目與經歷接上 DB 後台（+3 人天）。** 這樣可避免在客戶還沒決定 §5 三個問題前就投入後端與 migration 成本。

---

## 9. 待客戶拍板事項（開工前必須回覆）

1. **Credentials 證照跑馬燈** —— 建議「保留但移到最後」。同意嗎？
2. **Podcast** —— 建議「併入其他人設經歷變成一張卡」。**還會繼續更新節目嗎？** 若會，就該保留獨立區塊。
3. **GallerySlider 相片輪播** —— 客戶清單漏掉的區塊，與 Moments 內容重複。建議移除，需確認。
4. **服務項目每一項要放多少內容？** 只有標題（省 2 人天）還是 icon + 標題 + 描述（需開後台管理）？
5. **「真實學員留言／圖片」以圖為主還是以文字引言為主？** 兩種版型都會做成可切換，但預設值需客戶指定。
6. **經歷輪播一次要顯示幾筆？** 建議桌機 2 筆、手機 1 筆。
7. **經歷內容之後會自己在後台增修嗎？** 若不會，可寫死省 2 人天。
