# Coach Aaron 教練網頁 - React 前端重設計

> 🏋️ 專業健身教練官方網站 - 使用 React + TypeScript + Three.js + GSAP 打造的沉浸式視覺體驗

## 📋 專案概述

此專案是 `coach-aaron-test` 的全新前端視覺設計，採用 **Monorepo 結構** 前後端分離，融合三種精心設計的視覺主題：

| 主題        | 代號    | 配色        | 應用頁面                                                                |
| ----------- | ------- | ----------- | ----------------------------------------------------------------------- |
| 🌊 深海探索 | `abyss` | 青藍 + 紫光 | 首頁 (含 AbyssScene 水母球體背景)                                       |
| 💎 水晶稜鏡 | `prism` | 紫藍色調    | 課程、影片、文章、登入、註冊、結帳等前台頁面 (含 PrismScene 水晶體背景) |
| ✨ 高端質感 | `luxe`  | 金黑組合    | 寫真、會員中心、後台管理                                                |

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
│   │   ├── logger.ts      # 日誌工具
│   │   ├── env.ts         # 環境變數
│   │   └── sanitizer.ts   # 🔐 輸入消毒與安全驗證
│   └── dist/              # 編譯輸出
│
├── database/               # 💾 SQL 腳本
│   ├── schema.sql         # 資料表結構
│   ├── seed.sql           # 種子資料
│   └── *.sql              # 其他 SQL 腳本
│
└── REPORTS/                # 📊 報告文件
```

## 🔐 安全性設計

### 評論系統注入防護 (2026-02-04)

本專案對評論系統（課程評論、文章留言）實施多層防護機制：

#### 防護架構

```
前端 (useSafeInput) → 後端 (sanitizer.ts) → 資料庫 → 輸出消毒
```

#### 防護的攻擊類型

| 攻擊類型  | 防護措施                |
| --------- | ----------------------- |
| XSS       | HTML 實體編碼、標籤移除 |
| HTML 注入 | 所有 HTML 標籤移除      |
| SQL 注入  | 參數化查詢 + 關鍵字偵測 |
| 命令注入  | 危險模式偵測與拒絕      |
| 模板注入  | 模板語法偵測與拒絕      |

#### 安全工具

**後端** (`backend/utils/sanitizer.ts`):

- `sanitizeComment()` - 評論內容消毒
- `sanitizeRating()` - 評分驗證
- `sanitizeId()` - ID 格式驗證
- `logSecurityEvent()` - 安全事件記錄

**前端** (`frontend/src/hooks/useSafeInput.ts`):

- `useSafeInput()` - 安全文字輸入 Hook
- `useRatingInput()` - 安全評分輸入 Hook
- `renderSafeContent()` - 安全渲染用戶生成內容

詳細資訊請參考: [REPORTS/SECURITY_INPUT_SANITIZATION_2026-02-04T12-00-00Z.md](./REPORTS/SECURITY_INPUT_SANITIZATION_2026-02-04T12-00-00Z.md)

## 🔍 全域搜尋功能 (2026-02-04 新增)

### 功能特點

- **快捷鍵啟動**: `Ctrl+K` (Windows) / `Cmd+K` (Mac)
- **即時搜尋**: 300ms debounce，輸入即搜尋
- **搜尋範圍**: 課程、文章、評論、評價
- **鍵盤導航**: ↑↓ 選擇結果，Enter 跳轉

### 搜尋 API

```
GET /api/search?q=關鍵字
```

**回傳格式：**

```json
{
  "results": [
    {
      "id": "1",
      "type": "course",
      "title": "課程標題",
      "description": "課程描述...",
      "url": "/courses/1"
    }
  ],
  "total": 10
}
```

### 安全措施

- 輸入經過 `sanitizeSearchQuery()` 消毒
- 移除 SQL 通配符、HTML 標籤、危險字元
- 最大搜尋長度限制 100 字元

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

| 路由               | 頁面         |
| ------------------ | ------------ |
| `/admin/dashboard` | 儀表板       |
| `/admin/courses`   | 單堂課程管理 |
| `/admin/articles`  | 文章管理     |
| `/admin/videos`    | 影片管理     |
| `/admin/users`     | 用戶管理     |
| `/admin/whitelist` | 白名單管理   |

### 獨立編輯器頁面 (全螢幕)

| 路由                       | 頁面     |
| -------------------------- | -------- |
| `/admin/articles/new`      | 新增文章 |
| `/admin/articles/:id/edit` | 編輯文章 |
| `/admin/courses/new`       | 新增課程 |
| `/admin/courses/:id/edit`  | 編輯課程 |

## 📝 編輯器功能 (2026-02-06 更新)

### 文章/課程編輯器特色

- **Tiptap 富文本編輯器** - 簡潔好用，類似 Word 操作
- **localStorage 自動暫存** - 每 30 秒自動儲存，防止意外遺失
- **分類管理功能** - 可直接在編輯器中新增/刪除分類
- **美化對話框** - 使用 `Dialog` 元件取代原生 prompt/alert
- **🆕 可調整大小媒體** - 圖片和 YouTube 影片支援拖曳調整尺寸
- **🆕 嚴格媒體驗證** - 只允許 Cloudinary 圖片和 YouTube 影片
- **🆕 即時媒體預覽** - 插入前預覽圖片和 YouTube 影片
- **🆕 自動 Slug 生成** - 網址代稱從標題自動產生
- **🆕 全寬螢幕編輯** - 側邊欄可收合，最大化編輯空間
- **🆕 發布前預覽** - 使用 Modal 預覽文章最終呈現效果
- **🆕 BubbleMenu 浮動工具列** - 選取文字時自動彈出快速格式化工具
- **🆕 FloatingMenu 空行工具** - 空行時彈出快捷插入工具
- **🆕 @提及功能** - 輸入 @ 可提及 Aaron 教練、營養師等
- **🆕 程式碼語法高亮** - 支援多種程式語言語法著色
- **🆕 字體選擇** - 支援多種中英文字體切換
- **🆕 焦點追蹤** - 編輯區域焦點視覺提示
- **使用說明模態框** - 點擊問號 (?) 圖示查看詳細操作說明
- **標籤系統** - 支援快速新增和移除標籤（按 Enter 新增）
- **離開提醒** - 有未儲存變更時會提醒使用者

### 媒體來源限制

| 媒體類型 | 允許來源   | 說明                                                            |
| -------- | ---------- | --------------------------------------------------------------- |
| 圖片     | Cloudinary | 只接受 `https://res.cloudinary.com/...` 開頭的網址              |
| 影片     | YouTube    | 支援 `youtube.com/watch?v=`、`youtu.be/`、`youtube.com/shorts/` |

