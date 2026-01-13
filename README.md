# 🏋️ Coach Aaron 健身教練網站

> 現代化的健身教練個人網站 - 集課程管理、會員系統、影片分享於一身

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)

---

## 📋 目錄

- [專案簡介](#專案簡介)
- [功能特色](#功能特色)
- [技術棧](#技術棧)
- [專案架構](#專案架構)
- [安裝與設定](#安裝與設定)
- [開發指南](#開發指南)
- [部署](#部署)
- [API 文件](#api-文件)
- [資料庫設計](#資料庫設計)
- [安全性](#安全性)
- [問題排查](#問題排查)
- [貢獻指南](#貢獻指南)
- [版本記錄](#版本記錄)

---

## 專案簡介

Coach Aaron 健身教練網站是一個全端 Web 應用程式，提供：

- 🎓 **線上課程管理** - 課程購買、學習進度追蹤
- 👤 **會員系統** - 註冊、登入、個人資料管理
- 📹 **短影音分享** - Instagram Reels 整合
- 🔐 **管理後台** - 會員管理、課程管理、權限控制
- 🖼️ **私密相簿** - 基於權限的私密內容存取

---

## 功能特色

### 🎯 核心功能

#### 使用者端

- ✅ 註冊 / 登入 / 登出
- ✅ 個人資料管理
- ✅ 瀏覽課程與購買
- ✅ 觀看短影音（Instagram Reels）
- ✅ 阿倫私密相簿（需權限）
- ✅ 訂單管理與查詢

#### 管理員端

- ✅ **總覽儀表板** - 統計數據一目了然
- ✅ **會員管理** - 查看、編輯、停用會員
- ✅ **課程管理** - CRUD 操作
- ✅ **影片管理** - 新增、排序、隱藏影片
- ✅ **白名單管理** - Email/手機雙重白名單系統

### 🔒 權限控制

1. **管理員白名單**

   - Email: `ken158ken@gmail.com`（預設管理員）
   - 可透過後台新增其他管理員

2. **私密相簿權限**
   - 僅 `sex: true` 的使用者可存取
   - 由管理員控制此欄位

---

## 技術棧

### 前端

- **框架**: React 18 + Vite 5
- **樣式**: TailwindCSS 3 + PostCSS
- **路由**: React Router v6
- **狀態管理**: Context API
- **圖示**: React Icons
- **HTTP Client**: Axios

### 後端

- **執行環境**: Node.js 18+
- **框架**: Express.js 4
- **認證**: JWT + bcrypt
- **資料庫**: Supabase (PostgreSQL)
- **安全性**: CORS, Cookie-parser, dotenv

### 資料庫

- **平台**: Supabase
- **類型**: PostgreSQL 15+
- **安全性**: Row Level Security (RLS)
- **特色**: 即時訂閱、Storage、Auth

### 開發工具

- **版本控制**: Git + GitHub
- **部署**: Vercel
- **套件管理**: npm
- **程式碼風格**: ESLint

---

## 專案架構

```
coach-aaron-test/
├── frontend/                   # React 前端應用
│   ├── src/
│   │   ├── components/        # React 組件
│   │   │   ├── ui/           # 可重用 UI 組件
│   │   │   └── admin/        # 管理員專用組件
│   │   ├── pages/            # 頁面組件
│   │   │   └── admin/        # 管理後台頁面
│   │   ├── context/          # Context API
│   │   ├── lib/              # 工具函數
│   │   ├── data/             # 靜態資料
│   │   └── assets/           # 靜態資源
│   ├── public/               # 公開檔案
│   └── package.json
│
├── backend/                    # Express 後端 API
│   ├── config/               # 配置檔案
│   │   └── supabase.js      # Supabase 客戶端
│   ├── routes/               # API 路由
│   │   ├── auth.js          # 認證路由
│   │   ├── courses.js       # 課程路由
│   │   ├── videos.js        # 影片路由
│   │   └── admin.js         # 管理員路由
│   ├── middleware/           # 中介軟體
│   │   └── auth.js          # 認證中介軟體
│   ├── index.js             # 入口檔案
│   └── package.json
│
├── database/                   # 資料庫相關
│   ├── schema.sql            # 資料庫結構
│   └── seed.sql              # 初始資料
│
├── scripts/                    # 工具腳本
│   └── generate-coach-photos.cjs
│
├── REPORTS/                    # 審查報告
│   └── CODE_REVIEW_*.md      # Code Review 報告
│
├── assets/                     # 專案資源
├── vercel.json                # Vercel 部署設定
├── package.json               # 根目錄依賴
└── README.md                  # 本檔案
```

---

## 安裝與設定

### 📋 系統需求

- Node.js 18 或更高版本
- npm 8 或更高版本
- Supabase 帳號（免費方案即可）
- Git

### 🚀 快速開始

#### 1. Clone 專案

```bash
git clone https://github.com/ken158ken/coach-aaron-test.git
cd coach-aaron-test
```

#### 2. 安裝依賴

```bash
# 根目錄
npm install

# 後端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

#### 3. 設定 Supabase

##### 3.1 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 建立新專案
3. 記下 `Project URL` 和 `API Keys`

##### 3.2 執行 SQL Schema

1. 在 Supabase Dashboard 點選 **SQL Editor**
2. 執行 `database/schema.sql` 建立表結構
3. 執行 `database/seed.sql` 匯入初始資料

#### 4. 環境變數設定

##### 後端 `.env` 檔案

```bash
cd backend
cp .env.example .env
```

編輯 `backend/.env`：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
PORT=5000
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **重要**:
>
> - `JWT_SECRET` 至少 32 字元，建議使用隨機生成器
> - `SUPABASE_SERVICE_KEY` 請勿外洩（可繞過 RLS）

##### 前端 `.env` 檔案

```bash
cd frontend
cp .env.example .env
```

編輯 `frontend/.env`：

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 5. 啟動開發伺服器

```bash
# 在根目錄執行（同時啟動前後端）
npm start
```

或分別啟動：

```bash
# 後端（Terminal 1）
cd backend
npm run dev

# 前端（Terminal 2）
cd frontend
npm run dev
```

#### 6. 存取應用

- **前端**: http://localhost:5173
- **後端 API**: http://localhost:5000
- **健康檢查**: http://localhost:5000/api/health

---

## 開發指南

### 📁 新增功能

#### 新增 API 路由

```javascript
// backend/routes/example.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    // 業務邏輯
    res.json({ success: true });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

module.exports = router;
```

在 `backend/index.js` 註冊路由：

```javascript
const exampleRoutes = require("./routes/example");
app.use("/api/example", exampleRoutes);
```

#### 新增前端頁面

```jsx
// frontend/src/pages/NewPage.jsx
import React from "react";

const NewPage = () => {
  return (
    <div>
      <h1>新頁面</h1>
    </div>
  );
};

export default NewPage;
```

在 `App.jsx` 註冊路由：

```jsx
import NewPage from "./pages/NewPage";

<Route path="/new-page" element={<NewPage />} />;
```

### 🎨 UI 組件使用

```jsx
import { Button, Card, LoadingSpinner } from '../components/ui';

<Button variant="primary" onClick={handleClick}>
  點擊我
</Button>

<Card title="標題" subtitle="副標題">
  內容
</Card>

<LoadingSpinner text="載入中..." />
```

### 🔐 認證邏輯

#### 前端

```jsx
import { useAuth } from "../context/AuthContext";

const MyComponent = () => {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user ? (
        <p>歡迎, {user.displayName}</p>
      ) : (
        <button onClick={() => login({ email, password })}>登入</button>
      )}
    </div>
  );
};
```

#### 後端

```javascript
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// 需登入
router.get("/profile", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 需管理員權限
router.get("/admin/users", authenticateToken, requireAdmin, (req, res) => {
  // 只有管理員可存取
});
```

---

## 部署

### Vercel 部署（推薦）

#### 1. 推送到 GitHub

```bash
git add .
git commit -m "feat: initial commit"
git push -u origin main
```

#### 2. 連結 Vercel

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點選 **Import Project**
3. 選擇 GitHub Repository: `ken158ken/coach-aaron-test`
4. Framework Preset: **Other**

#### 3. 設定環境變數

在 Vercel Dashboard → Settings → Environment Variables 加入：

| Key                      | Value                            | 環境       |
| ------------------------ | -------------------------------- | ---------- |
| `SUPABASE_URL`           | `https://xxx.supabase.co`        | Production |
| `SUPABASE_ANON_KEY`      | `eyJxxx...`                      | Production |
| `SUPABASE_SERVICE_KEY`   | `eyJxxx...`                      | Production |
| `JWT_SECRET`             | `your-secret-key`                | Production |
| `VITE_API_URL`           | `https://your-domain.vercel.app` | Production |
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co`        | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJxxx...`                      | Production |

#### 4. 部署

```bash
vercel --prod
```

### 其他部署平台

#### Render / Railway

1. 建立兩個 Service：
   - **Backend** (Node.js)
   - **Frontend** (Static Site)
2. 設定環境變數
3. 部署

---

## API 文件

### 認證 API

#### POST `/api/auth/register`

註冊新使用者

**Request Body**:

```json
{
  "username": "aaron123",
  "email": "aaron@example.com",
  "password": "securePassword123",
  "displayName": "Aaron",
  "phoneNumber": "0912345678"
}
```

**Response**:

```json
{
  "success": true,
  "user": {
    "userId": 1,
    "username": "aaron123",
    "email": "aaron@example.com",
    "displayName": "Aaron",
    "sex": false,
    "isAdmin": false
  }
}
```

#### POST `/api/auth/login`

使用者登入

**Request Body**:

```json
{
  "email": "aaron@example.com",
  "password": "securePassword123"
}
```

**Response**:

```json
{
  "success": true,
  "user": {
    /* 同上 */
  }
}
```

#### POST `/api/auth/logout`

使用者登出

**Response**:

```json
{
  "success": true
}
```

### 課程 API

#### GET `/api/courses`

取得所有已發布課程

**Response**:

```json
[
  {
    "course_id": 1,
    "course_title": "初學者全身燃脂",
    "price": 999,
    "course_thumbnail_url": "https://...",
    "status": "published"
  }
]
```

### 管理員 API

> 所有管理員 API 需要 `authenticateToken` + `requireAdmin`

#### GET `/api/admin/users`

取得所有使用者（分頁）

**Query Params**:

- `page`: 頁碼（預設 1）
- `limit`: 每頁筆數（預設 20）
- `search`: 搜尋關鍵字

**Response**:

```json
{
  "users": [
    /* 使用者陣列 */
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

完整 API 文件請參考 [API.md](docs/API.md)（待補充）

---

## 資料庫設計

### 核心資料表

#### `users` - 使用者表

| 欄位            | 類型         | 說明               |
| --------------- | ------------ | ------------------ |
| `user_id`       | SERIAL       | 主鍵               |
| `username`      | VARCHAR(50)  | 使用者名稱（唯一） |
| `email`         | VARCHAR(255) | Email（唯一）      |
| `password_hash` | VARCHAR(255) | 加密密碼           |
| `sex`           | BOOLEAN      | 私密相簿權限       |
| `is_active`     | BOOLEAN      | 帳號狀態           |

#### `admin_whitelist` - 管理員白名單

| 欄位           | 類型         | 說明         |
| -------------- | ------------ | ------------ |
| `whitelist_id` | SERIAL       | 主鍵         |
| `email`        | VARCHAR(255) | 管理員 Email |
| `phone_number` | VARCHAR(20)  | 管理員手機   |
| `is_active`    | BOOLEAN      | 白名單狀態   |

#### `courses` - 課程表

| 欄位           | 類型          | 說明                     |
| -------------- | ------------- | ------------------------ |
| `course_id`    | SERIAL        | 主鍵                     |
| `course_title` | VARCHAR(255)  | 課程標題                 |
| `price`        | DECIMAL(10,2) | 價格                     |
| `status`       | VARCHAR(20)   | draft/published/archived |

#### `videos` - 短影音表

| 欄位         | 類型         | 說明               |
| ------------ | ------------ | ------------------ |
| `video_id`   | SERIAL       | 主鍵               |
| `title`      | VARCHAR(255) | 影片標題           |
| `url`        | TEXT         | Instagram Reel URL |
| `sort_order` | INTEGER      | 排序順序           |

完整 Schema 請參考 [database/schema.sql](database/schema.sql)

---

## 安全性

### 🔒 已實作的安全措施

1. **密碼加密**: bcrypt（10 rounds）
2. **JWT 認證**: HttpOnly Cookie + 7 天有效期
3. **CORS 保護**: 限制允許的 Origins
4. **RLS 政策**: 資料庫層級權限控制
5. **環境變數**: 敏感資訊不寫入程式碼
6. **SQL 注入防護**: 使用 Supabase Query Builder

### ⚠️ 待改進的安全性

根據 [Code Review 報告](REPORTS/CODE_REVIEW_2026-01-13T00-00-00Z.md)：

- [ ] 加入 Rate Limiting（防止暴力攻擊）
- [ ] 實作 CSRF Token
- [ ] 密碼強度檢查
- [ ] 登入失敗次數限制
- [ ] 2FA 雙因素認證

---

## 問題排查

### 常見問題

#### 1. 無法連接 Supabase

**錯誤**: `Error: fetch failed`

**解決方案**:

- 檢查 `.env` 中的 `SUPABASE_URL` 是否正確
- 確認 Supabase 專案狀態（未暫停）
- 檢查網路連線

#### 2. JWT Token 無效

**錯誤**: `Token 無效或已過期`

**解決方案**:

```bash
# 清除瀏覽器 Cookie
# 或重新登入
```

#### 3. 管理員權限不足

**錯誤**: `無管理員權限`

**解決方案**:

```sql
-- 在 Supabase SQL Editor 執行
INSERT INTO admin_whitelist (email, note)
VALUES ('your-email@example.com', '手動新增');
```

#### 4. 前端無法連接後端

**錯誤**: `Network Error`

**解決方案**:

- 確認後端已啟動（`npm run dev`）
- 檢查 `frontend/.env` 中的 `VITE_API_URL`
- 確認 CORS 設定正確

---

## 貢獻指南

### 程式碼風格

- **JavaScript**: 使用 ESLint 規則
- **命名**: camelCase for variables, PascalCase for components
- **縮排**: 2 spaces
- **註解**: 使用 JSDoc 格式

### Commit 訊息規範

```
<type>(<scope>): <subject>

<body>
```

**Type**:

- `feat`: 新功能
- `fix`: 修復 Bug
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置工具或依賴更新

**範例**:

```bash
git commit -m "feat(auth): add 2FA support"
git commit -m "fix(api): resolve CORS issue"
```

### Pull Request 流程

1. Fork 專案
2. 建立 Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit 變更 (`git commit -m 'feat: add amazing feature'`)
4. Push 到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 版本記錄

### v1.0.0 (2026-01-13)

#### ✨ 新功能

- 完整的使用者認證系統（註冊、登入、登出）
- 課程管理與展示
- Instagram Reels 短影音整合
- 管理員後台（使用者、課程、影片、白名單管理）
- 私密相簿權限控制

#### 🗄️ 資料庫

- 建立 9 張核心資料表
- 實作 RLS 政策
- 索引優化

#### 🔧 技術更新

- React 18 + Vite 5
- Express.js 4
- Supabase (PostgreSQL)
- TailwindCSS 3

#### 📝 文件

- 建立 README.md
- Code Review 報告
- API 文件（部分）

---

## 📞 聯絡資訊

- **開發者**: Ken
- **Email**: ken158ken@gmail.com
- **GitHub**: [@ken158ken](https://github.com/ken158ken)

---

## 📄 授權

本專案採用 MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 🙏 致謝

- [Supabase](https://supabase.com/) - 後端服務
- [Vercel](https://vercel.com/) - 部署平台
- [Unsplash](https://unsplash.com/) - 課程縮圖
- [React Icons](https://react-icons.github.io/react-icons/) - 圖示庫

---

**最後更新**: 2026-01-13 (ISO 8601: 2026-01-13T00:00:00Z)
