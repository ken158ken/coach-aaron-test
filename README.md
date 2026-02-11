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
│   │   ├── utils/         # 工具函數 (含 contentTemplates.ts 範本)
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
│   ├── migrations/        # 遷移腳本
│   │   ├── 003_site_content_and_popup.sql   # 內容管理 + 彈窗
│   │   └── 004_content_templates.sql        # 預設文案範本
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

### 2026-02-12 - 預設文案範本系統 / SSR 全域修復

#### 📋 預設文案範本系統 (Template System)

- **`004_content_templates.sql` 新增 Migration**：建立 `content_templates` 表，含 15 組預設範本（hero_title ×5、hero_subtitle ×5、about_coach ×5）
- **範本資料來源**：教練雜資料.md（阿倫教官行銷素材 — NSCA/TQUK/NLP 證照、130+ 教練培訓、銷售心理學定位）
- **`contentTemplates.ts` 前端範本工具**：`getRandomTemplate(key)` 隨機取範本、`getTemplates(key)` 取全部、`ContentTemplate` 介面
- **HeroSection / CoachIntroSection 隨機 fallback**：DB 無自定義內容（null 或空白）時，`useState(() => getRandomTemplate(...))` 隨機套用範本
- **AdminContent Modal 範本選擇器**：`TemplatePicker` 元件，編輯/新增文案 Modal 皆可快速套用範本，含 tooltip 預覽

#### 🔧 SSR 全域修復 (Vercel 部署)

- **根因分析**：`api/ssr.js` 中 `path.resolve(process.cwd(), "index.html")` 找不到檔案 — Vercel 的 `outputDirectory` 僅將檔案作為 CDN 靜態資源，不會放在 serverless 函數的 `process.cwd()` 根目錄
- **`vercel.json` 修復**：`includeFiles` 從單一檔案改為 `{frontend/dist/server/**,frontend/dist/client/index.html}`，確保 SSR 函數可存取 index.html 和所有 server bundle
- **`api/ssr.js` 完全重寫**：多路徑候選搜尋（`findFile()` 工具函數）、支援 `<!--ssr-outlet-->` 和 `<div id="root"></div>` 兩種注入方式、增強偵錯日誌
- **`vite.config.ts` 修正**：`mode === "ssr"` 改為 `isSsrBuild`（Vite 5 正式 API），確保 SSR 構建配置正確套用
- **`entry-server.tsx` 錯誤處理**：`render()` 函數加入 try-catch，SSR 渲染失敗時回傳空 HTML 讓 CSR 接管
- **CSR fallback 鏈**：SSR render 失敗 → 回傳空 HTML 由客戶端接管；找不到 entry-server.js → 回傳純靜態 index.html

#### 📄 新增/修改檔案

| 操作 | 檔案                                                                     |
| ---- | ------------------------------------------------------------------------ |
| 新增 | `database/migrations/004_content_templates.sql`                          |
| 新增 | `frontend/src/utils/contentTemplates.ts`                                 |
| 修改 | `api/ssr.js` — SSR handler 完全重寫                                      |
| 修改 | `vercel.json` — includeFiles 修正                                        |
| 修改 | `frontend/vite.config.ts` — isSsrBuild 偵測修正                          |
| 修改 | `frontend/src/entry-server.tsx` — 加入 try-catch 錯誤處理                |
| 修改 | `frontend/src/components/sections/HeroSection.tsx` — 隨機 fallback       |
| 修改 | `frontend/src/components/sections/CoachIntroSection.tsx` — 隨機 fallback |
| 修改 | `frontend/src/pages/admin/AdminContent.tsx` — TemplatePicker 範本選擇器  |

#### 📄 相關文件

- 完整報告：[REPORTS/TEMPLATE_AND_SSR_FIX_2026-02-12T18-00-00+08-00.md](REPORTS/TEMPLATE_AND_SSR_FIX_2026-02-12T18-00-00+08-00.md)

---

### 2026-02-11 - 內容管理活化 / 首頁彈窗 / 影片拖曳排序 / 卡片檢視切換

