# Aceternity UI 遷移評估報告

> 說明：本專案目前用 **Tailwind CSS v4 + DaisyUI v5 主題**，但幾乎沒有直接使用 DaisyUI 的 class（如 `btn`, `card`, `badge`）——而是全部包裝成自訂 React 元件。下面以「自訂元件 → Aceternity UI 免費版對應」為主軸整理。

---

## 一、頁面分區元件（Sections / Landing Page）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `HeroSection` | 首頁英雄區（大標題、CTA、背景） | **Spotlight** / **Aurora Background** / **Background Beams with Collision** | Spotlight 最接近高端感光暈效果 |
| `CoachIntroSection` | 教練介紹（文字 + 圖片並排） | **Bento Grid** / **Feature Sections** | 可用 Bento 格線呈現多個資訊塊 |
| `TestimonialCarousel` | 學員見證 3D Coverflow 輪播 | **Animated Testimonials** / **Infinite Moving Cards** | Animated Testimonials 最接近，Infinite Moving Cards 可無限水平滾動 |
| `GallerySlider` | 相片輪播（手動翻頁） | **Parallax Scroll** / **Focus Cards** | Parallax Scroll 做視差滾動效果，Focus Cards 做 hover 聚焦 |
| `PodcastSection` | Podcast 嵌入區塊 | 無對應（純佈局，保留自訂即可） | — |

---

## 二、導覽列 / 導航

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `Navbar` | 頂部導覽列（毛玻璃、漢堡選單） | **Floating Navbar** | 浮動式，自帶捲動淡入/淡出，支援行動裝置 |
| `BubbleNav` | 底部泡泡導航（行動裝置） | 無直接對應，保留自訂 | Aceternity 無此類型 |
| `FilterPill` | 篩選標籤（課程/影片頁） | **Tabs** / 自訂 | Aceternity 無直接對應，可用自訂 styled tabs |
| `Pagination` | 分頁元件 | 無對應，保留自訂 | — |

---

## 三、卡片元件（Cards）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `CourseCard` | 課程卡（圖 + 標題 + 價格） | **Card Hover Effect** / **3D Card Effect** | 3D Card 懸停翻轉視覺效果強烈，符合高端主題 |
| `VideoCard` | 影片卡（縮圖 + 標題） | **Card Hover Effect** | 簡單 hover 發光 |
| `LuxeProjectCard` | 高端風格專案卡 | **3D Card Effect** / **Background Gradient Animation** | 3D Card + 漸層背景組合 |
| `AbyssCard` / `PrismCard` | 主題式裝飾卡 | **Meteor Effect** / **Sparkles** | 可在卡片上疊加流星或閃光特效 |
| `StatCard` | 儀表板統計數字卡 | **Counter** / **Number Ticker** | Number Ticker 可做數字滾動動畫 |

---

## 四、按鈕元件（Buttons）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `PillButton` | 主要/次要按鈕（膠囊型） | **Moving Border** | 動態邊框流光，適合 CTA |
| `GlowButton` | 發光特效按鈕 | **Shimmer Button** | 光暈掃過效果，視覺一致 |
| `TextButton` | 無框文字按鈕 | 保留自訂（Aceternity 無對應） | — |

---

## 五、表單元件（Forms）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `Input` | 文字輸入框（Label + 毛玻璃風格） | 無直接對應，保留自訂 | Aceternity UI 表單元件偏少 |
| `Textarea` | 多行文字輸入 | 無直接對應，保留自訂 | — |
| `Select` | 下拉選單 | 無直接對應，保留自訂 | — |
| `SearchInput` | 搜尋輸入框 | **PlaceholdersAndVanishInput** | 佔位文字消散動畫，適合搜尋框 |
| `Toggle` | 開關切換（關/開雙標籤） | 無直接對應，保留自訂 | 現有設計已優 |
| `TagInput` | 標籤輸入（新增/刪除 tag） | 無直接對應，保留自訂 | — |

---

## 六、Overlay（遮罩/彈窗/抽屜）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `Modal` | 通用彈窗（多尺寸支援） | **Modal** | Aceternity 有 Modal 元件，但自訂版已完整，換過去收益不大 |
| `Drawer` | 側滑抽屜 | 無對應，保留自訂 | — |
| `ConfirmDialog` | 確認對話框 | 無對應，保留自訂 | — |
| `Dialog` (useDialog hook) | 程式化呼叫 dialog | 無對應，保留自訂 | — |

---

