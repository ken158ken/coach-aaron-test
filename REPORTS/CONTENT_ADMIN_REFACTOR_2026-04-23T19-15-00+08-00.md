# 後台內容管理重構報告

- **時間**：2026-04-23T19:15:00+08:00
- **範圍**：後台「內容管理 / 網站文案」 + 首頁動態綁定 + Cloudinary 限定
- **相關文件**：`HANDOFF_內容管理重構.md`

## 1. 目標

1. 將後台「網站文案」從平坦清單改為**依首頁視覺區塊分組**（Hero、教練介紹、Podcast、學員見證、真實評價、Gallery、Moments、認證/成果 Marquee）。
2. 把過去硬編碼在元件中的文字、圖片、陣列（flip words、bullets、認證清單、Podcast 單集…）全部納入 `site_content` DB 管理。
3. 限制圖片型文案**只能使用 Cloudinary（`https://res.cloudinary.com/daejq0zo9/`）**URL，後台與後端雙重驗證。
4. 新增 `json` 與 `image` 兩種 `content_type`，後台編輯器依型別切換 UI。

## 2. 變更摘要

### 2.1 前端新檔 / 新模組

| 檔案                                                                                                         | 用途                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [frontend/src/hooks/useSiteContent.ts](<前端新設計參考%20(react)1/frontend/src/hooks/useSiteContent.ts>)     | 共用 hook；模組層 cache + in-flight promise，避免多個 section 同時打 API              |
| [frontend/src/utils/homepageSections.ts](<前端新設計參考%20(react)1/frontend/src/utils/homepageSections.ts>) | `HOMEPAGE_SECTIONS` 定義與 `KEY_TO_SECTION_ID` 反查表，新增 **`certifications`** 區塊 |

### 2.2 前端修改

| 檔案                                                                                                                         | 修改                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [services/content.service.ts](<前端新設計參考%20(react)1/frontend/src/services/content.service.ts>)                          | `SiteContent.content_type` 擴充 `"text" \| "html" \| "json" \| "image"`                                                                                                     |
| [sections/HeroSection.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/HeroSection.tsx>)                     | 讀取 `hero_flip_words` / `hero_cta_primary` / `hero_cta_secondary`                                                                                                          |
| [sections/CoachIntroSection.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/CoachIntroSection.tsx>)         | 讀取 `coach_intro_*` 7 個 key                                                                                                                                               |
| [sections/CertificationMarquee.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/CertificationMarquee.tsx>)   | 改讀 `marquee_certs` / `marquee_stats` JSON                                                                                                                                 |
| [sections/PodcastExpandable.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/PodcastExpandable.tsx>)         | 改讀 `podcast_episodes` JSON（缺 id 自動補）                                                                                                                                |
| [sections/TestimonialCarousel.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/TestimonialCarousel.tsx>)     | Header 改讀 `testimonial_*`                                                                                                                                                 |
| [sections/CardStackTestimonial.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/CardStackTestimonial.tsx>)   | Header 改讀 `review_*`                                                                                                                                                      |
| [sections/GallerySlider.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/GallerySlider.tsx>)                 | Header 改讀 `gallery_*`                                                                                                                                                     |
| [sections/DirectionAwareGallery.tsx](<前端新設計參考%20(react)1/frontend/src/components/sections/DirectionAwareGallery.tsx>) | Header 改讀 `moments_*`                                                                                                                                                     |
| [pages/admin/AdminContent.tsx](<前端新設計參考%20(react)1/frontend/src/pages/admin/AdminContent.tsx>)                        | **內容 tab 全面改寫**：分組呈現、`SectionItemRow` 子元件、Edit Modal 依 type 切換 image/json/text UI、Create Modal 新增 `json` / `image` 選項、前端 Cloudinary 與 JSON 驗證 |

### 2.3 後端修改

| 檔案                                                                                                       | 修改                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [backend/migrate_seed_content_keys.mjs](<前端新設計參考%20(react)1/backend/migrate_seed_content_keys.mjs>) | Seed 腳本追加 `marquee_certs` / `marquee_stats` / `podcast_episodes` 3 個 JSON key     |
| backend/routes/content.ts _(既有，未改)_                                                                   | 已有 `CLOUDINARY_PREFIX` + `isValidCloudinaryUrl` 在 PUT/POST 對 `image` type 強制驗證 |

