# 課程管理功能對齊修正報告

**日期**: 2026-02-06T14:30:00+08:00  
**專案**: 前端新設計參考 (react)1  
**任務**: 將新增課程功能與新增文章功能對齊

---

## 📋 任務摘要

修正課程管理功能，使其與文章管理功能保持一致，包括：

1. 前後端 API 欄位對齊
2. 資料庫 schema 修正與擴充
3. 共用文字編輯器元件（已確認）
4. 版面寬度統一

---

## 🔧 修正內容

### 1. 資料庫 Schema 修正

**檔案**: `database/schema.sql`

#### 1.1 新增課程欄位

- 新增 `course_level` VARCHAR(50) - 課程難度等級 (beginner, intermediate, advanced)
- 新增 `lessons_count` INTEGER - 課程包含的課堂數

#### 1.2 修正資料型態

將 `TEXT[]` 陣列型態改為 `TEXT` 字串型態（逗號分隔），以符合前端實作：

**Courses 表**:

- `course_keywords`: TEXT[] → TEXT
- `course_category`: VARCHAR(100) → TEXT

**Articles 表**:

- `article_keywords`: TEXT[] → TEXT
- `article_category`: VARCHAR(100) → TEXT

**理由**:

- 前端使用逗號分隔字串存儲多個值
- 簡化前後端資料處理
- 與文章功能保持一致

---

### 2. 後端 API 修正

**檔案**: `backend/routes/courses.ts`

#### 2.1 POST /api/courses (新增課程)

**修正前**（駝峰式命名）:

```typescript
{
  courseTitle,
  courseSlug,
  courseDescription,
  courseContent,
  courseVideoUrl,
  courseThumbnailUrl,
  courseKeywords,
  courseCategory,
  // ...
}
```

**修正後**（底線命名）:

```typescript
{
  course_title,
  course_slug,
  course_description,
  course_content,
  course_video_url,
  course_thumbnail_url,
  course_level,  // 新增
  category,      // 簡化命名
  keywords,      // 簡化命名
  // ...
}
```

#### 2.2 PUT /api/courses/:id (更新課程)

- 統一使用資料庫欄位名稱（底線命名）
- 新增 `course_level` 欄位支援
- 支援 `category` 和 `keywords` 別名（自動映射到 `course_category` 和 `course_keywords`）

---

### 3. 前端修正

**檔案**: `frontend/src/pages/admin/AdminCourses.tsx`

#### 3.1 API 請求欄位對齊

**handleCreate** 函數修正:

```typescript
await post("/api/courses", {
  course_title: formData.title,
  course_slug: formData.slug || undefined,
  course_description: formData.description || undefined,
  course_content: formData.content || undefined,
  course_level: formData.level, // 新增
  category: formData.category.join(",") || undefined,
  keywords: formData.keywords.join(",") || undefined,
  price: Number(formData.price),
  status: formData.status,
});
```

**handleUpdate** 函數修正:

- 同樣使用底線命名的欄位
- 確保所有欄位與後端 API 一致

#### 3.2 版面寬度

**確認**: Modal `size="xl"` 已設定，與 AdminArticles 一致

---

### 4. 共用元件確認

#### 4.1 RichTextEditor（文字編輯器）

**位置**: `frontend/src/components/ui/editor/RichTextEditor.tsx`

**共用狀態**: ✅ 已共用

- 透過 `@/components/ui` 統一導出
- AdminArticles 和 AdminCourses 都使用相同元件
- 支援主題化、最小高度設定、佔位符等功能

**使用方式**:

```tsx
<RichTextEditor
  content={formData.content}
  onChange={handleContentChange}
  theme="luxe"
  placeholder="開始撰寫內容..."
  minHeight="300px"
/>
```

#### 4.2 其他共用元件

以下元件也是共用的：

- `TagInput` - 分類與關鍵字輸入
- `Modal` - 彈窗容器
- `Input` - 表單輸入
- `Textarea` - 文字區域
- `PillButton` - 按鈕

---

## 📊 欄位對照表

### Courses 表

| 前端欄位    | API 欄位           | 資料庫欄位         | 型態          | 說明                     |
| ----------- | ------------------ | ------------------ | ------------- | ------------------------ |
| title       | course_title       | course_title       | VARCHAR(255)  | 課程標題                 |
| slug        | course_slug        | course_slug        | VARCHAR(255)  | URL 識別碼               |
| description | course_description | course_description | VARCHAR(500)  | 課程簡介                 |
| content     | course_content     | course_content     | TEXT          | 課程詳細內容             |
| level       | course_level       | course_level       | VARCHAR(50)   | 難度等級 ⭐新增          |
| category    | category           | course_category    | TEXT          | 分類（逗號分隔）✏️修正   |
| keywords    | keywords           | course_keywords    | TEXT          | 關鍵字（逗號分隔）✏️修正 |
| price       | price              | price              | DECIMAL(10,2) | 價格                     |
| status      | status             | status             | VARCHAR(20)   | 狀態                     |

### Articles 表

