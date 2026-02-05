# 課程評論系統功能實作報告

**報告時間**: 2026-01-21T10:30:00+08:00  
**分支**: `feature/dark-light-mode-fix`  
**狀態**: ✅ 已完成

---

## 📋 概述

本次更新為課程詳細頁面 (CourseDetail) 新增完整的評分與評論提交功能，讓登入用戶可以對課程進行評分並留下評論。

---

## 🔧 修改項目

### 1. 後端 API (backend/routes/courses.ts)

**新增 POST /api/courses/:id/reviews 端點**

- 功能：新增或更新課程評論
- 驗證：需要 JWT Token 認證
- 參數：
  - `rating`: 1-5 評分 (必填)
  - `comment`: 評論內容 (選填)
- 邏輯：
  - 檢查用戶是否已評論過此課程
  - 如已評論則更新，否則新增
  - 自動更新課程平均評分

**新增 updateCourseRatingStats 輔助函數**

- 功能：重新計算並更新課程的評分統計
- 計算 `rating_average` 和 `rating_count`

```typescript
// API 範例
POST /api/courses/1/reviews
Content-Type: application/json
Authorization: Bearer <token>

{
  "rating": 5,
  "comment": "非常棒的課程！"
}
```

---

### 2. 前端服務 (frontend/src/services/course.service.ts)

**新增 addReview 方法**

```typescript
addReview: async (
  courseId: number,
  rating: number,
  comment?: string,
): Promise<CourseReview>
```

---

### 3. CourseDetail 頁面 (frontend/src/pages/CourseDetail.tsx)

**新增功能**

1. **互動式星星評分**
   - 滑鼠 hover 效果
   - 點擊選擇評分

2. **評論輸入框**
   - 可選填評論內容
   - 使用 Prism 主題樣式

3. **狀態管理**
   - `userRating`: 用戶當前評分
   - `reviewComment`: 評論內容
   - `hoverRating`: hover 時的暫時評分
   - `submitting`: 送出中狀態

4. **使用者體驗**
   - 已評論過的用戶可以更新評價
   - 未登入顯示登入提示
   - 評論提交後自動刷新列表

---

## 📊 資料庫結構

利用現有 `course_reviews` 表：

| 欄位       | 類型      | 說明     |
| ---------- | --------- | -------- |
| review_id  | SERIAL    | 主鍵     |
| course_id  | INTEGER   | 課程 ID  |
| user_id    | UUID      | 用戶 ID  |
| rating     | INTEGER   | 評分 1-5 |
| comment    | TEXT      | 評論內容 |
| is_visible | BOOLEAN   | 是否顯示 |
| created_at | TIMESTAMP | 建立時間 |

---

## 🎨 UI 設計

評分表單使用 Prism 主題：

- 背景：`bg-prism-accent/10`
- 圓角：`rounded-xl`
- 星星：黃色高亮 `text-yellow-500`
- 按鈕：`bg-prism-accent text-prism-bg`

---

## ✅ 測試項目

- [ ] 未登入用戶看到登入提示
- [ ] 登入用戶可選擇評分
- [ ] 評論可選填
- [ ] 評分為 0 時按鈕禁用
- [ ] 提交後顯示在評論列表
- [ ] 已評論用戶可更新評價
- [ ] 課程平均評分自動更新

---

## 📝 相關文件

- [Articles.tsx](../frontend/src/pages/Articles.tsx) - 文章列表（參考實作）
- [ArticleDetail.tsx](../frontend/src/pages/ArticleDetail.tsx) - 文章詳細（已有完整評論功能）
- [schema.sql](../database/schema.sql) - 資料庫結構

---

## 📌 後續建議

1. 考慮新增課程列表頁面（顯示資料庫課程）
2. 目前 Courses.tsx 是銷售頁面，可保留
3. 可加入評論舉報/管理功能