### 可調整大小功能

- **拖曳調整** - 滑鼠移至媒體右下角，出現金色手柄後拖曳調整
- **圖片尺寸** - 最小 100px，最大 800px
- **影片尺寸** - 最小 280px，最大 960px，自動維持 16:9 比例
- **即時顯示** - 選中媒體時顯示當前尺寸

### 工具列功能 (全功能版)

#### 基本格式

| 按鈕     | 功能   | 說明                   |
| -------- | ------ | ---------------------- |
| **B**    | 粗體   | 讓文字變粗，強調重點   |
| _I_      | 斜體   | 讓文字傾斜，常用於引用 |
| <u>U</u> | 底線   | 在文字下方加線         |
| ~~S~~    | 刪除線 | 在文字中間加橫線       |
| X₂       | 下標   | 化學式如 H₂O           |
| X²       | 上標   | 數學次方如 E=mc²       |

#### 文字樣式

| 按鈕  | 功能     | 說明                                  |
| ----- | -------- | ------------------------------------- |
| 🔴A▼  | 文字顏色 | 10 種顏色可選                         |
| █H▼   | 螢光標記 | 10 種螢光色可選                       |
| 字體▼ | 字體選擇 | 微軟正黑體、標楷體、Arial、Georgia 等 |

#### 標題與段落

| 按鈕     | 功能 | 說明             |
| -------- | ---- | ---------------- |
| H1/H2/H3 | 標題 | H1 最大，H3 最小 |
| ⬅ ⬛ ➡   | 對齊 | 左中右對齊       |

#### 列表與區塊

| 按鈕     | 功能     | 說明                |
| -------- | -------- | ------------------- |
| • 列表   | 項目符號 | 用圓點條列重點      |
| 1. 列表  | 編號列表 | 用數字條列步驟      |
| ☑ 待辦   | 待辦清單 | 可勾選的核取方塊    |
| ❝ 引言   | 區塊引用 | 縮排引用樣式        |
| </> 程式 | 程式碼塊 | 等寬字型 + 語法高亮 |
| ― 分隔線 | 水平線   | 插入水平分隔線      |

