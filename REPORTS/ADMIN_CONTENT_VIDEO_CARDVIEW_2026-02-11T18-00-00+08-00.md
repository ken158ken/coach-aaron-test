# 內容管理活化 / 首頁彈窗 / 影片拖曳排序 / 卡片檢視切換

> **報告時間**: 2026-02-11T18:00:00+08:00  
> **ISO 8601 時間戳記**: `2026-02-11T10:00:00Z`

---

## 📋 任務總覽

本次任務共涵蓋 5 大功能區塊：

| #   | 功能                                   | 狀態    |
| --- | -------------------------------------- | ------- |
| 1   | 內容管理活化（AdminContent + DB CRUD） | ✅ 完成 |
| 2   | 首頁自定義彈窗系統（HomePopup）        | ✅ 完成 |
| 3   | 影片管理拖曳排序重寫（AdminVideos）    | ✅ 完成 |
| 4   | 課程/文章/影片卡片檢視切換             | ✅ 完成 |
| 5   | SQL Migration 腳本                     | ✅ 完成 |

---

## 1. 內容管理活化

### 問題

AdminContent 頁面原為純靜態 Mock 數據，所有操作（新增/編輯/刪除）不會持久化。

### 解決方案

#### 1.1 資料庫層

- **新資料表 `site_content`**: 儲存網站文案（hero_title, hero_subtitle, about_coach 等）
  - 欄位: `content_id`, `content_key`(UNIQUE), `content_name`, `content_value`, `content_type`(text/html/json), `sort_order`, `is_active`, timestamps
- **新資料表 `site_popups`**: 儲存首頁彈窗
  - 欄位: `popup_id`, `popup_title`, `popup_content`(HTML), `is_active`, `show_once`, `start_date`, `end_date`, timestamps
- **Migration**: `database/migrations/003_site_content_and_popup.sql`

#### 1.2 後端 API

- **路由檔案**: `backend/routes/content.ts`（~290 行）
- **公開端點**:
  - `GET /api/content` — 回傳所有啟用的 content 鍵值對
  - `GET /api/content/popup/active` — 回傳目前啟用的彈窗
- **管理端點**:
  - `GET/POST/PUT/DELETE /api/content/admin/*` — Content CRUD
  - `GET/POST/PUT/DELETE /api/content/admin/popups/*` — Popup CRUD
- **特殊邏輯**: 啟用某彈窗時，自動停用其他所有彈窗

#### 1.3 前端服務

- **`content.service.ts`**（~170 行）: TypeScript API Client
- **Interfaces**: `SiteContent`, `SitePopup`, `ActivePopup`

#### 1.4 AdminContent 重寫

- **雙 Tab 架構**: 📝 網站文案 / 🪟 首頁彈窗
- **文案管理**: 卡片列表 → 編輯 Modal → 即時儲存
- **彈窗管理**: 新增/編輯/刪除，RichTextEditor 編輯內容，Toggle 切換啟用狀態

---

## 2. 首頁自定義彈窗系統

### 元件: `HomePopup.tsx`（~140 行）

- 頁面載入後 500ms 延遲顯示
- `localStorage` 追蹤 `coach_popup_seen_{id}`，支援「僅顯示一次」
- 漸入 + scale 動畫，背景模糊
- 渲染 HTML 內容（`dangerouslySetInnerHTML` + prose 樣式）
- 「了解」按鈕關閉，記錄已讀狀態

### 整合: `Home.tsx`

- `<HomePopup />` 置於 `<AbyssScene />` 之後

---

## 3. 影片管理拖曳排序重寫

### 問題

原 AdminVideos 僅有 DataTable 列表 + 無功能的「編輯」按鈕，無法調整影片在前台的顯示順序。

### 解決方案: `AdminVideos.tsx` 完全重寫（~560 行）

#### 排序功能

- **HTML5 Drag & Drop**: 拖曳手柄 `⠿`，拖曳中半透明 + 縮小效果
- **直接編輯排序號**: 每列數字輸入欄位
- **上移/下移按鈕**: ▲ ▼ 快捷操作
- **儲存排序按鈕**: 偵測到變更時出現脈衝動畫 `animate-pulse`
- **未儲存警示**: 黃色警示條「排序已變更，請記得點擊儲存排序按鈕」