#### 🗄️ 內容管理活化 (AdminContent + DB)

- **SQL Migration** `003_site_content_and_popup.sql`：`site_content` + `site_popups` 兩張新資料表
- **Backend `content.ts` 路由**：完整 CRUD（公開 + Admin），彈窗啟用時自動停用其他
- **前端 `content.service.ts`**：TypeScript API Client，含 `SiteContent` / `SitePopup` 介面
- **AdminContent 全面重寫**：雙 Tab（📝 網站文案 / 🪟 首頁彈窗），DB 連動 CRUD，RichTextEditor 編輯彈窗

#### 🪟 首頁自定義彈窗系統 (HomePopup)

- **`HomePopup.tsx`**：首頁彈窗元件，localStorage 追蹤「僅顯示一次」
- **Home.tsx 整合**：`<HomePopup />` 放入首頁 JSX
- **管理端**：AdminContent 彈窗 Tab 可新增/編輯/刪除/啟用彈窗

#### 🎬 影片管理拖曳排序重寫 (AdminVideos)

- **拖曳排序**：HTML5 Drag & Drop，拖曳手柄 `⠿`，拖曳過程視覺回饋
- **直接編輯排序號**：每列提供數字輸入欄位，即時修改 sort_order
- **上移/下移按鈕**：▲ ▼ 快捷操作
- **儲存排序按鈕**：呼叫 `videoService.reorder()` 批次更新後端
- **卡片/列表檢視**：同時支援 ☰清單 / ▪小圖 / ◻中圖 / ⬜大圖 四種模式

#### 🃏 課程/文章/影片 卡片檢視切換

- **AdminArticles**：新增 ViewMode 切換（清單/小圖/中圖/大圖），卡片顯示縮圖、標題、分類、瀏覽數、精選標記、狀態徽章
- **AdminCourses**：相同 ViewMode 切換，卡片顯示縮圖、課程名、價格浮標、難度、課堂數
- **AdminVideos**：同時具備拖曳排序 + 四種檢視模式

#### 📄 新增/修改檔案

| 操作 | 檔案                                                         |
| ---- | ------------------------------------------------------------ |
| 新增 | `database/migrations/003_site_content_and_popup.sql`         |
| 新增 | `backend/routes/content.ts`                                  |
| 新增 | `frontend/src/services/content.service.ts`                   |
| 新增 | `frontend/src/components/sections/HomePopup.tsx`             |
| 修改 | `backend/index.ts` — 註冊 content 路由                       |
| 修改 | `frontend/src/pages/admin/AdminContent.tsx` — 完全重寫       |
| 修改 | `frontend/src/pages/Home.tsx` — 加入 HomePopup               |
| 修改 | `frontend/src/services/video.service.ts` — 新增 reorder 方法 |
| 修改 | `frontend/src/pages/admin/AdminVideos.tsx` — 完全重寫        |
| 修改 | `frontend/src/pages/admin/AdminArticles.tsx` — 加入卡片檢視  |
| 修改 | `frontend/src/pages/admin/AdminCourses.tsx` — 加入卡片檢視   |

#### 📄 相關文件

- 完整報告：[REPORTS/ADMIN_CONTENT_VIDEO_CARDVIEW_2026-02-11T18-00-00+08-00.md](REPORTS/ADMIN_CONTENT_VIDEO_CARDVIEW_2026-02-11T18-00-00+08-00.md)

---

### 2026-02-11 - 課程內頁標題階層 / 用戶管理篩選排序 / 文章精選功能整合

#### 💎 課程內頁 Prose 標題階層 (prism 主題)