#### 表格功能

| 按鈕    | 功能     | 說明               |
| ------- | -------- | ------------------ |
| ⊞▼ 表格 | 表格選單 | 新增表格、增刪行列 |

#### 媒體與連結

| 按鈕 | 功能 | 說明                     |
| ---- | ---- | ------------------------ |
| 🖼️   | 圖片 | 貼上 Cloudinary 網址插入 |
| 🎬   | 影片 | 貼上 YouTube 網址嵌入    |
| 🔗   | 連結 | 將文字轉換成可點擊連結   |

### 🎯 智慧輔助工具

#### BubbleMenu (選取浮動工具列)

當選取文字時，會自動彈出快速格式化工具：

- **粗體 (B)** - 一鍵設定粗體
- **斜體 (I)** - 快速斜體化
- **底線 (U)** - 加入底線
- **刪除線 (S)** - 劃掉文字
- **螢光筆 (H)** - 背景高亮

#### FloatingMenu (空行快捷工具)

在空行時自動顯示，快速插入：

- **大標題 (H1)** - 插入一級標題
- **中標題 (H2)** - 插入二級標題
- **項目符號 (•)** - 開始無序列表
- **編號列表 (1.)** - 開始有序列表
- **引言 (❝)** - 插入引用區塊

#### @提及建議

輸入 `@` 時彈出建議選單：

- Aaron 教練
- 營養師
- 學員
- 健身房
- 教練團隊

### Tiptap 擴展列表 (完整免費版)

**基礎套件** (StarterKit 內建)

- Bold, Italic, Strike, Code
- Heading, Paragraph, Text
- BulletList, OrderedList, ListItem
- Blockquote, HorizontalRule
- Document, HardBreak
- History (Undo/Redo)

**新增的免費擴展**

- `@tiptap/extension-underline` - 底線
- `@tiptap/extension-text-align` - 文字對齊
- `@tiptap/extension-link` - 超連結
- `@tiptap/extension-placeholder` - 佔位文字
- `@tiptap/extension-text-style` - 文字樣式基礎
- `@tiptap/extension-color` - 文字顏色
- `@tiptap/extension-highlight` - 螢光標記 (多色)
- `@tiptap/extension-subscript` - 下標
- `@tiptap/extension-superscript` - 上標
- `@tiptap/extension-table` - 表格
- `@tiptap/extension-table-row` - 表格列
- `@tiptap/extension-table-cell` - 表格儲存格
- `@tiptap/extension-table-header` - 表格標頭
- `@tiptap/extension-task-list` - 待辦清單
- `@tiptap/extension-task-item` - 待辦項目
- `@tiptap/extension-character-count` - 字數統計 (最多 50,000 字)
- `@tiptap/extension-typography` - 排版自動修正
- `@tiptap/extension-dropcursor` - 拖曳游標提示
- `@tiptap/extension-gapcursor` - 間隙游標
- `@tiptap/extension-mention` - @提及功能
- `@tiptap/extension-bubble-menu` - 選取浮動工具列
- `@tiptap/extension-floating-menu` - 空行快捷工具
- `@tiptap/extension-focus` - 焦點追蹤
- `@tiptap/extension-font-family` - 字體選擇
- `@tiptap/extension-code-block-lowlight` - 程式碼語法高亮
- `lowlight` - 語法高亮引擎

**自訂擴展**

- `ResizableImage` - 可調整大小的圖片
- `ResizableYoutube` - 可調整大小的 YouTube 影片

### 購物流程

| 路由                | 頁面     |
| ------------------- | -------- |
| `/checkout`         | 結帳頁面 |
| `/checkout/success` | 結帳成功 |

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

## 🌓 日夜模式 & 🌐 多語言支援 (2025-01-28 新增)

### 日夜模式 (Dark/Light Mode)

- **全域切換**: 前台 Navbar 和後台 AdminLayout 都有切換按鈕
- **localStorage 記憶**: 使用者偏好會被儲存，下次訪問自動套用
- **DaisyUI 主題整合**: 每個視覺主題都有對應的亮色版本
  - `luxe` ↔ `luxe-light`
  - `abyss` ↔ `abyss-light`
  - `prism` ↔ `prism-light`
