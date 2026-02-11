# 課程內頁標題階層 / 用戶管理篩選排序 / 文章精選功能整合

> **報告時間**: 2026-02-11T10:00:00+08:00  
> **範疇**: 前台內頁 CSS + 後台管理功能增強

---

## 📋 任務總覽

| #   | 任務                    | 狀態    |
| --- | ----------------------- | ------- |
| 1   | 課程內頁 Prose 標題階層 | ✅ 完成 |
| 2   | 用戶管理排序 + 多重篩選 | ✅ 完成 |
| 3   | 文章管理精選功能整合    | ✅ 完成 |

---

## 1. 課程內頁 Prose 標題階層 (prism 主題)

### 問題

文章內頁（ArticleDetail）已有 luxe 金色系 heading 階層（h1-h4 縮排+裝飾），但課程內頁（CourseDetail）尚未套用，使用者希望課程也有相同的視覺層次。

### 解決方案

建立 `.prose-theme-prism` CSS 覆寫，以紫色 `#b388ff` 為主調，結構與 luxe 版完全一致：

| 元素 | 裝飾                                                                                  | 縮排    |
| ---- | ------------------------------------------------------------------------------------- | ------- |
| h1   | 紫色漸層 `linear-gradient(135deg, #b388ff, rgba(179, 136, 255, 0.7))` + bottom border | 0       |
| h2   | 左邊 3px 紫色條 + `padding-left: 1.25rem`                                             | 1.25rem |
| h3   | `›` 前綴 + 紫色文字 + `padding-left: 2.25rem`                                         | 2.25rem |
| h4   | `padding-left: 3rem`                                                                  | 3rem    |

附加裝飾：`a`、`blockquote`、`code`、`hr` 統一紫色系。

### 修改檔案

| 檔案                                  | 變更                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| `frontend/src/index.css`              | 新增 `.prose-theme-prism :where(h1~h4)` 等 ~50 行 CSS         |
| `frontend/src/pages/CourseDetail.tsx` | `prose prose-invert` → `prose prose-invert prose-theme-prism` |

---

## 2. 用戶管理排序 + 多重篩選 (AdminUsers)

### 問題

AdminUsers 只有文字搜尋，無排序功能、無條件篩選器。管理多名用戶時缺乏有效工具。

### 解決方案

完全重寫 AdminUsers.tsx：

#### DataTable 排序

- 啟用 `sortable` prop
- 所有資料欄位加入 `sortValue` 函數：
  - 姓名：`toLowerCase()`
  - Email：`toLowerCase()`
  - 角色：text comparison
  - 狀態：boolean → number
  - 私密相簿：boolean → number
  - 註冊時間：Date timestamp

#### 三組篩選器

| 篩選器   | 選項                         |
| -------- | ---------------------------- |
| 角色     | 全部角色 / 管理員 / 一般用戶 |
| 狀態     | 全部狀態 / 活躍 / 停用       |
| 私密相簿 | 全部 / 已啟用 / 未啟用       |

#### 技術實現

- `useMemo` 合併搜尋 + 3 篩選器結果
- 即時計數器：「顯示 X / Y 位用戶」
- Actions 欄位設 `sortable: false`

### 修改檔案

| 檔案                                      | 變更               |
| ----------------------------------------- | ------------------ |
| `frontend/src/pages/admin/AdminUsers.tsx` | 完全重寫 (~290 行) |

---

## 3. 文章管理精選功能整合 (AdminArticles)

### 問題

`is_featured` 功能已存在於：

- formData 中的 checkbox
- create/update API 呼叫
- 表格中 ★ 精選 badge（附在標題下方）

但使用者需開啟完整編輯 Modal 才能切換精選狀態，操作不便。

### 解決方案

#### 精選獨立欄位

- 從標題 cell 拆出為獨立 `is_featured` 欄位
- 含 `sortValue` 排序支援 (featured=1, normal=0)

#### 快速切換按鈕

- 表格內顯示 `★ 精選` 或 `☆ 普通` 可點擊按鈕
- 點擊呼叫 `articleService.update(id, { isFeatured: !current })`
- 使用 `setArticles` 本地即時更新，避免重新載入整頁

```tsx
const handleToggleFeatured = async (article: Article) => {
  const newFeatured = !article.is_featured;
  await articleService.update(article.article_id, { isFeatured: newFeatured });
  setArticles((prev) =>
    prev.map((a) =>
      a.article_id === article.article_id
        ? { ...a, is_featured: newFeatured }
        : a,
    ),
  );
};
```

#### 精選篩選器

- 新增 `<select>` 下拉：全部文章 / ★ 僅精選 / ☆ 普通文章
- `useMemo` client-side 過濾（不重新呼叫 API）
- 篩選時顯示計數：「★ 精選文章：N 篇」

#### 視覺設計

- 精選按鈕：金色背景 `bg-luxe-gold/20 text-luxe-gold`
- 普通按鈕：灰色 `bg-luxe-muted/10 text-luxe-muted/50`
- Hover 效果：`hover:scale-105` + 色彩過渡

### 修改檔案

| 檔案                                         | 變更                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `frontend/src/pages/admin/AdminArticles.tsx` | 新增 `featuredFilter` 狀態、`handleToggleFeatured`、獨立精選欄位、篩選器、`useMemo` 過濾 |

---

## 🔍 驗證結果

| 檔案              | TypeScript 錯誤 |
| ----------------- | --------------- |
| AdminArticles.tsx | 0               |
| AdminUsers.tsx    | 0               |
| CourseDetail.tsx  | 0               |
| index.css         | N/A (CSS)       |

---

## 📁 完整修改檔案清單

| 檔案                                         | 類型 | 變更摘要                                   |
| -------------------------------------------- | ---- | ------------------------------------------ |
| `frontend/src/index.css`                     | 修改 | 新增 `.prose-theme-prism` heading 階層 CSS |
| `frontend/src/pages/CourseDetail.tsx`        | 修改 | 加入 `prose-theme-prism` class             |
| `frontend/src/pages/admin/AdminUsers.tsx`    | 重寫 | DataTable 排序 + 3 組篩選器 + useMemo      |
| `frontend/src/pages/admin/AdminArticles.tsx` | 修改 | 精選獨立欄位 + 切換按鈕 + 篩選器 + useMemo |
| `README.md`                                  | 更新 | 新增更新日誌                               |
