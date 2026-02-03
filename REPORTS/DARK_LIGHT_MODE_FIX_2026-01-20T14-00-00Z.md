# 日夜模式 CSS 修復報告

**報告時間**: 2026-01-20T14:00:00+08:00  
**問題類型**: 樣式/主題系統  
**嚴重程度**: 高 (淺色模式下文字完全不可見)

## 📋 問題描述

用戶反映在切換到淺色模式時，以下頁面的文字完全看不到：

1. 首頁 (Home) - 白色文字在白色背景上
2. 課程頁面 (Courses) - 文字顏色太淺
3. 會員中心 (Member Center) - 文字不可讀
4. 後台管理 (Admin) - 側邊欄和內容區文字太淡

## 🔍 根本原因分析

### 1. CSS 變數未正確響應淺色模式

- Tailwind 配置中的顏色使用 `var(--xxx)` CSS 變數
- 但這些變數的淺色模式值沒有被正確定義和應用
- `[data-color-mode="light"]` 選擇器的覆蓋規則不完整

### 2. DaisyUI 主題定義問題

- 缺少 `base-content` 屬性導致預設文字顏色不正確
- 淺色主題的 CSS 變數定義不完整

### 3. 硬編碼顏色值

- 部分組件使用 `text-black`, `text-white`, `text-gray-xxx` 等硬編碼顏色
- 這些顏色不響應主題變化

### 4. 導航欄背景色硬編碼

- Navbar 使用 `rgba(10,10,10,0.9)` 固定深色背景
- 淺色模式下與整體風格不協調

## ✅ 修復內容

### 1. 更新 `tailwind.config.ts`

**修改前:**

```typescript
abyss: {
  black: "#000205",
  cyan: "#00ffff",
  // ... 靜態顏色值
}
```

**修改後:**

```typescript
abyss: {
  black: "var(--abyss-black, #000205)",
  cyan: "var(--abyss-cyan, #00ffff)",
  bg: "var(--abyss-bg, #000205)",
  surface: "var(--abyss-surface, #050a14)",
  text: "var(--abyss-text, #e0f7fa)",
  muted: "var(--abyss-muted, #80deea)",
  accent: "var(--abyss-cyan, #00ffff)",
  // ... 所有顏色使用 CSS 變數
}
```

同樣更新了 `prism` 和 `luxe` 主題。

### 2. 更新 `index.css` CSS 變數系統

**新增深色模式預設值:**

```css
:root {
  --luxe-bg: #0a0a0a;
  --luxe-surface: #141414;
  --luxe-text: #e0e0e0;
  --luxe-muted: #888888;
  /* ... 所有主題變數 */
}
```

**新增淺色模式覆蓋:**

```css
[data-color-mode="light"],
[data-theme="luxe-light"],
[data-theme="abyss-light"],
[data-theme="prism-light"],
html[data-color-mode="light"] {
  --luxe-bg: #ffffff;
  --luxe-surface: #f8f8f8;
  --luxe-text: #1a1a1a;
  --luxe-muted: #555555;
  /* ... 所有主題的淺色值 */
}
```

### 3. 新增全域淺色模式文字覆蓋

```css
/* 白色和灰色文字在淺色模式下變深 */
[data-color-mode="light"] .text-white {
  color: #1a1a1a !important;
}

[data-color-mode="light"] .text-gray-100,
[data-color-mode="light"] .text-gray-200,
[data-color-mode="light"] .text-gray-300,
[data-color-mode="light"] .text-gray-400,
[data-color-mode="light"] .text-gray-500 {
  color: #555555 !important;
}

/* 表單元素 */
[data-color-mode="light"] input,
[data-color-mode="light"] textarea,
[data-color-mode="light"] select {
  color: #1a1a1a;
  background-color: #ffffff;
}
```

### 4. 修復 Navbar 背景色

**修改前:**

```tsx
style={{
  background: "linear-gradient(180deg, rgba(10,10,10,0.9), transparent)",
}}
```

**修改後:**

```tsx
className={`... ${
  isDark
    ? "bg-gradient-to-b from-[rgba(10,10,10,0.9)] to-transparent"
    : "bg-gradient-to-b from-[rgba(255,255,255,0.95)] to-transparent shadow-sm"
}`}
```

### 5. 修復 AdminArticles select 元素

**修改前:**

```tsx
className = "... text-black ... [&>option]:text-black";
```

**修改後:**

```tsx
className = "... text-luxe-text ... [&>option]:text-luxe-text";
```

## 📁 修改的檔案

| 檔案路徑                                     | 修改類型                  |
| -------------------------------------------- | ------------------------- |
| `frontend/tailwind.config.ts`                | 所有顏色改用 CSS 變數     |
| `frontend/src/index.css`                     | 新增淺色模式 CSS 變數覆蓋 |
| `frontend/src/components/layout/Navbar.tsx`  | 動態背景色                |
| `frontend/src/pages/admin/AdminArticles.tsx` | select 文字顏色           |

## 🧪 測試建議

1. **首頁測試**
   - 切換至淺色模式，確認所有文字可讀
   - 確認 Hero section 文字對比度正常

2. **課程頁面測試**
   - 確認課程卡片文字清晰
   - 確認篩選按鈕和標籤可讀

3. **後台管理測試**
   - 確認側邊欄選單項目可讀
   - 確認表格內容和表頭文字對比度正常
   - 確認表單元素（input, select, textarea）可讀

4. **跨瀏覽器測試**
   - Chrome, Firefox, Safari, Edge

## 📊 技術債務

以下項目建議後續處理：

1. **ArticleEditor 和 CourseEditor**
   - 多處使用 `text-gray-xxx` 和 `hover:text-white`
   - 建議統一改用主題變數

2. **BlockEditor 組件**
   - 大量使用硬編碼灰色
   - 需要全面檢視並替換

3. **建議新增主題工具類**
   - 考慮新增 `text-theme-primary`, `text-theme-secondary` 等語義化類別
   - 減少直接使用顏色值

## ✅ 結論

此次修復建立了完整的 CSS 變數系統，確保淺色模式下所有主要頁面的文字可讀性。修改遵循以下原則：

1. **CSS 變數優先** - 所有顏色通過 CSS 變數定義，支援動態切換
2. **向後兼容** - 使用 fallback 值確保舊代碼不會崩潰
3. **漸進式增強** - 通過 `[data-color-mode="light"]` 選擇器覆蓋，不影響深色模式
