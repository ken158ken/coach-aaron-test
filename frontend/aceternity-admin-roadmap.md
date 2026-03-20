# Aceternity UI + DaisyUI 改版規劃路線圖

## 已完成項目

### 公開前台
| 元件 | 效果 | Commit |
|------|------|--------|
| `btn-metal` (GlowButton) | Shimmer 持續光掃動畫 | feat(aceternity): shimmer |
| `StatCard` | Number Ticker 數字滾動 | feat(aceternity): shimmer... |
| `CourseCard` | 3D Card Tilt + Glare | feat(aceternity): shimmer... |
| `TestimonialCarousel` | Animated word-by-word quote | feat(aceternity): animated... |
| `Navbar` | Floating pill on scroll | feat(aceternity): animated... |
| `HeroSection` | Spotlight 滑鼠跟隨金色聚光燈 | feat(aceternity): spotlight... |
| `GallerySlider` | Focus Cards — hover 側卡 blur/dim | feat(aceternity): spotlight... |
| `VideoCard` | 3D Card Tilt + Glare | feat(aceternity): spotlight... |
| `CoachIntroSection` | Orbiting ambient gradient glow | feat(aceternity): spotlight... |
| `Sparkles` | 新元件 — 金色粒子裝飾 | feat(aceternity): spotlight... |

### 管理後台
| 元件 | 效果 | Commit |
|------|------|--------|
| `AdminSidebar` | layoutId Animated Active Nav Pill | feat(admin/aceternity)... |
| `AdminLayout` | AnimatePresence Page Transition | feat(admin/aceternity)... |
| `AdminLayout` | Scroll-aware Top Bar glow border | feat(admin/aceternity)... |
| `AdminDashboard` | Dot grid background + StatCard stagger | feat(admin/aceternity)... |
| `Dialog/Modal` | Spring scale-in/out (AnimatePresence) | feat(admin/aceternity)... |

---

## 待實作項目

### 🥇 高 CP — 公開前台

#### 1. `HeroSection` → Flip Words（Aceternity）
- **位置**: Hero 標題第二行
- **效果**: 「體態 / 自信 / 健康 / 未來」循環換字，framer-motion `AnimatePresence` 上下切換
- **檔案**: `src/components/sections/HeroSection.tsx`
- **影響**: 首頁第一印象，視覺衝擊最高

#### 2. 首頁認證/品牌區 → Infinite Moving Cards（Aceternity）
- **位置**: CoachIntroSection 下方，新增一個 Marquee 區塊
- **效果**: 認證標章（ACE、ISSA、TQUK...）或學員成果數字無限橫向滾動
- **檔案**: 新建 `src/components/sections/CertificationMarquee.tsx`
- **影響**: 社會認證感、填補空白區域

#### 3. `ArticleDetail` → Tracing Beam（Aceternity）
- **位置**: 文章內容左側
- **效果**: 隨閱讀捲動位置，左側出現一條從上往下的金色發光細線，追蹤閱讀進度
- **檔案**: `src/pages/ArticleDetail.tsx`
- **影響**: 長文閱讀體驗大幅提升

#### 4. `Contact` → Moving Border（Aceternity）
- **位置**: 聯絡表單容器外框
- **效果**: 表單卡片邊框有流動金色光點繞邊
- **檔案**: `src/pages/Contact.tsx`
- **影響**: 聯絡頁視覺質感提升

---

### 🥈 中 CP — 公開前台

#### 5. Before/After 學員成果區 → Diff（DaisyUI）
- **位置**: 首頁 / About 頁，新增學員 Before/After 對比區塊
- **效果**: 左右拖曳滑桿對比前後體態照片
- **重要性**: 健身網站最有說服力的功能，DaisyUI `diff` 元件原生支援
- **檔案**: 新建 `src/components/sections/BeforeAfterSection.tsx`

#### 6. `Courses` 課程卡 → Direction Aware Hover（Aceternity）
- **位置**: 課程列表卡片
- **效果**: hover 時從你的游標進入方向出現漸層光（左進 → 左側發光，上進 → 上方發光）
- **檔案**: `src/pages/Courses.tsx` 或 `src/components/ui/cards/CourseCard.tsx`
- **注意**: 目前 CourseCard 已有 3D tilt，需評估是否替換或疊加

#### 7. `HeroSection` → Hero Highlight（Aceternity）
- **位置**: 「理想體態」文字
- **效果**: 特定關鍵字底下有流動金色底光（類似螢光筆劃過）
- **檔案**: `src/components/sections/HeroSection.tsx`

#### 8. `CourseDetail` / `ArticleDetail` → Rating（DaisyUI）
- **位置**: 課程詳情頁評分顯示、文章底部評分
- **效果**: DaisyUI `rating` 元件，星星顯示更好看，支援 half star
- **檔案**: `src/pages/CourseDetail.tsx`, `src/pages/ArticleDetail.tsx`

---

### 🥉 補充細節

#### 9. Theme Toggle → Swap（DaisyUI）
- **位置**: Navbar 主題切換按鈕、Admin top bar 主題切換
- **效果**: DaisyUI `swap` 元件，點擊時太陽/月亮圖示有 flip/rotate 動畫
- **檔案**: `src/components/layout/Navbar.tsx`, `src/components/admin/AdminLayout.tsx`

#### 10. `MemberCenter` / `CourseDetail` → Progress（DaisyUI）
- **效果**: 課程完成度進度條（已完成 N/M 堂）
- **檔案**: `src/pages/MemberCenter.tsx`

#### 11. `Contact` / `Home` → Text Generate Effect（Aceternity）
- **效果**: section 標題文字逐字元出現
- **注意**: 效果較搶眼，建議只用在 1-2 個關鍵位置

---

## Aceternity vs DaisyUI 共存策略

| 用途 | 優先選擇 |
|------|---------|
| 視覺動畫效果（card tilt、spotlight、marquee...） | **Aceternity** |
| 功能性表單（input、toggle、select、checkbox） | **DaisyUI** |
| 評分 / 進度 / 步驟 / 倒計時 / 對比 | **DaisyUI**（Aceternity 無此類） |
| 按鈕 | Aceternity（shimmer）+ DaisyUI variant 混用 |
| Modal / Dialog | **Aceternity spring**（已套） |
| Navbar | **Aceternity floating**（已套） |
| 管理後台表格 / 分頁 | **DaisyUI** |
| 裝飾性背景 / 粒子 | **Aceternity** |

---

## 實作順序建議

```
Phase 1（已完成）
└── 10 個公開前台 Aceternity 效果
└── 5 個管理後台 Aceternity 效果

Phase 2（待實作，高 CP）
├── 1. Flip Words — HeroSection
├── 2. Tracing Beam — ArticleDetail
├── 3. Moving Border — Contact form
└── 4. Infinite Moving Cards — 認證 Marquee

Phase 3（中 CP）
├── 5. Diff Before/After — 學員成果
├── 6. Direction Aware Hover — Courses
├── 7. Rating — CourseDetail / ArticleDetail
└── 8. Hero Highlight — HeroSection

Phase 4（細節）
├── 9. Swap theme toggle
├── 10. Progress — MemberCenter
└── 11. Text Generate Effect — section headers
```