### 2.4 DB 狀態

執行 `node migrate_seed_content_keys.mjs` 結果：

```
新增: 3
  ✓ marquee_certs     [70]  (json)
  ✓ marquee_stats     [71]  (json)
  ✓ podcast_episodes  [80]  (json)
略過: 19
  ✓ coach_intro_image_url content_type → 'image'
```

## 3. 架構決策（ADR）

### 3.1 為何不另建 `marquee_items` / `podcast_episodes` 獨立資料表？

- `site_content` 已支援 `json` 型別，運用現有基礎設施即可。
- 後台 JSON 編輯器與驗證（本次新增）可以**一套處理所有陣列型資料**（DRY、符合 OCP）。
- 減少新 route / service / admin tab 的重複代碼，降低維護成本。
- 若未來單集需要**獨立圖片上傳、多國語、審核流程**等功能，可平滑遷移到獨立表，不會白做。

### 3.2 Cloudinary 驗證三層防線

1. **後台 UI**：Edit Modal 圖片欄位前端 `isValidCloudinaryUrl` 檢查，阻擋儲存並顯示紅字提示。
2. **Create Modal**：`image` type 新增時同樣驗證。
3. **後端 route**：`PUT/POST /api/admin/site-content` 對 `content_type === 'image'` 強制 `startsWith(CLOUDINARY_PREFIX)`，回 400。

### 3.3 `useSiteContent` 模組層快取

多個 section 會同時呼叫 hook，若各自 fetch 會造成 N 次 API 呼叫。採用：

- 模組層 `cache` 保留公開內容 map
- 模組層 `inflight` 共享 Promise，並發呼叫只會產生 1 個 HTTP request
- 失敗時靜默 fallback（console.warn），絕不阻斷渲染

## 4. 使用說明（給客戶 / 管理者）

1. 登入後台 → 左選單「**內容管理**」→ 上方「**網站文案**」tab。
2. 頁面將依首頁由上到下呈現 **8 個區塊**（Hero、教練介紹、Podcast、學員見證、真實評價、Gallery、Moments、認證/成果 Marquee）。
3. 每個欄位右側：
   - **切換按鈕**：暫時停用該文案（前台會用預設值）
   - **編輯**：依欄位型別跳出對應編輯器
     - **圖片**：只能貼 Cloudinary URL，附即時預覽
     - **JSON**：提供格式驗證，儲存前會 `JSON.parse` 檢查
     - **純文字 / HTML**：一般文字框
4. **學員見證**、**真實評價**、**Gallery**、**Moments** 區塊底下有橘色提示：「👉 內容請到 XX tab 管理」，點擊可跳轉。

## 5. 已知限制 / 後續可優化

- Podcast 單集的 id 若管理者未手動填寫，前端會以陣列 index 補上 `ep-0` / `ep-1`；若未來有**每集獨立圖片、音檔**需求，建議獨立成 table。
- Marquee 的圖示目前用 emoji 字串；未來若要換成 Cloudinary 圖片，需調整 `CertItem.icon` 型別。
- AdminContent 檔案已達 ~1500 行，**SRP 建議**：下一輪可將 `SectionItemRow`、Edit/Create Modal 抽成獨立檔。
- 既有的 Tailwind v4 lint 建議（`flex-grow` → `grow`、`max-w-[1440px]` → `max-w-360` 等）不在本次範圍。

## 6. 驗收檢核項目

- [x] 後台「網站文案」依首頁區塊分組呈現
- [x] Hero、教練介紹、Podcast、認證 Marquee 皆從 DB 讀取
- [x] `image` 型別欄位強制 Cloudinary（前後端雙驗證 + 即時預覽）
- [x] `json` 型別欄位前端 `JSON.parse` 驗證
- [x] 新增文案時下拉可選 `text / html / json / image`
- [x] 共用資料的區塊（Review ← Testimonial、Moments ← Gallery）顯示跳轉提示
- [x] Seed migration 冪等執行成功，DB 已有 22 個 key
