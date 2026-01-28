# 文章系統完整實作報告

**報告日期**: 2026-01-26T10:00:00+08:00  
**報告類型**: 功能實作  
**狀態**: ✅ 完成

---

## 📋 目的

根據 `postgresql_database_design.md` 資料庫設計文件，實作完整的文章系統（Articles System），包含文章 CRUD、評分系統、及巢狀留言功能。

---

## 🗂️ 實作內容

### 1. 資料庫層級 (Database)

**位置**: `database/schema.sql`

新增 3 個資料表：

#### Table 11: articles (文章)

```sql
CREATE TABLE articles (
  article_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id),
  article_title VARCHAR(255) NOT NULL,
  article_slug VARCHAR(300) UNIQUE,
  article_description VARCHAR(160),           -- SEO 描述
  article_content TEXT,                       -- CKEditor 富文本
  article_thumbnail_url TEXT,
  article_keywords TEXT[],
  article_category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',         -- draft, published, archived
  view_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### Table 12: article_ratings (文章評分)

```sql
CREATE TABLE article_ratings (
  rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(article_id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)                 -- 每位用戶只能評分一次
);
```

#### Table 13: article_comments (文章留言)

```sql
CREATE TABLE article_comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(article_id),
  user_id UUID NOT NULL REFERENCES users(id),
  parent_comment_id UUID REFERENCES article_comments(comment_id),  -- 巢狀回覆
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**新增索引**: 10+ 個效能優化索引  
**RLS 政策**: 公開讀取 / 認證用戶寫入  
**觸發器**: 自動更新 `updated_at`

---

### 2. 後端 API 層級 (Backend)

**位置**: `backend/routes/articles.ts`

#### 公開 API

| 方法 | 端點                         | 說明                      |
| ---- | ---------------------------- | ------------------------- |
| GET  | `/api/articles`              | 取得文章列表 (已發布)     |
| GET  | `/api/articles/:identifier`  | 取得單篇文章 (id 或 slug) |
| GET  | `/api/articles/:id/ratings`  | 取得文章評分              |
| GET  | `/api/articles/:id/comments` | 取得文章留言              |

#### 認證用戶 API

| 方法 | 端點                         | 說明          |
| ---- | ---------------------------- | ------------- |
| POST | `/api/articles/:id/ratings`  | 評分文章      |
| POST | `/api/articles/:id/comments` | 新增留言/回覆 |

#### 管理員 API

| 方法   | 端點                                    | 說明                  |
| ------ | --------------------------------------- | --------------------- |
| GET    | `/api/articles/admin/all`               | 取得所有文章 (含草稿) |
| POST   | `/api/articles`                         | 建立文章              |
| PUT    | `/api/articles/:id`                     | 更新文章              |
| DELETE | `/api/articles/:id`                     | 刪除文章 (軟刪除)     |
| PUT    | `/api/articles/comments/:id/visibility` | 管理留言可見性        |

**後端入口更新**: `backend/index.ts` 已註冊 `/api/articles` 路由

---

### 3. 前端類型層級 (Types)

**位置**: `src/types/content.ts`

```typescript
// 文章狀態
export type ArticleStatus = "draft" | "published" | "archived";

// 文章作者資訊
export interface ArticleAuthor {
  id: string;
  email: string;
  name?: string;
}

// 文章
export interface Article {
  article_id: string;
  author_id: string;
  author?: ArticleAuthor;
  article_title: string;
  article_slug?: string;
  article_description?: string;
  article_content?: string;
  article_thumbnail_url?: string;
  article_keywords?: string[];
  article_category?: string;
  status: ArticleStatus;
  view_count: number;
  rating_average: number;
  rating_count: number;
  comment_count: number;
  is_featured: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

// 文章評分
export interface ArticleRating {
  rating_id: string;
  article_id: string;
  user_id: string;
  rating: number;
  created_at?: string;
}

// 文章留言
export interface ArticleComment {
  comment_id: string;
  article_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_visible: boolean;
  author?: ArticleAuthor;
  created_at?: string;
}
```

---

### 4. 前端服務層級 (Service)

**位置**: `src/services/article.service.ts`

```typescript
export const articleService = {
  // 公開 API
  getAll(params),
  getByIdentifier(idOrSlug),
  getRatings(articleId),
  getComments(articleId),

  // 認證 API
  rateArticle(articleId, rating),
  addComment(articleId, { content, parentCommentId }),

  // 管理員 API
  getAllAdmin(params),
  create(data),
  update(id, data),
  delete(id),
  updateCommentVisibility(commentId, isVisible),
};
```

---

### 5. 前端頁面層級 (Pages)

#### 公開頁面

| 檔案                          | 路由              | 說明     |
| ----------------------------- | ----------------- | -------- |
| `src/pages/Articles.tsx`      | `/articles`       | 文章列表 |
| `src/pages/ArticleDetail.tsx` | `/articles/:slug` | 文章詳情 |

**功能**:

- 文章卡片展示 (縮圖、標題、摘要、分類)
- 分類篩選
- 分頁
- 評分系統 (1-5 星)
- 巢狀留言 (最多 2 層)

#### 管理頁面

| 檔案                                | 路由              | 說明     |
| ----------------------------------- | ----------------- | -------- |
| `src/pages/admin/AdminArticles.tsx` | `/admin/articles` | 文章管理 |

**功能**:

- DataTable 顯示文章列表
- 狀態篩選 (草稿/已發布/已封存)
- 搜尋
- 新增/編輯/刪除文章
- 設定精選文章

---

### 6. 導航更新

#### 前台 Navbar

**位置**: `src/components/layout/Navbar.tsx`

- 新增「專業知識」連結至 `/articles`

#### 後台 Sidebar

**位置**: `src/components/admin/AdminSidebar.tsx`

- 新增「文章管理」連結至 `/admin/articles`

#### 路由配置

**位置**: `src/App.tsx`

- 新增 `/articles` 路由
- 新增 `/articles/:slug` 路由
- 新增 `/admin/articles` 路由

---

## 📊 總結

### 新增檔案 (4)

- `backend/routes/articles.ts`
- `src/services/article.service.ts`
- `src/pages/Articles.tsx`
- `src/pages/ArticleDetail.tsx`
- `src/pages/admin/AdminArticles.tsx`

### 修改檔案 (9)

- `database/schema.sql` - 新增 3 個資料表
- `backend/index.ts` - 註冊 articles 路由
- `src/types/content.ts` - 新增 Article 相關類型
- `src/App.tsx` - 新增路由
- `src/pages/index.ts` - 匯出新頁面
- `src/pages/admin/index.ts` - 匯出 AdminArticles
- `src/components/layout/Navbar.tsx` - 新增導航連結
- `src/components/admin/AdminSidebar.tsx` - 新增側邊欄連結
- `README.md` - 更新文件

---

## ✅ 驗證清單

- [x] 資料庫結構符合設計文件
- [x] 後端 API 完整 CRUD
- [x] 評分系統 (1-5 星，每人一票)
- [x] 巢狀留言 (支援回覆)
- [x] 前端列表頁
- [x] 前端詳情頁
- [x] 管理後台頁
- [x] 導航連結
- [x] TypeScript 類型定義
- [x] 服務層封裝

---

**報告結束**