#### 後端整合

- **`videoService.reorder()`**: 呼叫 `PUT /api/videos/admin/reorder`
- **批次更新**: `{ orders: [{ id, sortOrder }] }`

#### 卡片檢視

- 同時支援四種檢視模式（見 §4）

---

## 4. 課程/文章/影片 卡片檢視切換

### 共用架構

- **`ViewMode` 類型**: `"list" | "card-sm" | "card-md" | "card-lg"`
- **切換 UI**: 按鈕群組 `☰ / ▪▪▪ / ◻◻ / ⬜`，選中高亮金色

### 各頁面實作

#### AdminArticles

| 模式 | Grid 佈局         |
| ---- | ----------------- |
| 清單 | DataTable（不變） |
| 小圖 | `2/3/4/5/6` 欄    |
| 中圖 | `2/3/4/5` 欄      |
| 大圖 | `1/2/3/4` 欄      |

- 卡片內容: 縮圖（或 📝 佔位）、狀態徽章、精選標記、標題、描述、分類、瀏覽數
- Hover 操作: 編輯 / 取消精選 / 刪除

#### AdminCourses

- 卡片內容: 縮圖（或 🎓 佔位）、狀態徽章、價格浮標（金色）、標題、描述、難度、課堂數
- Hover 操作: 編輯 / 快速編輯 / 刪除

#### AdminVideos

- 卡片內容: YouTube 縮圖（自動解析）、排序編號浮標、隱藏狀態標記、標題、類型
- Hover 操作: ▲ 上移 / ▼ 下移 / 👁 切換可見
- 支援拖曳排序（card 模式同樣可拖曳）

---

## 5. SQL Migration

**檔案**: `database/migrations/003_site_content_and_popup.sql`

```sql
-- site_content 資料表
CREATE TABLE IF NOT EXISTS site_content (...)
-- site_popups 資料表
CREATE TABLE IF NOT EXISTS site_popups (...)
-- 觸發器、索引、種子資料
```

⚠️ **需手動執行**: 此 migration 腳本需在 PostgreSQL 中手動運行。

---

## 📁 檔案變更清單

### 新增檔案（4 個）

| 檔案                                                 | 行數 | 說明                     |
| ---------------------------------------------------- | ---- | ------------------------ |
| `database/migrations/003_site_content_and_popup.sql` | ~65  | SQL Migration            |
| `backend/routes/content.ts`                          | ~290 | Content + Popup REST API |
| `frontend/src/services/content.service.ts`           | ~170 | TypeScript API Client    |
| `frontend/src/components/sections/HomePopup.tsx`     | ~140 | 首頁彈窗元件             |

### 修改檔案（7 個）

| 檔案                                         | 變更                           |
| -------------------------------------------- | ------------------------------ |
| `backend/index.ts`                           | 註冊 `/api/content` 路由       |
| `frontend/src/pages/admin/AdminContent.tsx`  | 完全重寫：靜態 → DB 連動雙 Tab |
| `frontend/src/pages/Home.tsx`                | 加入 `<HomePopup />`           |
| `frontend/src/services/video.service.ts`     | 新增 `reorder()` 方法          |
| `frontend/src/pages/admin/AdminVideos.tsx`   | 完全重寫：拖曳排序 + 卡片檢視  |
| `frontend/src/pages/admin/AdminArticles.tsx` | 加入 ViewMode 卡片檢視切換     |
| `frontend/src/pages/admin/AdminCourses.tsx`  | 加入 ViewMode 卡片檢視切換     |

---

## ✅ 驗證結果

| 檔案                 | TypeScript 錯誤                     |
| -------------------- | ----------------------------------- |
| AdminVideos.tsx      | ✅ 0 errors                         |
| AdminArticles.tsx    | ✅ 0 errors                         |
| AdminCourses.tsx     | ✅ 0 errors                         |
| AdminContent.tsx     | ✅ 0 errors                         |
| HomePopup.tsx        | ✅ 0 errors（已修復 logger import） |
| content.service.ts   | ✅ 0 errors                         |
| content.ts (backend) | ✅ 0 errors                         |
| index.ts (backend)   | ✅ 0 errors                         |
| Home.tsx             | ✅ 0 errors                         |
| video.service.ts     | ✅ 0 errors                         |
