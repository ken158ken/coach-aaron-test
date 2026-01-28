# Coach Aaron 教練網頁 - React 前端重設計

> 🏋️ 專業健身教練官方網站 - 使用 React + TypeScript + Three.js + GSAP 打造的沉浸式視覺體驗

## 📋 專案概述

此專案是 `coach-aaron-test` 的全新前端視覺設計，採用 **Monorepo 結構** 前後端分離，融合三種精心設計的視覺主題：

| 主題        | 代號    | 配色        | 應用頁面         |
| ----------- | ------- | ----------- | ---------------- |
| 🌊 深海探索 | `abyss` | 青藍 + 紫光 | 首頁             |
| 💎 水晶稜鏡 | `prism` | 紫藍色調    | 課程、影片       |
| ✨ 高端質感 | `luxe`  | 金黑組合    | 寫真、聯絡、後台 |

## 🚀 快速開始

### 一鍵安裝所有依賴

```bash
npm run install:all
```

### 同時啟動前後端開發伺服器

```bash
npm start
```

### 分別啟動

```bash
# 前端開發
npm run frontend

# 後端開發 (另開終端)
npm run backend
```

### 建構生產版本

```bash
npm run build
```

## 🛠️ 技術棧

### 前端 (frontend/)

- **框架**: React 18 + TypeScript 5.x
- **建構工具**: Vite 5.x (支援 SSR)
- **樣式**: TailwindCSS 3.x + DaisyUI 4.x
- **路由**: React Router 6.x
- **3D 動畫**: Three.js r160+
- **DOM 動畫**: GSAP 3.x
- **HTTP 客戶端**: Axios
- **SEO**: react-helmet-async

### 後端 (backend/)

- **框架**: Express 5.x + TypeScript
- **資料庫**: Supabase (PostgreSQL)
- **驗證**: JWT + bcryptjs
- **開發工具**: tsx (TypeScript 執行器)

### 部署

- **平台**: Vercel Serverless Functions
- **SSR**: api/ssr.js (前端伺服端渲染)
- **API**: api/server.js (後端 API 代理)

## 📁 專案結構 (Monorepo)

```
coach-aaron-redesign/
├── package.json            # 根目錄 - Monorepo 腳本
├── vercel.json             # Vercel 部署設定
├── api/                    # Vercel Serverless Functions
│   ├── server.js          # 後端 API 代理
│   └── ssr.js             # SSR 渲染處理
│
├── frontend/               # 📱 前端應用
│   ├── package.json       # 前端依賴
│   ├── vite.config.ts     # Vite 設定
│   ├── index.html         # HTML 入口
│   ├── src/               # 原始碼
│   │   ├── components/    # 元件
│   │   ├── pages/         # 頁面
│   │   ├── services/      # API 服務
│   │   ├── types/         # TypeScript 類型
│   │   ├── context/       # React Context
│   │   ├── entry-server.tsx  # SSR 入口
│   │   └── entry-client.tsx  # 客戶端 hydration
│   ├── public/            # 靜態資源
│   └── dist/              # 編譯輸出
│       ├── client/        # 客戶端 bundle
│       └── server/        # SSR bundle
│
├── backend/                # ⚙️ 後端 API
│   ├── package.json       # 後端依賴
│   ├── tsconfig.json      # TypeScript 設定
│   ├── index.ts           # 入口點
│   ├── config/            # 設定檔
│   ├── routes/            # API 路由
│   ├── middleware/        # 中介軟體
│   ├── utils/             # 工具函數
│   └── dist/              # 編譯輸出
│
├── database/               # 💾 SQL 腳本
│   ├── schema.sql         # 資料表結構
│   ├── seed.sql           # 種子資料
│   └── *.sql              # 其他 SQL 腳本
│
└── REPORTS/                # 📊 報告文件
```

## 🎯 頁面路由

### 前台頁面

