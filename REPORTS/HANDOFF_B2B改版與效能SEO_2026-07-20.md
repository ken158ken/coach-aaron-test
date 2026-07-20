# 交接文件：首頁 B2B 改版 + 效能/SEO 大修 + Landing Page 圖文模板

> 日期：2026-07-20　狀態：已部署至 production（`coach-aaron-test.vercel.app`）
> 本文件彙整本輪所有變更、已跑/待跑 migration、待客戶決定事項、已知限制。

---

## 0. 一句話總結

網站定位由 **B2C（一般健身會員）** 正式轉為 **純 B2B（服務對象＝健身教練同業）**；同時修復嚴重的效能與內頁 SEO 問題。**未換框架**（評估後確認 Astro/Next 不划算，見 `SEO稽核與框架選型評估.md`）。

---

## 1. 部署狀態

- 部署方式：`git push origin main` → Vercel GitHub 整合自動建置（CLI token 在本機 shell 讀不到，改用 git push）。
- 已上線 commit：
  - `a0490c6` 首頁 B2B 改版 + 效能/SEO 大修（65 檔）
  - `11ca73c` SSR 預抓逾時/快取修正
  - `2fed9bc` Career 圖文輪播 + Services 精簡三卡
  - `10d83a0` 納入 030 migration
- 驗證：TypeScript 僅剩既存 `Navbar.tsx:159` 的 `sex` 錯誤（與本輪無關）。

---

## 2. ⚠️ 要在 Supabase 手動執行的 migration

| 檔案 | 用途 | 狀態 |
|---|---|---|
| `027_lp_rich_templates.sql` | 4 個圖文 Landing Page 模板 | **待跑**（要用 LP 新模板才需要） |
| `028_lp_demo_editorial.sql` | Editorial LP 示範頁 | 待跑（選用） |
| `029_testimonial_quote_grid.sql` | 見證新增 quote-grid 版型 | **客戶已跑 ✅** |
| `030_b2b_site_content.sql` | 首頁 B2B 文案 UPSERT | **客戶已跑 ✅** |

> 文案是即時從 `site_content` 讀取，030 跑完重整即生效，**不需重新部署**。

---

## 3. 效能與 SEO 成果

| 指標 | 之前 | 現在 |
|---|---|---|
| Lighthouse 效能（行動） | 57 | **75** |
| Lighthouse 效能（桌面） | — | **91** |
| FCP / LCP | 8.1s / 8.1s | **4.2s / 4.4s** |
| 首屏 JS | 3,527 KiB | **1,138 KiB**（-68%） |
| main chunk | 3,453 KiB | **267 KiB**（-92%） |
| 內頁 title | 空白 | 真實標題 + 內文 + JSON-LD |
| sitemap / 404 | 無 / soft200 | 47 URL / 真 404 |

**根因（都不是框架問題）**：① 單一巨石 bundle 無 code splitting、後台套件（tiptap/dicebear/GrapesJS）汙染前台；② `#app-loader` 遮罩擋住已 SSR 內容至水合完成；③ 內頁 `if(loading) return` 寫在 `<SEOHead>` 前導致 SEOHead 永不掛載；④ Hero flip-words 用 `split(/\s+/)` 分詞，中文無空白使關鍵字被輪播詞吃掉。

---

## 4. 首頁結構（改版後）

`Hero → 關於教練 → 服務項目(精簡3卡) → 學員留言 → Moments → 人設經歷(圖文輪播) → Podcast → Credentials`

- **移除** GallerySlider（與 Moments 重複播同批照片）
- **合併** Student/Real Reviews 為單一區塊（新增 quote-grid 版型；順修「後台關閉見證仍顯示假評價」bug）
- **新增** ServicesSection：需求導向 3 卡，接真實 courses 資料算門數/起價
- **新增** CareerCarousel：一期一張、圖左文右、可輪播（房仲→成吉思汗→威豪，商業背書角度）
- 全站 B2C 殘留文案清除（見 `030` 與各 section 元件）

---

## 5. 🟡 待客戶決定 / 尚未處理

1. **證照 ACE/ISSA vs NSCA/TQUK/NLP**：目前兩套都上，待確認實際持有哪些（Credentials 跑馬燈 `marquee_items` 表）。
2. **待佐證數字**：房仲 200 萬、私教月入 8 萬 **未寫入**（CareerCarousel 內以註解保留，取得佐證後解除即可）；130+ 教練、50 人團隊、1000+ 小時、58 集**已採用**。
3. **SEO meta 仍寫「100 天月入 8 萬」**，但 Hero 主標已改為不含此數字 → 搜尋摘要與畫面不一致，待客戶定調口徑。
4. **Career 照片**：目前顯示帶編號的佔位面板；放真實照片＝把圖丟 `frontend/public/images/` 並在 `CAREER_EXPERIENCES` 填 `image:`。
5. **`moments_*` 文案**：030 內以註解保留（原「Hover 探索」在手機不成立），要改解除註解再跑。
6. **LCP 4.4s 仍高於 good(2.5s)**：剩餘瓶頸為永遠掛載的 supabase + 通知鈴鐺（~260 KiB），需改 Context/Navbar 架構；另 Google Fonts 載 7 字族可精簡。
7. **首頁下半區塊（見證/Moments/經歷/Podcast）包在 `LazySection`**，進視窗才渲染 → 爬蟲看不到。屬既有架構，拆除有 GSAP ScrollTrigger 定位風險，本輪未動。
8. **英文版 `/en` 路由未做**：評估認為對台灣教練客群商業價值低、半套 i18n 反傷 SEO，建議先不做（方案已備，見 SEO 報告）。

---

## 6. 相關文件索引（皆在 `REPORTS/`）

- `效能_根因與修復方案.md` — 效能根因與逐項修法
- `SEO稽核與框架選型評估.md` — 內頁 SEO 稽核 + 為何不換 Astro
- `INDEX_改版_結構評估.md` — 首頁元件盤點與改版方案
- `INDEX_服務項目_內容盤點.md` — courses 9 門真實課程盤點
- `INDEX_B2B文案_定稿草案.md` — 全站 B2B 文案定稿
- `LANDING_PAGE_RICH_TEMPLATES_PLAN.md` — LP 圖文模板計畫

人物素材與人設在 `整理結果(markdown)/`、履歷與人設 HTML 在 `人設揣摩/`。

---

## 7. 新增/刪除的關鍵檔案

**新增**：`frontend/src/components/sections/ServicesSection.tsx`、`CareerCarousel.tsx`；`frontend/src/ssr/{initialData,prefetch,routeData}.ts`；`api/sitemap.js`、`api/not-found.js`；`frontend/src/components/landing-templates/{Editorial,Showcase,Gallery,Cards}LP.tsx`
**刪除**：`CardStackTestimonial.tsx`、`ReviewSection.tsx`、`PodcastSection.tsx`（死碼/已合併）
**重要修改**：`App.tsx`（後台 27 路由 lazy）、`vite.config.ts`（manualChunks）、`components/ui/index.ts` + `hooks/index.ts`（拆 barrel）、`entry-server.tsx` + `api/ssr.js`（SSR 預抓）、`index.html` + `api/_ssr_template.html`（移除靜態 title）、各詳情頁（SEOHead 掛載順序）