## 七、資料展示（Data Display）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `DataTable` | 後台表格（排序/分頁） | 無對應，保留自訂 | — |
| `StatusBadge` | 狀態標籤（顏色 badge） | 無對應，保留自訂 | — |
| `PageHeader` | 頁面頂部標題區 | **Text Generate Effect** | 標題文字逐字顯現動畫 |

---

## 八、視覺特效元件

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `ScrollReveal` | 捲動進場動畫（目前用 AOS） | **Reveal** / **Fade-in Sections** / **Sticky Scroll Reveal** | Sticky Scroll Reveal 適合故事型內文 |
| `CustomCursor` | 自訂游標特效 | 無對應，保留自訂 | — |
| `LazySection` | 懶加載區塊 | 無對應（純邏輯，保留自訂） | — |

---

## 九、反饋元件（Feedback）

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `Toast` | 通知提示（成功/錯誤） | 無對應，保留自訂 | — |
| `Loading` | 載入 spinner | 無對應，保留自訂 | — |
| `EmptyState` | 空資料提示 | 無對應，保留自訂 | — |

---

## 十、其他

| 目前元件 | 用途 | Aceternity UI 免費對應 | 備註 |
|---|---|---|---|
| `Tooltip` | 懸停提示 | 無對應，保留自訂 | — |
| `GlobalSearch` | 全站搜尋 | **CommandMenu** (Aceternity) / 保留自訂 | — |
| `AvatarPicker` / `AvatarCropper` | 頭像選擇/裁切 | 無對應，保留自訂 | — |
| `RichTextEditor` | 富文本編輯器 | 無對應（Tiptap 已是最佳選擇） | — |

---

## 十一、頁面 × 建議替換元件（優先度排序）

| 路由 | 頁面 | 建議替換 Aceternity 元件 | 視覺影響度 |
|---|---|---|---|
| `/` | Home | Spotlight/Aurora Background（Hero）、Animated Testimonials、Parallax Scroll | ⭐⭐⭐⭐⭐ 最高 |
| `/courses` | 課程列表 | 3D Card Effect（CourseCard）、Moving Border（CTA 按鈕） | ⭐⭐⭐⭐ |
| `/courses/:id` | 課程詳情 | Shimmer Button（購買按鈕）、Text Generate Effect（標題） | ⭐⭐⭐ |
| `/articles` | 文章列表 | Card Hover Effect（ArticleCard） | ⭐⭐⭐ |
| `/articles/:slug` | 文章詳情 | Text Generate Effect（標題）、Sticky Scroll Reveal | ⭐⭐⭐ |
| `/videos` | 影片列表 | Focus Cards（VideoCard）、PlaceholdersAndVanishInput（搜尋）| ⭐⭐⭐ |
| `/member` | 會員中心 | Number Ticker（統計數字） | ⭐⭐ |
| `/dashboard` | 儀表板 | Number Ticker（StatCard）、Bento Grid | ⭐⭐ |
| `/contact` | 聯絡我們 | Spotlight（頁面背景）、Moving Border（送出按鈕） | ⭐⭐ |
| `/admin/*` | 所有後台 | 維持自訂（後台不需要 landing page 特效） | ⭐ 低 |

---

## 十二、遷移建議

### 高 CP 值優先替換（改動小、效果大）
1. **Floating Navbar** → 替換現有 Navbar（捲動行為更優雅）
2. **Shimmer Button** → 替換 GlowButton（視覺一致且有現成程式碼）
3. **3D Card Effect** → 替換 CourseCard（課程頁面最顯眼的元件）
4. **Animated Testimonials** → 替換 TestimonialCarousel（已有 3D 效果，Aceternity 版更輕量）
5. **Number Ticker** → 替換 StatCard 數字（純動畫，一行搞定）

### 建議保留自訂的（遷移成本 > 收益）
- 所有後台元件（DataTable、Modal、Form、Toggle 等）
- Toast / Loading / EmptyState（行為邏輯已深度整合）
- BubbleNav / FilterPill（無對應且現有實作穩定）
- AvatarPicker / RichTextEditor（功能性元件，Aceternity 沒有）

### 注意事項
- Aceternity UI 需要 **Framer Motion** — 確認版本相容（`framer-motion` v10+）
- 部分元件需要 **`clsx`** 和 **`tailwind-merge`** — 專案已有這些依賴
- Aceternity 元件預設以 `oklch` 顏色為主，需對應現有 `luxe-gold`、`luxe-surface` 等 CSS 變數
- 建議先在 **dev branch** 逐一替換，避免全站同時改動