| 前端欄位    | API 欄位    | 資料庫欄位          | 型態         | 說明                     |
| ----------- | ----------- | ------------------- | ------------ | ------------------------ |
| title       | title       | article_title       | VARCHAR(255) | 文章標題                 |
| slug        | slug        | article_slug        | VARCHAR(255) | URL 識別碼               |
| description | description | article_description | VARCHAR(500) | 文章簡介                 |
| content     | content     | article_content     | TEXT         | 文章內容                 |
| category    | category    | article_category    | TEXT         | 分類（逗號分隔）✏️修正   |
| keywords    | keywords    | article_keywords    | TEXT         | 關鍵字（逗號分隔）✏️修正 |
| status      | status      | status              | VARCHAR(20)  | 狀態                     |
| isFeatured  | isFeatured  | is_featured         | BOOLEAN      | 是否精選                 |

---

## 🗄️ 資料庫 Migration

**檔案**: `database/migrations/002_add_course_level_and_fix_keywords.sql`

### 執行步驟

```bash
# 連接到 Supabase 資料庫後執行
psql -h <your-db-host> -U postgres -d postgres -f database/migrations/002_add_course_level_and_fix_keywords.sql
```

### Migration 內容

1. ✅ 新增 `course_level` 欄位（預設值: beginner）
2. ✅ 新增 `lessons_count` 欄位（預設值: 0）
3. ✅ 轉換 `course_keywords` 從 TEXT[] 到 TEXT
4. ✅ 轉換 `article_keywords` 從 TEXT[] 到 TEXT
5. ✅ 修改 `course_category` 和 `article_category` 為 TEXT
6. ✅ 新增欄位註解

---

## ✅ 修正驗證清單

- [x] 資料庫 schema 新增欄位
- [x] 資料庫 keywords 型態修正
- [x] 後端 POST API 欄位對齊
- [x] 後端 PUT API 欄位對齊
- [x] 前端新增課程欄位對齊
- [x] 前端更新課程欄位對齊
- [x] 確認 RichTextEditor 為共用元件
- [x] Modal 版面寬度統一為 xl
- [x] 建立 Migration 檔案
- [x] 生成完整報告文件

---

## 🎯 設計原則遵循

### Single Responsibility Principle (單一職責)

- 每個 API endpoint 只處理一個功能
- Migration 檔案獨立管理資料庫變更
- 元件功能明確分離

### Open-Closed Principle (開放封閉)

- 後端 API 使用靈活的欄位映射
- 支援別名（category/keywords）向後兼容
- 元件設計易於擴展

### DRY (Don't Repeat Yourself)

- 共用 RichTextEditor 元件
- 共用其他 UI 元件（TagInput, Modal 等）
- 統一的錯誤處理機制

---

## 📝 後續建議

### 1. 資料遷移

如果現有資料庫已有資料，執行 migration 前建議：

```sql
-- 備份現有資料
CREATE TABLE courses_backup AS SELECT * FROM courses;
CREATE TABLE articles_backup AS SELECT * FROM articles;
```

### 2. 測試項目

- [ ] 測試新增課程功能
- [ ] 測試更新課程功能
- [ ] 驗證難度等級選擇
- [ ] 驗證分類和關鍵字儲存
- [ ] 檢查資料庫資料正確性

### 3. 文件更新

- [ ] 更新 API 文件
- [ ] 更新資料庫 ERD 圖
- [ ] 更新開發者指南

---

## 🔍 問題修正對照

| 問題                    | 修正方式             | 檔案                                        |
| ----------------------- | -------------------- | ------------------------------------------- |
| 前後端 API 欄位不一致   | 統一使用底線命名     | `backend/routes/courses.ts`                 |
| 資料庫缺少 course_level | 新增欄位與 migration | `database/schema.sql`                       |
| keywords 型態不符       | TEXT[] → TEXT        | `database/schema.sql`                       |
| 前端 API 請求錯誤       | 修正欄位名稱         | `frontend/src/pages/admin/AdminCourses.tsx` |

---

## 📚 相關檔案清單

### 修改檔案

1. `database/schema.sql`
2. `backend/routes/courses.ts`
3. `frontend/src/pages/admin/AdminCourses.tsx`

### 新增檔案

1. `database/migrations/002_add_course_level_and_fix_keywords.sql`
2. `REPORTS/COURSE_MANAGEMENT_ALIGNMENT_2026-02-06T14-30-00+08-00.md`

### 確認共用元件

1. `frontend/src/components/ui/editor/RichTextEditor.tsx`
2. `frontend/src/components/ui/form/TagInput.tsx`
3. `frontend/src/components/ui/overlay/Modal.tsx`

---

## ✨ 總結

本次修正確保了課程管理功能與文章管理功能的一致性：

1. **資料庫層**: 新增必要欄位，統一資料型態
2. **後端層**: API 欄位規範化，支援向後兼容
3. **前端層**: 元件共用，版面統一，API 對齊
4. **程式碼品質**: 遵循 SOLID 原則，加入完整錯誤處理

所有修改都遵循 Google Style Guide，包含完整的 docstring 和 logging，並保持程式碼簡潔易維護。

---

**報告產生時間**: 2026-02-06T14:30:00+08:00  
**執行者**: GitHub Copilot (Claude Sonnet 4.5)