- **CSS 變數系統**: 所有主題顏色通過 CSS 變數控制，支援動態切換
  - 深色模式: 在 `:root` 中定義預設值
  - 淺色模式: 通過 `[data-color-mode="light"]` 選擇器覆蓋

### CSS 主題變數一覽

| 變數名稱         | 深色值    | 淺色值    | 用途          |
| ---------------- | --------- | --------- | ------------- |
| `--luxe-bg`      | `#0a0a0a` | `#ffffff` | 頁面背景      |
| `--luxe-surface` | `#141414` | `#f8f8f8` | 卡片/區塊背景 |
| `--luxe-text`    | `#e0e0e0` | `#1a1a1a` | 主要文字      |
| `--luxe-muted`   | `#888888` | `#555555` | 次要文字      |
| `--luxe-gold`    | `#d4af37` | `#b8962b` | 強調色        |

### 語言切換 (繁體中文 / English)

- **全域 i18n**: 支援繁體中文 (zh-TW) 和英文 (en)
- **Context 管理**: 使用 `LanguageContext` 統一管理
- **localStorage 記憶**: 語言偏好會被儲存
- **翻譯內容**: 導覽列、按鈕、提示訊息等

### 使用方式

```tsx
// 在元件中使用日夜模式
import { useTheme } from "@/context";
const { isDark, toggleColorMode } = useTheme();

// 在元件中使用語言切換
import { useLanguage } from "@/context";
const { language, toggleLanguage, t } = useLanguage();
// t.nav.home => "首頁" 或 "Home"
```

### 切換按鈕位置

| 位置             | 日夜模式按鈕 | 語言切換按鈕 |
| ---------------- | ------------ | ------------ |
| 前台 Navbar      | ☀️/🌙 圖示   | EN/中 按鈕   |
| 後台 AdminLayout | ☀️/🌙 圖示   | EN/中 按鈕   |

---

**最後更新**: 2026-01-20T14-00-00+08:00

## 🧱 區塊編輯器 (Block Editor)

全新拖曳式視覺編輯器，讓不懂程式的人也能輕鬆排版！

### 功能特色

| 功能          | 說明                               |
| ------------- | ---------------------------------- |
| **拖曳移動**  | 自由拖曳區塊到任意位置             |
| **調整大小**  | 拖曳邊角調整區塊尺寸               |
| **旋轉**      | 支援區塊自由旋轉                   |
| **雙擊編輯**  | 雙擊文字區塊進入即時編輯模式       |
| **文繞圖**    | 圖片支援 left/right 浮動模式       |
| **復原/重做** | Ctrl+Z / Ctrl+Y 支援 50 步歷史記錄 |
| **網格吸附**  | 可開關網格輔助對齊                 |
| **圖層管理**  | 可調整區塊前後層次                 |
| **鎖定功能**  | 鎖定區塊防止誤動                   |

### 區塊類型

| 類型         | 用途     | 特殊功能                                     |
| ------------ | -------- | -------------------------------------------- |
| **文字區塊** | 段落內容 | Tiptap 富文本編輯 (粗體/斜體/底線/標題/對齊) |
| **圖片區塊** | 配圖展示 | 僅限 Cloudinary URL，支援文繞圖              |
| **影片區塊** | 影片嵌入 | 僅限 YouTube，自動解析 URL                   |
| **分隔線**   | 段落分隔 | 可調整寬度和樣式                             |
| **空白區**   | 留白間距 | 可調整高度                                   |

### 快捷鍵

| 快捷鍵   | 功能           |
| -------- | -------------- |
| `Ctrl+Z` | 復原           |
| `Ctrl+Y` | 重做           |
| `Ctrl+D` | 複製選取的區塊 |
| `Delete` | 刪除選取的區塊 |
| `Escape` | 取消選取       |

### 檔案結構

```
frontend/src/components/ui/block-editor/
├── types.ts              # 區塊類型定義
├── reducer.ts            # 狀態管理 (含 undo/redo)
├── utils.ts              # 工具函數 (匯出 HTML/JSON)
├── BlockEditor.tsx       # 主編輯器元件
├── index.ts              # 模組匯出
└── blocks/
    ├── TextBlockComponent.tsx   # 文字區塊 (整合 Tiptap)
    ├── ImageBlockComponent.tsx  # 圖片區塊
    ├── VideoBlockComponent.tsx  # YouTube 影片區塊
    ├── DividerBlockComponent.tsx # 分隔線區塊
    └── index.ts
```