| 路由              | 頁面     | 主題  |
| ----------------- | -------- | ----- |
| `/`               | 首頁     | abyss |
| `/courses`        | 課程列表 | prism |
| `/courses/:id`    | 課程詳情 | prism |
| `/articles`       | 文章列表 | prism |
| `/articles/:slug` | 文章詳情 | prism |
| `/videos`         | 影片列表 | prism |
| `/coach-photos`   | 教練寫真 | luxe  |
| `/contact`        | 聯絡頁面 | luxe  |
| `/login`          | 登入頁面 | luxe  |

### 後台頁面

| 路由               | 頁面       |
| ------------------ | ---------- |
| `/admin/dashboard` | 儀表板     |
| `/admin/courses`   | 課程管理   |
| `/admin/articles`  | 文章管理   |
| `/admin/videos`    | 影片管理   |
| `/admin/users`     | 用戶管理   |
| `/admin/whitelist` | 白名單管理 |

## 🔧 環境變數

### 前端 (frontend/.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SITE_URL=http://localhost:5173
```

### 後端 (backend/.env)

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## 📦 部署到 Vercel

1. 連接 GitHub 倉庫到 Vercel
2. 設定環境變數
3. 專案會自動根據 `vercel.json` 設定進行部署

### Vercel 設定說明

- **buildCommand**: 先建構後端，再建構前端
- **outputDirectory**: `frontend/dist/client` (前端靜態檔案)
- **SSR**: 透過 `api/ssr.js` 處理所有前端路由
- **API**: 透過 `api/server.js` 代理後端 API

## 📝 開發腳本

| 指令                  | 說明               |
| --------------------- | ------------------ |
| `npm start`           | 同時啟動前後端     |
| `npm run frontend`    | 啟動前端開發伺服器 |
| `npm run backend`     | 啟動後端開發伺服器 |
| `npm run build`       | 建構生產版本       |
| `npm run install:all` | 安裝所有依賴       |

---

**最後更新**: 2026-01-25T16-30-00Z

## 📱 RWD 響應式設計

所有頁面均支援響應式設計，採用 TailwindCSS 的斷點系統：

| 斷點 | 寬度     | 裝置類型        |
| ---- | -------- | --------------- |
| 默認 | < 640px  | 手機            |
| `sm` | ≥ 640px  | 大型手機/小平板 |
| `md` | ≥ 768px  | 平板            |
| `lg` | ≥ 1024px | 筆電            |
| `xl` | ≥ 1280px | 桌面            |

### 前台頁面 RWD 特性

- **課程列表**: 響應式網格 (1/2/3 欄)，搜尋框全寬適配
- **影片列表**: 響應式網格 (1/2/3/4 欄)，分頁控制優化
- **教練寫真 (`/coach-photos`)**: 瀑布流佈局 (1/2/3/4 欄)，輪播橫幅，Intersection Observer 懶載入

### 後台頁面 RWD 特性

- **DataTable**: 桌面版表格 / 手機版卡片式列表
- **頁面標題**: 自動堆疊排列 (flex-col → flex-row)
- **搜尋/篩選**: 自動換行，全寬適配小螢幕
- **按鈕**: 手機版全寬，桌面版自適應
- **用戶管理**: 支援私密相簿權限 (sex toggle) 管理

## 🖼️ 教練寫真相簿

### 生成相簿清單

相簿資料存放於 `frontend/src/data/coachPhotos.json`，可透過以下指令重新生成：

```bash
cd frontend
npm run generate:coach-photos
```

### 相簿存放位置

- **圖片資料夾**: `frontend/public/coach-photos/`
- **資料清單**: `frontend/src/data/coachPhotos.json`

### 頁面特性

- **瀑布流佈局**: CSS columns 實現響應式瀑布流 (1/2/3/4 欄)
- **輪播橫幅**: 隨機選取 5 張照片自動輪播
- **懶載入**: Intersection Observer 延遲載入提升效能
- **放大查看**: 點擊照片可全螢幕放大瀏覽

## 📝 更新日誌

### 2025-01-27 - UI/UX Hover 效果全面升級

#### 🎨 按鈕組件 (Buttons)

| 組件           | 新增效果                                                |
| -------------- | ------------------------------------------------------- |
| **GlowButton** | `hover:scale-105`, `active:scale-95`, 增強發光陰影      |
| **PillButton** | `hover:scale-105`, `active:scale-95`, `hover:shadow-lg` |
| **TextButton** | 底線動畫 (`after:` pseudo-element)                      |

#### 🃏 卡片組件 (Cards)

| 組件           | 新增效果                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| **CourseCard** | 已有 `hover:-translate-y-1`                                                  |
| **VideoCard**  | `hover:border-*-accent`, `hover:shadow-lg`, 播放按鈕 `group-hover:scale-110` |
| **StatCard**   | `hover:border-*-accent/60`, `hover:shadow-lg`                                |
| **DataTable**  | 行/卡片 `hover:bg-*/10`, 卡片 `hover:shadow-lg`                              |

#### 📝 表單組件 (Form)

| 組件         | 新增效果                               |
| ------------ | -------------------------------------- |
| **Input**    | `hover:border-*-accent/60-80`          |
| **Textarea** | `hover:border-*-accent/60`             |
| **Select**   | `hover:border-*-accent/50-60`          |
| **Toggle**   | 開啟時 `shadow-md shadow-luxe-gold/30` |

#### 🧭 導航組件 (Navigation)

| 組件           | 新增效果                                               |
| -------------- | ------------------------------------------------------ |
| **Navbar**     | 連結底線動畫, 按鈕 `hover:scale-105`                   |
| **FilterPill** | `hover:scale-105`, `shadow-lg`                         |
| **Pagination** | `hover:scale-110`, active 狀態 `shadow-lg`             |
| **Footer**     | 連結 `hover:translate-x-1`, 社群圖標 `hover:scale-110` |

#### 📄 頁面級別

| 頁面         | 新增效果                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| **Articles** | 文章卡片 `hover:-translate-y-1`, `hover:shadow-xl`, 分頁按鈕 `hover:scale-105` |
| **Contact**  | 資訊卡片 `hover:shadow-lg`, 社群連結 `hover:-translate-y-1`                    |

---

### 2025-01-27 - UI/UX 基礎改進

#### Navbar 優化

- **置中排版**: 添加 `max-w-7xl mx-auto` 容器置中
- **字體放大**: 導航連結從 `text-sm` 改為 `text-base`
- **Hover 動畫**: 新增底線動畫特效，滑鼠懸停時顯示金色底線
- **按鈕特效**: 添加 `hover:scale-105` 縮放動畫

#### Mobile Menu (RWD)

- **背景改善**: 從透明改為 `bg-luxe-bg/95 backdrop-blur-md`
- **圓角邊框**: 添加 `rounded-lg` 提升視覺質感

#### Modal/Dialog/Drawer 優化

- **遮罩強化**: 背景從 `bg-black/50-70` 改為 `bg-black/70-80`
- **模糊效果**: 從 `backdrop-blur-sm` 升級為 `backdrop-blur-md`
- 影響元件: Modal, ConfirmDialog, Drawer, AdminContent, AdminWhitelist

#### FilterPill 組件修復

- **文字可讀性**: 將 active 狀態的文字從 `text-*-bg` 改為 `text-black`
- **字重強化**: 添加 `font-semibold` 增強對比
- **陰影效果**: 新增 `shadow-lg shadow-*-accent/30` 立體感
- 影響頁面: Courses (prism 主題)

#### 分類按鈕修復

- **Articles 頁面**: 修正分類按鈕配色，使用 `text-luxe-black` 確保可讀性
- **hover 狀態**: 添加 `hover:border-luxe-gold/50` 邊框效果

#### Select 下拉選單修復

- **AdminArticles**: 修復 option 背景色為 `bg-luxe-bg`
