# Landing Page 圖文模板擴充 — 完整實作計畫

> 建立日期：2026-06-25
> 目標：把 LP 系統從「文字導向」升級為「圖文並茂、admin 可選模板套圖、可控制區塊渲染」。
> 前提：現有架構（012/013/023/024）不打掉重練，採增量擴充。

---

## 0. 範圍總覽

| Tier | 內容 | 是否本次做 |
|---|---|---|
| Tier 1 | 現有 4 模板補縮圖、demo 換成有圖模板 | ✅ |
| Tier 2 | 新增 4 個圖文模板 + 區塊可選渲染 + 多圖欄位 | ✅ 核心 |
| Tier 3 | 編輯器即時預覽、Cloudinary 統一 | ⏳ 規劃，最後做 |

---

## 1. 兩個新需求的設計決策（需你確認）

### 1-A. 「admin 自己選擇有哪些區塊要渲染」

**決策：用 `lp_projects.settings_json` 存一個 `hidden_sections` 陣列，不開新 table。**

- 理由：符合既有架構偏好（小陣列保留 JSON、避免表太多）。
- 結構範例：
  ```json
  { "hidden_sections": ["gallery", "faq"], "section_order": ["hero","features","gallery"] }
  ```
- 不需要新 migration（settings_json 已存在）。
- 前端 Viewer 渲染前先過濾掉 `hidden_sections` 內的 `content_group`。
- 編輯器左側每個區塊群組加一個「顯示/隱藏」眼睛 toggle。
- （可選）`section_order` 同時支援拖曳排序 —— 列為 Tier 2.5，先做顯示/隱藏。

### 1-B. 「圖片可以多新增幾個，沒用到也沒關係」

**決策：每個模板給「慷慨的固定圖片欄位數」（寧多勿少），暫不啟用 is_repeatable。**

- 理由：`is_repeatable` 要改 upsert/排序/UI 動態增列，成本高；而你明說「沒用到沒關係」，固定多欄位即可滿足，且符合 schema 註解「寧多勿少，沒用到的欄位不渲染」。
- 做法：例如相簿模板給 `gallery_1`~`gallery_12`，交錯模板給 `block_1`~`block_8`，前端遇到空值自動不渲染。
- is_repeatable 動態增減列 → 列入 Tier 3 future。

---

## 2. 四個新模板規格

所有新模板都：① 有圖片欄位、② 內建 dark_gold / dark_blue / light_classic 三個 variant、③ 支援區塊顯示/隱藏、④ migration 同時填 `thumbnail_url`。

### ① AARON_EDITORIAL — 左右交錯雜誌式（`EditorialLP`）
- 版型：Hero → 多個「圖文交錯區塊」(左圖右文/右圖左文自動交替) → CTA
- 區塊：hero / blocks(交錯) / cta
- 圖片欄位：hero_image + block_1_image ~ block_8_image（8 組，每組 image+title+desc+可選 cta）
- page_kind: `brand_narrative`，layout: `magazine`

### ② AARON_SHOWCASE — 全寬大圖視覺式（`ShowcaseLP`）
- 版型：全屏 Hero → 多段「全寬大圖 + 疊字」→ 數據帶 → CTA
- 區塊：hero / scenes(全寬大圖段) / stats / cta
- 圖片欄位：hero_image + scene_1_image ~ scene_6_image
- page_kind: `brand_narrative`，layout: `fullscreen-hero`

### ③ AARON_GALLERY — 相簿/作品集瀑布（`GalleryLP`）
- 版型：Hero → 篩選標籤(可選) → 圖片瀑布 grid → 見證 → CTA
- 區塊：hero / gallery / testimonials / cta
- 圖片欄位：gallery_1_image ~ gallery_12_image（每張 image+caption）
- 適合：成果照、學員 before/after
- page_kind: `portfolio`，layout: `magazine`

### ④ AARON_CARDS — 圖文卡片網格（`CardsLP`）
- 版型：Hero → 圖文卡片網格(每卡 圖+標題+說明+連結) → CTA
- 區塊：hero / cards / cta
- 圖片欄位：card_1_image ~ card_9_image
- 適合：多課程/多服務並列
- page_kind: `lead_gen`，layout: `standard`

---

## 3. 檔案清單

### 新增 — 資料庫
- `database/migrations/027_lp_rich_templates.sql`
  - 4 個模板的 lp_templates INSERT（含 thumbnail_url、jsx_component_key）
  - 各自的 variants / sections / fields（慷慨圖片欄位）

### 新增 — 前端模板元件
- `frontend/src/components/landing-templates/EditorialLP.tsx`
- `frontend/src/components/landing-templates/ShowcaseLP.tsx`
- `frontend/src/components/landing-templates/GalleryLP.tsx`
- `frontend/src/components/landing-templates/CardsLP.tsx`

### 修改 — 前端
- `LandingPageViewer.tsx`：TEMPLATE_MAP 註冊 4 個新元件；渲染前套用 `hidden_sections` 過濾
- `lpUtils.ts`：加 `isSectionHidden()` / `getHiddenSections()` 共用工具
- `LandingPageEditor.tsx`：左側區塊加「顯示/隱藏」eye toggle，寫入 settings_json
- `landing.service.ts`：型別補 `settings_json.hidden_sections`

### 修改 — 既有模板補縮圖（Tier 1）
- `database/migrations/028_lp_thumbnails.sql`：UPDATE 既有 4 模板 thumbnail_url（截圖需先上傳）
- demo 專案 `2026-spring-bootcamp` 改綁 FitnessDark/Story + 套圖（可手動在後台做，或寫進 seed）

---

## 4. 實作順序

1. **Step 1（Tier 1 暖身）** — 既有 4 模板補縮圖 + demo 換有圖模板。先讓選模板畫面能看圖、對外有個漂亮樣板。
2. **Step 2（Tier 2 核心）** — 寫 027 migration + 4 個 JSX 元件 + Viewer 註冊。先做出「能選、能套圖、能看」。
3. **Step 3（Tier 2 區塊控制）** — 編輯器加 hidden_sections toggle + Viewer 過濾。
4. **Step 4（Tier 3 之後）** — 編輯器 iframe 即時預覽；圖片統一 Cloudinary；is_repeatable 動態增列。

---

## 5. 工時估算（粗估）

| Step | 內容 | 估時 |
|---|---|---|
| 1 | 縮圖 + demo 換版 | 0.5 天（截圖需你提供或我用佔位） |
| 2 | 4 模板 migration + JSX | 1.5~2 天 |
| 3 | 區塊顯示/隱藏 | 0.5 天 |
| 4 | 即時預覽 + Cloudinary | 1~1.5 天（之後做） |

---

## 6. 風險 / 注意事項

- **縮圖來源**：模板縮圖最好是真實截圖。第一版可先用 Cloudinary 純色/示意佔位圖，上線前再換真截圖。
- **圖片儲存不一致**：目前 LP 上傳走 Supabase Storage `lp-images`，全站其他走 Cloudinary `daejq0zo9`。本次先沿用 Supabase（能動），Tier 3 再評估統一。
- **migration 編號**：接續到 027/028（025、026 已被 users/whispers 佔用）。
- **GenericLP 保留**：作為任何未掛 jsx_component_key 模板的安全 fallback，不刪。
- **SEO/SSR**：新模板沿用既有 document.title 設定模式；若需 OG/SSR 需另查 api/ssr.js（本計畫未涵蓋）。