### 使用套件

- **react-moveable**: 拖曳、調整大小、旋轉
- **@tiptap/react**: 富文本編輯
- **uuid**: 唯一識別碼生成

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

### 2026-02-06 - 資料庫 Migration 後前端修正

#### 🐛 問題修復

- **資料庫型別變更**: 執行 migration 002 後，`course_keywords`, `article_keywords`, `course_category`, `article_category` 從 `TEXT[]` 改為 `TEXT`（逗號分隔）
- **Type 定義修正**: 更新 `content.ts` 中 Course 和 Article 介面，將 keywords 和 category 改為 `string`
- **Service 層轉換**: `course.service.ts` 將 `course_keywords` 自動 split 成陣列給前端別名 `keywords`
- **ArticleDetail 修正**: SEOHead 和 keywords 顯示改用 `split()` 處理逗號分隔字串
- **管理後台修正**: AdminCourses 和 AdminArticles 的 `openEditModal` 正確處理資料庫欄位

#### 📄 相關文件

- 完整報告：[REPORTS/DATABASE_MIGRATION_FIX_2026-02-06T18-00-00+08-00.md](REPORTS/DATABASE_MIGRATION_FIX_2026-02-06T18-00-00+08-00.md)

---

### 2026-02-04 - Tiptap 編輯器全功能升級

#### 🎨 新增 Tiptap 擴展

安裝並整合 17 個新擴展，大幅增強文字編輯能力：

| 擴展類型 | 功能                                          |
| -------- | --------------------------------------------- |
| 文字樣式 | TextStyle, Color (10色), Highlight (多色螢光) |
| 文字格式 | Strike, Subscript, Superscript                |
| 區塊元素 | Blockquote, CodeBlock, HorizontalRule         |
| 表格功能 | Table, TableRow, TableCell, TableHeader       |
| 待辦清單 | TaskList, TaskItem (支援巢狀)                 |
| 輔助功能 | CharacterCount, Typography                    |

#### 🖼️ 全寬螢幕編輯介面

- **可收合側邊欄**: 點擊按鈕收起右側表單區域，最大化編輯空間
- **響應式工具列**: 工具按鈕分群組排列，所有按鈕都有 title 懸停提示

#### 📋 發布前預覽功能

- **新增 ArticlePreviewModal 元件**: 使用 React Portal 實現模態框
- **dangerouslySetInnerHTML 渲染**: 預覽最終 HTML 輸出效果
- **預覽資訊包含**: 標題、分類、摘要、封面圖、完整內容

#### 🔧 SSR 相容性修正

- **具名匯入修正**: 將 default import 改為 named import
- **immediatelyRender: false**: 解決 Tiptap SSR hydration 問題
- **StarterKit 整合**: 使用內建擴展減少重複配置

---

### 2026-02-02 - 區塊編輯器權限保護與導航優化

#### 🔒 安全性增強

- **ArticleEditor**: 新增 `useAuth` 權限檢查，未登入重導至登入頁，非管理員重導至首頁
- **CourseEditor**: 新增相同的權限保護機制
- **載入狀態**: 權限檢查期間顯示 Loading 畫面

#### 🔗 導航流程優化

- **AdminArticles**: 新增「新增文章 →」按鈕連結到拖曳式編輯器
- **AdminArticles**: 編輯按鈕改為連結到拖曳式編輯器，保留「快速編輯」使用 Modal
- **AdminCourses**: 新增「新增課程 →」按鈕連結到課程編輯器
- **AdminCourses**: 編輯按鈕改為連結到課程編輯器，保留「快速編輯」使用 Modal

---

### 2026-01-28 - 區塊編輯器 (Block Editor) 全新功能

#### 🧱 核心功能

| 功能             | 說明                                             |
| ---------------- | ------------------------------------------------ |
| **拖曳式排版**   | 使用 react-moveable 實現自由拖曳、調整大小、旋轉 |
| **即時文字編輯** | 雙擊文字區塊直接編輯，整合 Tiptap 富文本編輯器   |
| **多種區塊類型** | 文字、圖片、YouTube 影片、分隔線、空白區         |
| **歷史記錄**     | Undo/Redo 支援 50 步歷史                         |
| **網格吸附**     | 可開關網格輔助對齊                               |
| **匯出格式**     | JSON (儲存) + HTML (預覽/發布)                   |

