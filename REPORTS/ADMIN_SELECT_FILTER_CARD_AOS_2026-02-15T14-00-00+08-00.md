# 後台 Select 主題化 + 分類篩選器 + 卡片徽章重設計 + AOS 滾動動畫

> 報告時間：2026-02-15T14:00:00+08:00

## 📋 任務摘要

| 項目 | 說明 |
|------|------|
| **Select 主題化** | 修復 ArticleEditor / CourseEditor / AdminArticles / AdminCourses 的原生 `<select>` 外觀 |
| **分類篩選器** | AdminArticles + AdminCourses 新增分類下拉篩選器 |
| **卡片徽章重設計** | 重新設計 card view 的狀態徽章（dot + text 藥丸風格） |
| **AOS 滾動動畫** | 首頁四大區塊加入 fade-up 滾動載入動畫 |

---

## 🎨 1. Select/Combobox 主題化

### 問題
- 原生 `<select>` 使用瀏覽器預設下拉箭頭（白色系統風格）
- `<option>` 下拉選單背景為白色，與 luxe 深色主題不協調

### 修復方案

| 屬性 | 修改 |
|------|------|
| `appearance-none` | 移除瀏覽器預設外觀 |
| 自訂 SVG 箭頭 | 金色 (`#C9A96E`) chevron，`backgroundImage` inline style |
| `cursor-pointer` | 滑鼠指標改為手形 |
| `hover:border-luxe-gold/60` | hover 邊框加深 |
| `focus:ring-2 focus:ring-luxe-gold/20` | focus 外框光暈 |
| `[&>option]:bg-luxe-surface` | option 深色背景 |
| `[&>option]:text-luxe-text` | option 文字顏色 |

### 影響檔案
- `frontend/src/pages/admin/ArticleEditor.tsx` — 分類 select
- `frontend/src/pages/admin/CourseEditor.tsx` — 分類 select + 難度等級 select
- `frontend/src/pages/admin/AdminArticles.tsx` — 狀態 / 分類 / 精選 篩選器
- `frontend/src/pages/admin/AdminCourses.tsx` — 狀態 / 分類 篩選器
- `frontend/src/components/ui/form/Select.tsx` — luxe 主題 option 樣式

---

## 🔍 2. 後台分類篩選器

### AdminArticles
- 新增 `categoryFilter` state (`"all" | category string`)
- 新增 `uniqueCategories` useMemo：從文章 `article_category` 提取不重複分類
- `filteredArticles` 改為三重篩選：featured + category + (server-side status)
- UI：在「全部狀態」和「全部文章」之間新增「全部分類」下拉選單

### AdminCourses
- 新增 `statusFilter` + `categoryFilter` state
- 新增 `uniqueCategories` useMemo：從課程 `category` 提取不重複分類
- `filteredCourses` 從簡單 filter 升級為 `useMemo` 多重篩選鏈（搜尋 + 狀態 + 分類）
- 新增 `useMemo` import
- UI：搜尋框後新增「全部狀態」+「全部分類」兩個下拉篩選器

---

## 🏷️ 3. Card 檢視狀態徽章重設計

### 之前（問題）
- AdminArticles：`getStatusBadge()` 回傳的 `<span>` 沒有 `absolute` 定位，直接流入 DOM
- 綠色 `bg-green-500/20 text-green-400` 方形色塊外觀粗糙

### 之後（新設計）

```
┌─────────────────┐
│ ● 已發布         │  ← dot + text 藥丸徽章
└─────────────────┘
```

| 狀態 | dot 顏色 | 文字顏色 | 背景 |
|------|----------|----------|------|
| 草稿 | `bg-gray-400` | `text-gray-300/400` | `bg-black/60 backdrop-blur-sm` |
| 已發布 | `bg-emerald-400` | `text-emerald-300/400` | `bg-black/60 backdrop-blur-sm` |
| 已封存 | `bg-amber-400` | `text-amber-300/400` | `bg-black/60 backdrop-blur-sm` |

**表格版**：`rounded-full` + `bg-xxx-500/10` 半透明背景
**卡片浮標版**：`absolute top-1.5 left-1.5` + `backdrop-blur-sm` + dot `animate-pulse`

### 附加調整
- 精選浮標：`rounded-full` + `shadow-sm` 升級
- 價格浮標：`rounded-full` + `shadow-sm` + 調整間距

---

## 🎞️ 4. AOS 首頁滾動動畫

### 安裝
```bash
npm install aos @types/aos
```

### 配置（Home.tsx）
```typescript
AOS.init({
  duration: 800,        // 動畫持續時間 (ms)
  easing: "ease-out-cubic", // 緩出曲線
  once: true,           // 只觸發一次
  offset: 80,           // 觸發偏移量 (px)
  delay: 0,             // 預設延遲
  anchorPlacement: "top-bottom",
});
```

### 各區塊動畫設定

| 區塊 | 動畫 | duration | delay |
|------|------|----------|-------|
| HeroSection | fade-up | 1000ms | 0ms |
| CoachIntroSection | fade-up | 900ms | 100ms |
| PodcastSection | fade-up | 900ms | 100ms |
| ReviewSection | fade-up | 900ms | 100ms |

### 清理
- `useEffect` return 中呼叫 `AOS.refreshHard()` 清理監聽器

---

## ✅ 驗證結果

| 檢查 | 結果 |
|------|------|
| TypeScript 編譯 (`tsc --noEmit`) | ✅ 無錯誤 |
| Vite Build (`vite build`) | ✅ 成功 |
| ESLint | ✅ 無新增錯誤 |

---

## 📂 變更檔案清單

| 檔案 | 變更類型 |
|------|----------|
| `frontend/src/components/ui/form/Select.tsx` | 修改 - luxe 主題 option 樣式 |
| `frontend/src/pages/admin/ArticleEditor.tsx` | 修改 - 分類 select 主題化 |
| `frontend/src/pages/admin/CourseEditor.tsx` | 修改 - 分類/難度 select 主題化 |
| `frontend/src/pages/admin/AdminArticles.tsx` | 修改 - 分類篩選器 + 卡片徽章 + select 樣式 |
| `frontend/src/pages/admin/AdminCourses.tsx` | 修改 - 狀態/分類篩選器 + 卡片徽章 + select 樣式 |
| `frontend/src/pages/Home.tsx` | 修改 - AOS 初始化 + 區塊動畫 |
| `frontend/package.json` | 修改 - 新增 aos + @types/aos |
| `README.md` | 修改 - 更新日誌 + 技術棧 |
| `REPORTS/ADMIN_SELECT_FILTER_CARD_AOS_2026-02-15T14-00-00+08-00.md` | 新增 |
