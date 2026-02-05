# 資料庫 Migration 後前端修正報告

**日期**: 2026-02-06T18:00:00+08:00  
**問題**: 執行 migration 002 後，文章詳細頁報錯  
**原因**: 資料庫欄位從 `TEXT[]` 改為 `TEXT`（逗號分隔），但前端仍用陣列方式處理

---

## 📋 問題分析

### Migration 變更

執行 `002_add_course_level_and_fix_keywords.sql` 後，以下欄位型別改變：

| 欄位               | 原型別    | 新型別 | 說明         |
| ------------------ | --------- | ------ | ------------ |
| `course_keywords`  | `TEXT[]`  | `TEXT` | 逗號分隔字串 |
| `course_category`  | `VARCHAR` | `TEXT` | 逗號分隔字串 |
| `article_keywords` | `TEXT[]`  | `TEXT` | 逗號分隔字串 |
| `article_category` | `VARCHAR` | `TEXT` | 逗號分隔字串 |

### 前端錯誤

前端程式碼仍將 `article_keywords` 視為陣列：

```typescript
// ❌ 錯誤：article_keywords 現在是 string，不是 string[]
{article.article_keywords && article.article_keywords.length > 0 && (
  {article.article_keywords.map((keyword, idx) => (
    <span>#{keyword}</span>
  ))}
)}
```

---

## ✅ 修正內容

### 1. Type 定義修正

**檔案**: `frontend/src/types/content.ts`

```typescript
// ✅ 修正後
export interface Course {
  course_keywords?: string; // 改為 string
  course_category?: string; // 改為 string
  // ...
  keywords?: string[]; // 前端別名保持 array
}

export interface Article {
  article_keywords?: string; // 改為 string
  article_category?: string; // 改為 string
  // ...
}
```

### 2. Service 層轉換

**檔案**: `frontend/src/services/course.service.ts`

```typescript
const normalizeCourse = (data: Partial<Course>): Course => {
  return {
    ...data,
    // ✅ 將逗號分隔字串轉為陣列
    keywords: data.course_keywords
      ? data.course_keywords.split(",").map((k) => k.trim())
      : [],
    // ...
  } as Course;
};
```

**說明**: Course 前端別名 `keywords` 保持陣列格式，對前端使用更友善。

### 3. ArticleDetail 頁面修正

**檔案**: `frontend/src/pages/ArticleDetail.tsx`

#### SEOHead 參數修正

```typescript
// ✅ 修正後
<SEOHead
  keywords={article.article_keywords
    ? article.article_keywords.split(',').map(k => k.trim())
    : []}
/>
```

#### Keywords 顯示修正

```typescript
// ✅ 修正後
{article.article_keywords && article.article_keywords.trim() && (
  <div>
    {article.article_keywords.split(',').map((keyword, idx) => (
      <span key={idx}>#{keyword.trim()}</span>
    ))}
  </div>
)}
```

### 4. 管理後台修正

#### AdminCourses.tsx

**檔案**: `frontend/src/pages/admin/AdminCourses.tsx`

```typescript
const openEditModal = (course: Course) => {
  // ✅ category 是 string，需要 split
  const categoryArray = course.course_category
    ? course.course_category
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // ✅ keywords 已經是 array（由 service 轉換）
  const keywordsArray = course.keywords || [];

  setFormData({
    category: categoryArray,
    keywords: keywordsArray,
    // ...
  });
};
```

#### AdminArticles.tsx

**檔案**: `frontend/src/pages/admin/AdminArticles.tsx`

```typescript
const openEditModal = (article: Article) => {
  // ✅ 使用 article_keywords（資料庫欄位）並 split
  const keywordsArray = article.article_keywords
    ? article.article_keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  setFormData({
    keywords: keywordsArray,
    // ...
  });
};
```

---

## 📊 修正總結

### 修正檔案清單

1. ✅ `frontend/src/types/content.ts`
2. ✅ `frontend/src/services/course.service.ts`
3. ✅ `frontend/src/pages/ArticleDetail.tsx`
4. ✅ `frontend/src/pages/admin/AdminCourses.tsx`
5. ✅ `frontend/src/pages/admin/AdminArticles.tsx`

### 不需修正的檔案

- ✅ `frontend/src/pages/CourseDetail.tsx` - 使用 `course.keywords`（已由 service 層轉換成陣列）

### 資料流程

```
資料庫 (TEXT, 逗號分隔)
    ↓
Service 層
    ├─ Course: split 成 array 給前端別名 keywords
    └─ Article: 保持原始格式 article_keywords (string)
    ↓
前端使用
    ├─ Course: 使用 keywords (array)
    └─ Article: 需要時 split article_keywords
```

### 設計原則

1. **Course**: Service 層轉換，前端直接用陣列
   - 優點：使用方便，多處使用不需重複轉換
   - 適用：CourseDetail、SEOHead 等多處需要陣列

2. **Article**: 前端使用時轉換
   - 優點：保持資料原始格式
   - 適用：ArticleDetail 是主要使用處

---

## 🧪 測試檢查清單

- [ ] 文章詳細頁正常顯示 keywords
- [ ] 課程詳細頁正常顯示（無 keywords 標籤）
- [ ] 文章詳細頁 SEO meta keywords 正確
- [ ] 課程詳細頁 SEO meta keywords 正確
- [ ] 管理後台編輯文章時 keywords 正確載入
- [ ] 管理後台編輯課程時 keywords 正確載入
- [ ] 新增文章時 keywords 正確儲存
- [ ] 新增課程時 keywords 正確儲存

---

## 📝 後續建議

### 選項 1: 統一在 Service 層轉換（推薦）

建立 `normalizeArticle` 函式，將 `article_keywords` 轉為前端別名 `keywords` (array)：

```typescript
// article.service.ts
const normalizeArticle = (data: Partial<Article>): Article => {
  return {
    ...data,
    author: data.users || data.author,
    // 新增 keywords 別名
    keywords: data.article_keywords
      ? data.article_keywords.split(",").map((k) => k.trim())
      : [],
  } as Article;
};
```

優點：

- 前端使用統一，不需每處轉換
- 與 Course 處理方式一致
- 降低出錯機率

### 選項 2: 資料庫改回 TEXT[]（不推薦）

回復使用 PostgreSQL 陣列型別。

缺點：

- 需要重新 migration
- 測試資料需重新生成
- 其他資料庫可能不支援陣列型別

---

## 🎯 結論

所有前端程式碼已修正完成，現在可以正確處理資料庫 TEXT 格式的 keywords 和 category 欄位。

建議後續統一採用 **Service 層轉換** 的方式，讓前端使用更一致。