#### 📝 文章編輯器 (`/admin/articles/new`)

- **獨立全螢幕頁面**: 含權限保護，非管理員無法存取
- **左側 Meta 面板**: 標題、Slug、摘要、分類、標籤、封面圖片、狀態
- **中央編輯畫布**: 區塊拖曳式編輯器
- **預覽模式**: 即時預覽發布後效果
- **自動儲存提醒**: 離開頁面前提醒未儲存變更

#### 📚 課程編輯器 (`/admin/courses/new`)

- **課程資訊 / 章節內容 雙模式**: 切換編輯基本資訊或章節內容
- **章節管理**: 新增、刪除、排序章節
- **免費試看標記**: 可設定特定章節為免費試看
- **每章獨立編輯**: 各章節使用獨立的區塊編輯器
- **課程大綱預覽**: 快速預覽課程結構

#### 📦 新增套件

```bash
npm install react-moveable moveable @scena/react-guides uuid
```

### 2026-01-27 - 後台管理系統大幅升級

#### 🆕 新增組件

| 組件               | 說明                                          |
| ------------------ | --------------------------------------------- |
| **TagInput**       | 標籤輸入元件，Enter 新增、點擊 X 刪除         |
| **RichTextEditor** | Tiptap 富文本編輯器，支援 Cloudinary、YouTube |

#### 📝 AdminArticles 升級

- **標籤輸入**: 分類和關鍵字改用 TagInput，支援多標籤
- **富文本編輯**: 內容編輯改用 Tiptap，支援圖片、影片、文字格式
- **Cloudinary 驗證**: 自動驗證圖片網址必須來自 Cloudinary
- **YouTube 嵌入**: 支援直接嵌入 YouTube 影片
- **SEO 關鍵字**: 新增關鍵字欄位，用於搜尋引擎優化

#### 📦 AdminCourses 升級

- **按鈕改名**: 「新增課程」→「新增單堂課程」
- **標籤輸入**: 分類和關鍵字改用 TagInput
- **富文本編輯**: 課程詳細內容改用 Tiptap
- **完整 CRUD**: 新增、編輯、刪除功能完善
- **錯誤處理**: 完善錯誤訊息和日誌

#### 📋 AdminWhitelist 簡化

- **只需 Email**: 移除手機號碼欄位，白名單只需填寫 Email
- **Email 驗證**: 自動驗證 Email 格式
- **表格簡化**: 移除手機號碼欄位顯示

#### 💳 結帳流程 (新增)

- **Checkout 頁面**: 完整結帳流程，選擇付款方式
- **支援金流**: LINE Pay、藍新金流、綠界科技、街口支付、Apple Pay、Google Pay
- **CheckoutSuccess**: 付款成功頁面

#### 📊 資料庫遷移

- **course_packages**: 課程組合方案表
- **package_courses**: 組合方案內容關聯表
- **user_packages**: 用戶購買記錄表

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

---

## 📝 更新日誌

### 2026-02-06 - 課程管理功能對齊修正

#### 資料庫 Schema 修正

- **新增欄位**:
  - `courses.course_level` (課程難度: beginner/intermediate/advanced)
  - `courses.lessons_count` (課堂數)
- **型態修正**:
  - `course_keywords`: TEXT[] → TEXT (逗號分隔)
  - `article_keywords`: TEXT[] → TEXT (逗號分隔)
  - `course_category`: VARCHAR(100) → TEXT
  - `article_category`: VARCHAR(100) → TEXT

#### 後端 API 修正

- **統一命名**: POST/PUT `/api/courses` 使用底線命名（course_title, course_slug 等）
- **新增欄位支援**: course_level 欄位處理
- **別名支援**: category/keywords 自動映射到 course_category/course_keywords

#### 前端修正

- **AdminCourses**: 修正 API 請求欄位名稱，與後端對齊
- **Modal 版面**: 確認使用 `size="xl"` 與 AdminArticles 一致
- **共用元件**: 確認 RichTextEditor 為共用元件（已從 `@/components/ui` 導出）

#### Migration 檔案

- 新增 `database/migrations/002_add_course_level_and_fix_keywords.sql`
- 自動轉換現有 TEXT[] 資料為 TEXT 格式

#### 完整報告

- 詳見 `REPORTS/COURSE_MANAGEMENT_ALIGNMENT_2026-02-06T14-30-00+08-00.md`

---
