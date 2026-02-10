# RWD 修復與文章卡片渲染異常修復報告

> **報告時間**：2026-02-10T15:00:00+08:00
> **修復範圍**：scroll-reveal 動畫系統、Tailwind 主題色缺失、CSS 變數 fallback、頁面結構統一

---

## 問題摘要

| #   | 問題                                                                  | 嚴重度      | 狀態      |
| --- | --------------------------------------------------------------------- | ----------- | --------- |
| 1   | 文章頁面（Articles）卡片完全不顯示                                    | 🔴 Critical | ✅ 已修復 |
| 2   | `prism-bg` / `prism-accent` Tailwind class 無效                       | 🟠 High     | ✅ 已修復 |
| 3   | `--luxe-bg` / `--luxe-surface` / `--luxe-muted` CSS 變數缺少 fallback | 🟠 High     | ✅ 已修復 |
| 4   | Articles.tsx z-index wrapper 結構不一致                               | 🟡 Medium   | ✅ 已修復 |
| 5   | Articles / ArticleDetail 缺少 `setTheme("luxe")`                      | 🟡 Medium   | ✅ 已修復 |

---

## 根因分析

### 1. 文章卡片不渲染（Critical）

**根因**：`useScrollReveal` hook 使用 `useRef` + 靜態依賴 `[threshold, rootMargin, once]`，導致 IntersectionObserver 只在首次 render 時設定。

**問題流程**：

1. 首次 render → `loading=true` → 顯示 Loading spinner，grid 不在 DOM 中
2. `useEffect` 執行 → `containerRef.current` 為 null → 直接 return
3. API 回傳 → `setArticles()` + `setLoading(false)` → 重新 render
4. grid 出現在 DOM 中，但 `useEffect` 依賴未變，不重新執行
5. 文章卡片帶有 `scroll-reveal` class → CSS 設定 `opacity: 0`
6. IntersectionObserver 從未觀察這些元素 → 永遠不會加入 `is-visible` class → **永遠隱形**

**影響範圍**：Articles.tsx（文章列表）、Courses.tsx（課程列表）

### 2. Tailwind 主題色缺失

**根因**：`tailwind.config.ts` 中 `prism` 和 `abyss` 色盤缺少 `bg` 和 `accent` 鍵。

- `prism` 定義了 `void`、`purple`、`blue` 等，但沒有 `bg` 和 `accent`
- 大量頁面使用 `bg-prism-bg`、`text-prism-accent`、`border-prism-accent/20` 等
- Tailwind JIT 找不到 `colors.prism.bg` → 不產生 utility class → 樣式無效

### 3. CSS 變數缺少 fallback

**根因**：`--luxe-bg`、`--luxe-surface`、`--luxe-muted` 只在 DaisyUI `luxe` 主題啟用時才存在。

- `:root` 中定義了 `--luxe-black`、`--luxe-gold` 等靜態變數
- 但 `--luxe-bg`、`--luxe-surface`、`--luxe-muted` 由 DaisyUI 主題動態注入
- 從其他頁面（如 Courses/prism）導航到 Articles 時，DaisyUI 主題可能不是 luxe
- `bg-luxe-bg` → `var(--luxe-bg)` → 未定義 → 透明背景

---

## 修復方案

### Fix 1: `useScrollReveal.ts` — 改用 Callback Ref + MutationObserver

```
改動前: useRef + 靜態依賴 → 只在首次 render 時設定 observer
改動後: useState + callback ref + MutationObserver → 支援動態內容
```

- **Callback ref**：當 DOM 元素掛載/卸載時，React 自動呼叫 `setContainer(node)`，觸發 state 變化
- **useEffect 依賴 `container`**：container 從 null 變為 DOM node 時 useEffect 重新執行
- **MutationObserver**：監聽子元素變化，自動為新增的 `.scroll-reveal` 設定 IntersectionObserver
- **WeakSet 避免重複追蹤**：已觀察的元素不會重複 observe

### Fix 2: `tailwind.config.ts` — 新增缺失顏色鍵

```
abyss: { bg: "#000205", accent: "#00ffff", ... }
prism: { bg: "#0b001a", accent: "#b388ff", ... }
```

### Fix 3: `index.css` — `:root` 新增 CSS 變數 fallback

```css
:root {
  --luxe-bg: #0a0a0a;
  --luxe-surface: #141414;
  --luxe-muted: #888888;
}
```

DaisyUI luxe 主題啟用時會覆蓋這些值，確保非 luxe 主題時也有安全的預設值。

### Fix 4: `Articles.tsx` — 結構重整

- 將 `PageHeader` + 內容容器包裹在 `<div className="relative z-10">` 中
- 移除容器上的 `relative z-10`（改由父級統一管理）
- 新增 `setTheme("luxe")` 確保主題 CSS 變數正確
- Loading 狀態改為帶 PrismScene 背景的全頁佈局

### Fix 5: `ArticleDetail.tsx` — 新增 setTheme

- 引入 `useTheme` 並呼叫 `setTheme("luxe")`

---

## 修改檔案列表

| 檔案                       | 修改類型 | 說明                                            |
| -------------------------- | -------- | ----------------------------------------------- |
| `hooks/useScrollReveal.ts` | 重寫     | callback ref + MutationObserver 支援動態內容    |
| `tailwind.config.ts`       | 新增     | prism/abyss 色盤新增 `bg` 和 `accent` 鍵        |
| `index.css`                | 新增     | `:root` 新增 `--luxe-bg/surface/muted` fallback |
| `pages/Articles.tsx`       | 重構     | z-10 wrapper + setTheme("luxe") + loading 佈局  |
| `pages/ArticleDetail.tsx`  | 新增     | setTheme("luxe")                                |

---

## 驗證結果

- ✅ 所有修改檔案 TypeScript 零錯誤
- ✅ useScrollReveal 新的 callback ref 相容所有現有用法（Articles、Courses）
- ✅ Tailwind 色彩鍵完整覆蓋所有已使用的 class
- ✅ CSS 變數 fallback 不影響正常主題切換
