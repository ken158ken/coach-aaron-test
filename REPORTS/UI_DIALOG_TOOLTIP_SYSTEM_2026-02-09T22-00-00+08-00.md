# 全域 UI 美化：Dialog 替換 + Tooltip 即時提示系統

> **報告時間**: 2026-02-09T22:00:00+08:00
> **類型**: UI/UX 改善
> **狀態**: ✅ 完成

---

## 📋 任務概述

將專案中所有原生瀏覽器 `confirm()` / `alert()` 替換為美化版 `useDialog()` 對話框，並建立全域 Tooltip 元件取代原生 `title` 屬性，提供即時（零延遲）的 hover 提示。

## 🎯 解決的問題

1. **原生 `confirm()` / `alert()` 外觀不一致**：瀏覽器原生對話框無法自訂樣式，與網站暗色主題格格不入
2. **原生 `title` 屬性延遲**：瀏覽器預設 `title` tooltip 有 1-2 秒延遲，且樣式無法自訂
3. **Tiptap 工具列缺乏即時說明**：使用者需等待 1-2 秒才能看到按鈕說明

---

## 🏗️ 架構設計

### 1. Tooltip 元件 (`components/ui/Tooltip.tsx`)

```
使用方式：
<Tooltip label="說明文字" position="top">
  <button>按鈕</button>
</Tooltip>
```

**技術特性**：

- **CSS-only 實現**：無 JavaScript 計算，零效能影響
- **四方向支持**：`top`（預設）、`bottom`、`left`、`right`
- **12px 字體**：精緻不干擾
- **零延遲**：hover 即顯示（0.1s opacity 過渡）
- **箭頭指示**：CSS border 三角形
- **z-index 9999**：確保不被任何元素遮擋

### 2. Dialog 系統（既有）

利用已存在的 `DialogProvider` + `useDialog()` hook，提供：

- `dialog.confirm({ title, message, variant })` → 返回 `Promise<boolean>`
- `dialog.alert({ title, message, variant })` → 返回 `Promise<void>`
- `dialog.prompt({ title, message, placeholder, validation })` → 返回 `Promise<string | null>`

---

## 📝 修改清單

### 新建檔案

| 檔案                                     | 說明              |
| ---------------------------------------- | ----------------- |
| `frontend/src/components/ui/Tooltip.tsx` | 全域 Tooltip 元件 |

### 修改檔案

| 檔案                                      | 修改類型         | 說明                                                  |
| ----------------------------------------- | ---------------- | ----------------------------------------------------- |
| `components/ui/index.ts`                  | 匯出             | 新增 Tooltip 匯出                                     |
| `index.css`                               | CSS              | 新增 `.tooltip-wrapper` / `.tooltip-content` 樣式系統 |
| `components/editor/RichTextEditor.tsx`    | Tooltip          | 26 個工具列按鈕包裝 Tooltip                           |
| `components/ui/editor/RichTextEditor.tsx` | Tooltip          | ToolbarButton 子元件改用 Tooltip                      |
| `pages/admin/ArticleEditor.tsx`           | Dialog + Tooltip | 8 處 alert/confirm 替換 + 4 處 Tooltip                |
| `pages/admin/CourseEditor.tsx`            | Dialog + Tooltip | 8 處 alert/confirm 替換 + 1 處 Tooltip                |
| `pages/admin/AdminArticles.tsx`           | Dialog           | 1 處 confirm 替換                                     |
| `pages/admin/AdminCourses.tsx`            | Dialog           | 1 處 confirm 替換                                     |
| `pages/Checkout.tsx`                      | Dialog           | 5 處 alert 替換                                       |

### 修復

- **useDialog() 宣告順序**：將 `const dialog = useDialog()` 移至 ArticleEditor 和 CourseEditor 元件頂部，修復 TypeScript 編譯錯誤（`Block-scoped variable 'dialog' used before its declaration`）

---

## ✅ 驗證結果

- **TypeScript 編譯**：所有修改檔案零錯誤
- **原生 alert/confirm 掃描**：`src/` 中不再有任何裸露的 `alert()` 或 `confirm()` 呼叫
- **Tooltip 覆蓋率**：兩版 RichTextEditor 所有工具列按鈕 + 編輯器標頭按鈕均已包裝

---

## 📊 統計

| 指標            | 數量      |
| --------------- | --------- |
| 替換 alert()    | 13 處     |
| 替換 confirm()  | 10 處     |
| title → Tooltip | 48 個按鈕 |
| 新建元件        | 1 個      |
| 修改檔案        | 10 個     |