- **`.prose-theme-prism` CSS**: 新增紫色系 heading 階層覆寫（h1 紫色漸層、h2 紫色左邊線、h3 `›` 前綴紫色、h4 縮排）
- **CourseDetail 套用**: `prose prose-invert` → `prose prose-invert prose-theme-prism`
- **附加樣式**: a/blockquote/code/hr 統一紫色 (#b388ff) 裝飾

#### 👥 用戶管理排序 + 多重篩選 (AdminUsers)

- **DataTable `sortable`**: 所有欄位啟用排序（姓名、Email、角色、狀態、私密相簿、註冊時間）
- **三組篩選器**: 角色（管理員/一般用戶）、狀態（活躍/停用）、私密相簿（已啟用/未啟用）
- **`useMemo` 過濾**: 搜尋 + 三篩選器合併計算
- **結果計數器**: 「顯示 X / Y 位用戶」即時回饋

#### ⭐ 文章管理精選功能強化 (AdminArticles)

- **獨立精選欄位**: 從標題副文字改為獨立 `is_featured` 欄位，含 `sortValue` 排序
- **快速切換按鈕**: 表格內直接點擊 `★ 精選 / ☆ 普通` 切換，呼叫 `articleService.update()` 即時更新
- **精選篩選器**: 新增下拉式「全部文章 / ★ 僅精選 / ☆ 普通文章」篩選
- **`useMemo` client-side 過濾**: 精選篩選不重新呼叫 API，本地過濾
- **篩選計數**: 選擇精選/普通時顯示「★ 精選文章：N 篇」

#### 📄 修改檔案

- `frontend/src/index.css` — 新增 `.prose-theme-prism` CSS (~50 行)
- `frontend/src/pages/CourseDetail.tsx` — 加入 `prose-theme-prism` class
- `frontend/src/pages/admin/AdminUsers.tsx` — 完全重寫含排序+篩選
- `frontend/src/pages/admin/AdminArticles.tsx` — 精選獨立欄位+切換按鈕+篩選器

#### 📄 相關文件

- 完整報告：[REPORTS/ADMIN_FEATURED_FILTER_SORT_2026-02-11T10-00-00+08-00.md](REPORTS/ADMIN_FEATURED_FILTER_SORT_2026-02-11T10-00-00+08-00.md)

---

### 2026-02-07 - UI / 後台管理功能增強

#### 🎨 文章內頁標題階層

- **prose heading 覆寫**: h1 金色漸層+底線、h2 左邊線+1.25rem 縮排、h3 `›`前綴+2.25rem 縮排、h4 3rem 縮排
- **跟隨縮排**: heading 後方的 p/ul/ol 自動跟隨上層縮排
- **主題一致化**: blockquote、code、link、hr 統一金色系裝飾

#### 📐 4 欄精緻卡片

- **Articles / Courses**: `lg:grid-cols-3` → `lg:grid-cols-3 xl:grid-cols-4`
- **卡片高度縮減**: aspect-video → aspect-[16/10]、padding 縮小、描述行數減少
- **gap 微調**: 4 欄佈局搭配較小的 gap 保持視覺平衡

#### 🐛 Dashboard 修復

- **欄位對齊**: 前端 interface 改為 `userCount/courseCount/orderCount/monthlyRevenue` 對齊後端 API
- **新增「本月營收」**: 取代不存在的「總影片數」欄位
- **移除無效存取**: 後端未提供 recentUsers/recentOrders，改為空陣列

#### 🔀 後台排序功能

- **DataTable 升級**: 新增 `sortable` / `sortValue` 屬性，三態排序 (null→asc→desc→null)
- **排序指示器**: 表頭 ▲▼ 圖示即時回饋排序狀態
- **三頁面啟用**: 影片管理、課程管理、文章管理皆可點擊表頭排序

#### 📄 相關文件

- 完整報告：[REPORTS/UI_ADMIN_ENHANCEMENTS_2026-02-07T10-00-00+08-00.md](REPORTS/UI_ADMIN_ENHANCEMENTS_2026-02-07T10-00-00+08-00.md)

---

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

### 2026-02-10T02-00-00+08:00 - 全域 UX 動畫系統升級

#### 🎯 概述

針對整體專案「互動回饋不足、頁面切換生硬」問題，建立完整的 CSS 動畫系統，涵蓋頁面轉場、滾動入場、Navbar/Footer 互動、表單聚焦、Modal 進場、按鈕微互動等，並完整支援 `prefers-reduced-motion` 無障礙設定。

#### ✨ 新增全域動畫基礎設施

| 檔案                                   | 說明                                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `tailwind.config.ts`                   | 新增 8 種動畫 utility（fade-in、fade-in-up、fade-in-down、slide-in-right/left、scale-in、stagger-fade-in）        |
| `index.css`                            | 新增 ~150 行動畫 CSS：頁面轉場、滾動入場、stagger 延遲、手機選單動畫、按鈕按壓、link 底線、Modal 進場、表單聚焦線 |
| `hooks/useScrollReveal.ts`             | 新建 IntersectionObserver hook，自動偵測 `.scroll-reveal` 子元素並觸發 `.is-visible` 入場動畫                     |
| `components/layout/PageTransition.tsx` | 新建路由切換動畫包裝器，監聽 `location.pathname` 變化觸發 CSS enter/exit 動畫（200ms exit → 400ms enter）         |

#### 🔧 元件級動畫增強

| 元件               | 改動                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **Layout.tsx**     | `<Outlet />` 包裝 `<PageTransition>` 實現頁面轉場                                            |
| **Navbar.tsx**     | 手機選單加入 `mobile-menu-enter` clip-path 展開動畫 + 各選項 `mobile-menu-item` stagger 進場 |
| **Footer.tsx**     | 導航連結加入 `link-underline` 底線動畫，社群圖示增加 `hover:shadow-[0_0_12px]` 光暈效果      |
| **Courses.tsx**    | 課程卡片使用 `useScrollReveal` + `scroll-reveal` + `getStaggerClass()` 實現依序淡入進場      |
| **Articles.tsx**   | 文章卡片同上，滾動入場 + stagger 延遲動畫                                                    |
| **Dialog.tsx**     | 覆蓋層 `modal-overlay-enter`（淡入）+ 內容 `modal-content-enter`（縮放彈入）                 |
| **GlowButton.tsx** | 新增 `focus-visible:ring-2` 鍵盤無障礙焦點環                                                 |
| **PillButton.tsx** | 新增 `focus-visible:ring-2` 鍵盤無障礙焦點環                                                 |

#### 🎨 表單聚焦一致性

| 元件                | 修正                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| **Select.tsx**      | 新增 `focus:ring-2 focus:ring-{theme}/30` 三主題一致聚焦環                  |
| **Textarea.tsx**    | 新增 `focus:ring-2 focus:ring-{theme}/30` 三主題一致聚焦環                  |
| **SearchInput.tsx** | 新增 `focus:ring-2 focus:ring-luxe-gold/20` + `transition-all duration-300` |

#### ♿ 無障礙支援

- `@media (prefers-reduced-motion: reduce)` 媒體查詢全域停用所有動畫
- `useScrollReveal` 偵測到減少動畫偏好時，直接標記 `.is-visible` 跳過動畫
- `PageTransition` 尊重 `prefers-reduced-motion` 設定

#### 📄 完整修改檔案清單

- `frontend/tailwind.config.ts` — 8 新動畫 + keyframes
- `frontend/src/index.css` — ~150 行動畫 CSS
- `frontend/src/hooks/useScrollReveal.ts` — **新建**
- `frontend/src/components/layout/PageTransition.tsx` — **新建**
- `frontend/src/components/layout/Layout.tsx` — PageTransition 整合
- `frontend/src/components/layout/Navbar.tsx` — 手機選單動畫
- `frontend/src/components/layout/Footer.tsx` — link-underline + 光暈
- `frontend/src/pages/Courses.tsx` — stagger 入場動畫
- `frontend/src/pages/Articles.tsx` — stagger 入場動畫
- `frontend/src/components/ui/Dialog.tsx` — Modal 進場動畫
- `frontend/src/components/ui/buttons/GlowButton.tsx` — focus-visible
- `frontend/src/components/ui/buttons/PillButton.tsx` — focus-visible
- `frontend/src/components/ui/form/Select.tsx` — focus ring
- `frontend/src/components/ui/form/Textarea.tsx` — focus ring
- `frontend/src/components/ui/form/SearchInput.tsx` — focus ring

---

### 2026-02-09T22-00-00+08:00 - 全域 UI 美化：Dialog 替換 + Tooltip 即時提示系統

#### 🎨 新增全域 Tooltip 元件

- **`components/ui/Tooltip.tsx`**: 新建 CSS-only Tooltip 元件，取代原生 `title` 屬性
  - **零延遲**: hover 即顯示，移開即消失（0.1s 過渡）
  - **12px 字體**: 精緻不干擾主內容
  - **四方向支持**: `top`（預設）、`bottom`、`left`、`right`
  - **箭頭指示**: 每個方向都有正確的 CSS 三角箭頭
  - **z-index 9999**: 確保不被遮擋

#### 🔄 替換所有原生 confirm() / alert()

將所有頁面的原生瀏覽器 `confirm()` 和 `alert()` 替換為美化版 `useDialog()` 系統：

| 檔案                | 替換數量 | 說明                                                                 |
| ------------------- | -------- | -------------------------------------------------------------------- |
| `ArticleEditor.tsx` | 8 處     | 草稿恢復、載入失敗、儲存成功/失敗、預覽/發布驗證、刪除分類、返回確認 |
| `CourseEditor.tsx`  | 8 處     | 同上（課程版本）                                                     |
| `AdminArticles.tsx` | 1 處     | 刪除文章確認                                                         |
| `AdminCourses.tsx`  | 1 處     | 刪除課程確認                                                         |
| `Checkout.tsx`      | 5 處     | LINE Pay / 藍新 / 綠界 / 街口 / Apple/Google Pay 付款導向提示        |

#### 🏷️ 替換所有原生 title 為 Tooltip 元件

| 檔案                                      | 替換數量  | 說明                                                          |
| ----------------------------------------- | --------- | ------------------------------------------------------------- |
| `components/editor/RichTextEditor.tsx`    | 26 個按鈕 | 舊版 Tiptap 工具列全部按鈕                                    |
| `components/ui/editor/RichTextEditor.tsx` | 17 個按鈕 | 新版 Tiptap 工具列（透過修改 `ToolbarButton` 子元件一次完成） |
| `ArticleEditor.tsx`                       | 4 處      | 說明、儲存草稿、預覽並發布、側邊欄收合                        |
| `CourseEditor.tsx`                        | 1 處      | 說明按鈕                                                      |

#### 🐛 修復：useDialog() 宣告順序

- 將 `const dialog = useDialog()` 移至元件最上方（hooks 區域），修復 `dialog` 在 `useEffect` 依賴陣列中「使用在宣告之前」的 TypeScript 編譯錯誤

#### 📄 修改檔案清單

- `frontend/src/components/ui/Tooltip.tsx` — 新建
- `frontend/src/components/ui/index.ts` — 新增 Tooltip 匯出
- `frontend/src/index.css` — 新增 Tooltip CSS 樣式系統
- `frontend/src/components/editor/RichTextEditor.tsx` — 26 個 Tooltip 包裝
- `frontend/src/components/ui/editor/RichTextEditor.tsx` — ToolbarButton 改用 Tooltip
- `frontend/src/pages/admin/ArticleEditor.tsx` — Dialog + Tooltip
- `frontend/src/pages/admin/CourseEditor.tsx` — Dialog + Tooltip
- `frontend/src/pages/admin/AdminArticles.tsx` — Dialog
- `frontend/src/pages/admin/AdminCourses.tsx` — Dialog
- `frontend/src/pages/Checkout.tsx` — Dialog

---

### 2026-02-09T18-00-00+08:00 - 文章/課程編輯器載入既有資料修復

#### 🐛 問題描述

- 從文章管理列表點擊「編輯」進入 `/admin/articles/:id/edit` 時，表單為空白，未載入 DB 中的文章資料
- 課程編輯器 `/admin/courses/:id/edit` 同樣問題
- 側邊欄（slug、摘要、分類、標籤、封面圖片、狀態）也全部空白

#### 🔍 根本原因

兩個編輯器（ArticleEditor / CourseEditor）都只有在 `isNew === true` 時從 localStorage 載入草稿的邏輯，
**完全沒有 `useEffect` 在 `isNew === false`（編輯模式）時呼叫 API 載入既有資料**。

#### ✅ 修復方案

| 檔案                                         | 修復內容                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/pages/admin/ArticleEditor.tsx` | 新增 `useEffect` 呼叫 `articleService.getByIdentifier(id)` 載入文章，映射 DB 欄位 → 前端欄位，填入表單 + Tiptap 編輯器 |
| `frontend/src/pages/admin/CourseEditor.tsx`  | 新增 `useEffect` 呼叫 `courseService.getById(id)` 載入課程，映射 DB 欄位 → 前端欄位，填入表單 + Tiptap 編輯器          |

#### 📋 欄位映射對照

**文章 (Article)**:

- `article_title` → `title`, `article_slug` → `slug`, `article_description` → `excerpt`
- `article_category` → `category`, `article_keywords` (逗號分隔) → `tags[]`
- `article_thumbnail_url` → `coverImage`, `article_content` → `content` + Tiptap editor

**課程 (Course)**:

- `course_title` → `title`, `course_slug` → `slug`, `course_description` → `description`
- `course_category` → `category`, `course_keywords` (逗號分隔) → `tags[]`
- `course_thumbnail_url` → `coverImage`, `course_content` → `content` + Tiptap editor
- `price` → `price`, `duration_minutes` → `duration`, `course_level` → `level`

---

### 2026-02-09T14-00-00+08:00 - 首頁 Three.js 水母球體手機版 RWD 縮放

#### 🎨 UI 調整

- **AbyssScene 手機版縮放**: 螢幕寬度 < 768px 時，水母球體自動縮小至 80%（`scale(0.8)`）
- **動態偵測**: 於 `resize` 事件中即時更新縮放比例，確保旋轉裝置方向也能正確切換
- **零效能影響**: 使用 Three.js 原生 `setScalar()` 方法，不需重建幾何體

#### 📄 修改檔案

- `frontend/src/components/three/AbyssScene.tsx` — 新增 `updateJellyfishScale()` 函式

---

### 2026-02-08T18-00-00+08:00 - 全專案 TypeScript 編譯錯誤 + SSR 水合問題全面修復

#### 問題描述

- 全專案 `npx tsc --noEmit` 存在 **20 項** TypeScript 編譯錯誤
- 多個元件存在 SSR 水合風險（`document`/`window`/`localStorage` 未加防護）
- `@/components/ui` barrel export 中 `Modal` 和 `ConfirmDialog` 名稱衝突

#### 根本原因分析

| 類別             | 問題                                                                                                                                         | 影響範圍                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Export 衝突**  | `ui/index.ts` 同時從 `overlay/` 和 `Dialog.tsx` 導出同名 `Modal`/`ConfirmDialog`，Dialog.tsx 版本覆蓋了原版，但缺少 `theme`/`className` 屬性 | AdminArticles、AdminCourses、AdminUsers、CoachPhotos         |
| **本地重複型別** | AdminUsers/AdminVideos 自行定義簡陋的本地 interface，缺少 API 回傳的欄位                                                                     | AdminUsers(6 處)、AdminVideos(1 處)                          |
| **Props 不相容** | ConfirmDialog 兩版 interface 屬性不同（`onCancel` vs `onClose`、`danger` vs `variant`）                                                      | AdminWhitelist                                               |
| **型別不匹配**   | `keywords` 應傳 `string[]` 卻傳了 `string`；`isLoading` 不存在於 AuthContextType                                                             | AdminArticles(2 處)、Checkout                                |
| **SSR 無防護**   | `document.body.style`、`localStorage`、`matchMedia` 在非 useEffect 中未加 typeof 檢查                                                        | overlay/Modal、overlay/Drawer、ThemeContext、LanguageContext |

#### 修復方案

**TypeScript 型別錯誤修復 (12 個檔案)：**

1. **Dialog.tsx** — `ModalProps` 新增 `theme`/`className` 屬性；`ConfirmDialogProps` 新增 `onCancel`/`danger` 向後兼容別名
2. **AdminSidebar.tsx** — 移除未使用的 `NavItem` interface
3. **AdminArticles.tsx** — `keywords` 從 `.join(",")` 改為直接傳陣列 `string[]`
4. **AdminUsers.tsx** — 移除本地 `AdminUser`/`PaginatedUsersResponse` 定義，改用 `@/types` 導入；移除 Toggle 不存在的 `theme` prop
5. **AdminVideos.tsx** — 移除本地 `AdminVideo` 定義，改用 `@/types` 導入
6. **AdminWhitelist.tsx** — 透過 Dialog.tsx 兼容修復，`onCancel`/`danger` 直接支援
7. **Checkout.tsx** — 移除未使用的 `useMemo`/`Input` import；`isLoading` 改為 `loading`
8. **CoachPhotos.tsx** — 透過 Dialog.tsx Modal 修復 `theme` 屬性

**SSR 水合問題修復 (4 個檔案)：**

9. **overlay/Modal.tsx** — `useEffect` 內 `document`/`window` 加入 `typeof` 防護
10. **overlay/Drawer.tsx** — 同上
11. **ThemeContext.tsx** — `setTheme`/`setColorMode` 中 `localStorage` 加入 `typeof window` 防護
12. **LanguageContext.tsx** — `setLanguage` 中 `localStorage`/`document` 加入防護；`useEffect` 初始化也加防護

#### 測試驗證

- ✅ `npx tsc --noEmit` 零錯誤零警告
- ✅ 所有 20 項編譯錯誤已消除
- ✅ SSR 環境下不會存取 `window`/`document`/`localStorage`
- ✅ Dialog.tsx Modal 完全兼容 overlay/Modal.tsx 的 API

---

### 2026-02-08 - CourseEditor 語法與型別錯誤修復

#### 問題描述

- CourseEditor.tsx 存在多項語法與型別錯誤，導致 TypeScript 編譯失敗
- 主要錯誤集中在括號不匹配、介面缺少屬性、型別不一致

#### 根本原因

1. **`handleRemoveTag` 缺少閉合括號** `}, []);` — 導致整個元件的括號層級錯位，引發連鎖的 `')' expected` 和 `'}' expected` 錯誤
2. **`CourseData` 介面缺少 `videoUrl` 屬性** — payload 引用了 `course.videoUrl` 但介面未定義
3. **`price` 型別不匹配** — `CourseData.price` 為 `string`，但 `courseService.create/update` 期待 `number`
4. **`Dialog.prompt` 型別定義錯誤** — `onConfirm` 由 hook 內部注入，但 Omit 未排除該屬性
5. **`status` 字面型別推斷** — payload 中 `status: "published"` 被推斷為 `string` 而非字面型別

#### 修復方案

1. 在 `handleRemoveTag` 回調末尾補上 `}, []);` 閉合
2. `CourseData` 介面新增 `videoUrl: string` 並在初始化物件中設定預設值
3. payload 中的 `price` 改為 `Number(course.price) || 0`
4. Dialog.tsx 的 `prompt` 方法型別改為 `Omit<PromptDialogProps, "isOpen" | "onClose" | "onConfirm">`
5. payload 中的 `status` 使用 `as const` 確保字面型別推斷

#### 修改文件 (2 個)

- `frontend/src/pages/admin/CourseEditor.tsx` — 括號修復、介面補全、型別轉換
- `frontend/src/components/ui/Dialog.tsx` — prompt 方法型別定義修正

#### 測試驗證

- ✅ 零 TypeScript 編譯錯誤
- ✅ 所有 Dialog.prompt 呼叫型別正確
- ✅ courseService.create/update 參數型別匹配

---

### 2026-02-07 - SSR 水合問題全面修復

#### 問題描述

- 手機版水合正常，桌面版出現水合不匹配
- 視窗尺寸切換時出現異常行為
- 典型的 SSR (Server-Side Rendering) 水合問題

#### 根本原因

1. **createPortal** 直接使用 `document.body` 沒有 SSR 檢查
2. **window API** 直接調用 `window.innerWidth/innerHeight`
3. **document.body.style** 修改缺少環境檢查
4. **Tiptap 3.x** BubbleMenu/FloatingMenu API 變更

#### 修復方案

1. **所有 Portal 組件** 添加 `mounted` 狀態防護
2. **window API** 使用前檢查 `typeof window !== "undefined"`
3. **document 操作** 添加環境檢查
4. **舊版 RichTextEditor** 移除不兼容的 BubbleMenu/FloatingMenu

#### 修改文件 (7 個)

- `components/admin/ArticlePreviewModal.tsx` - createPortal + mounted 防護
- `components/ui/GlobalSearch.tsx` - createPortal + mounted + document 檢查
- `components/ui/Dialog.tsx` - createPortal + mounted + window/document 檢查
- `components/ui/editor/RichTextEditor.tsx` - window API 防護
- `components/editor/RichTextEditor.tsx` - 移除 BubbleMenu/FloatingMenu
- `hooks/useRichTextEditor.ts` - 修正 import

#### 測試驗證

- ✅ 無 Hydration mismatch 警告
- ✅ 桌面/手機切換正常
- ✅ 所有 Modal/Dialog 正常運作
- ✅ 零 TypeScript 編譯錯誤

#### 詳細報告

- 詳見 `REPORTS/HYDRATION_FIX_2026-02-07T20-00-00+08-00.md`

---

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

### 2026-02-10: RWD 修復與文章卡片渲染異常修復

#### 問題

- 文章頁面（Articles）卡片完全不顯示（opacity: 0 卡住）
- `prism-bg` / `prism-accent` 等 Tailwind class 無效（缺少色盤鍵）
- `--luxe-bg` / `--luxe-surface` / `--luxe-muted` CSS 變數缺少 `:root` fallback
- Articles.tsx z-index wrapper 結構不一致
- Articles / ArticleDetail 缺少 `setTheme("luxe")` 呼叫

#### 修復

- **useScrollReveal.ts**: 重寫為 callback ref + MutationObserver，支援動態載入的內容
- **tailwind.config.ts**: prism/abyss 色盤新增 `bg` 和 `accent` 鍵
- **index.css**: `:root` 新增 `--luxe-bg/surface/muted` fallback 變數
- **Articles.tsx**: 統一 z-10 wrapper 結構 + setTheme("luxe")
- **ArticleDetail.tsx**: 新增 setTheme("luxe")

#### 完整報告

- 詳見 `REPORTS/RWD_ARTICLE_RENDERING_FIX_2026-02-10T15-00-00+08-00.md`

---

### 🔧 RWD 排版與 Three.js 場景修復 (2026-02-07)

#### 問題

- `html { font-size: 20px }` 固定值使手機上所有 rem 值膨脹 25%（文字、間距全部過大）
- AbyssScene 水母球在 iPhone SE (375px) 上佔螢幕寬度 74%，幾乎填滿畫面
- PrismScene 水晶無手機縮放，在小螢幕佔比 58%
- Navbar `md:px-16` 在平板 (768px) 上水平 padding 過多

#### 修復

- **index.css**: `font-size: clamp(16px, 0.5vw + 14.5px, 20px)` 漸進式響應（375px→16.4px, 768px→18.3px, 1100px+→20px）
- **AbyssScene.tsx**: 分級縮放（<480px: 0.45, <768px: 0.6, ≥768px: 1.0）+ 手機端攝影機晃動從 2→0.5
- **PrismScene.tsx**: 新增分級縮放（<480px: 0.55, <768px: 0.7）+ 碎片半徑同步縮小 + 攝影機跟隨幅度降低 + resize 回調
- **Navbar.tsx**: `md:px-16` → `md:px-8 lg:px-16`，`py-4 sm:py-6` → `py-3 sm:py-4 md:py-5`

#### 完整報告

- 詳見 `REPORTS/RWD_TYPOGRAPHY_FIX_2026-02-07T10-00-00+08-00.md`

---
